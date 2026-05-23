/**
 * T058 — First-to-accept race condition integration test
 *
 * Invariant: When 50 provider sessions fire concurrent POST /v1/bookings/:id/status
 * { to: "accepted" } for the SAME pending order, exactly ONE must succeed (200)
 * and the remaining 49 must be rejected with 409 Conflict. After all requests
 * settle, orders.status must be "accepted" in the database.
 *
 * Setup:
 *  - 1 customer creates 1 pending order
 *  - 50 distinct company_user rows (role=owner) in the same company each
 *    receive a JWT minted with { principal: 'provider', roles: ['provider_owner'] }
 *  - All 50 fire the status-transition request simultaneously via Promise.all
 *
 * Uses real PostgreSQL 15 (postgis/postgis:15-3.4) + Redis 7 via Testcontainers.
 *
 * The POST /v1/bookings/:id/status route does NOT exist yet — all 50 requests
 * will return 404 until the route is implemented, causing this test to FAIL.
 * Once implemented with a proper DB-level race guard (SELECT FOR UPDATE or
 * optimistic locking), the test PASSES.
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONCURRENT_PROVIDERS = 50;
const TEST_JWT_SECRET = 'first-to-accept-test-secret-32chars!!';

jest.setTimeout(120_000);

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let companyId: string;
let orderId: string;
/** JWT tokens for each of the 50 provider sessions */
let providerTokens: string[];

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_first_accept_test',
      POSTGRES_USER: 'senam',
      POSTGRES_PASSWORD: 'senam_pw',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .withStartupTimeout(60_000)
    .start();

  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .withStartupTimeout(30_000)
    .start();

  const pgHost = pgContainer.getHost();
  const pgPort = pgContainer.getMappedPort(5432);
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_first_accept_test`;

  const redisHost = redisContainer.getHost();
  const redisPort = redisContainer.getMappedPort(6379);
  const redisUrl = `redis://${redisHost}:${redisPort}`;

  process.env['DATABASE_URL'] = pgUrl;
  process.env['REDIS_URL'] = redisUrl;
  process.env['JWT_SECRET'] = TEST_JWT_SECRET;
  process.env['JWT_ACCESS_TTL_SECONDS'] = '900';
  process.env['JWT_REFRESH_TTL_SECONDS'] = '86400';
  process.env['NODE_ENV'] = 'test';
  process.env['MYFATOORAH_API_KEY'] = 'dummy';
  process.env['MYFATOORAH_WEBHOOK_SECRET'] = 'dummy';
  process.env['S3_ENDPOINT'] = 'http://localhost:9000';
  process.env['S3_BUCKET'] = 'senam-first-accept-test';
  process.env['S3_ACCESS_KEY_ID'] = 'dummy';
  process.env['S3_SECRET_ACCESS_KEY'] = 'dummy';
  process.env['OTP_RATE_LIMIT_ISSUE_PER_HOUR'] = '10000';
  process.env['OTP_RATE_LIMIT_VERIFY_ATTEMPTS'] = '10000';
  // Long timeout — we don't want the dispatch processor interfering during the test
  process.env['DISPATCH_ATTEMPT_TIMEOUT_MS'] = '300000';
  process.env['DISPATCH_MAX_ATTEMPTS'] = '3';

  dataSource = new DataSource({
    type: 'postgres',
    url: pgUrl,
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '../../src/modules/**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '../../migrations/*{.ts,.js}')],
    migrationsTableName: 'migrations',
  });
  await dataSource.initialize();
  await dataSource.runMigrations({ transaction: 'all' });

  await seedFirstAcceptData(dataSource);

  const { AppModule } = await import('../../src/app.module.js');
  const { AllExceptionsFilter } = await import(
    '../../src/common/filters/all-exceptions.filter.js'
  );
  const { CorrelationIdInterceptor } = await import(
    '../../src/common/interceptors/correlation-id.interceptor.js'
  );

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  // Mint one JWT per provider session
  const jwtService = app.get(JwtService);
  providerTokens = (
    await dataSource.query<{ id: string }[]>(
      `SELECT id FROM company_users WHERE company_id = $1 ORDER BY created_at ASC`,
      [companyId],
    )
  ).map((cu) =>
    jwtService.sign({
      sub: cu.id,
      principal: 'provider',
      roles: ['provider_owner'],
      companyId,
    }),
  );

  // Sanity: we should have exactly CONCURRENT_PROVIDERS tokens
  if (providerTokens.length !== CONCURRENT_PROVIDERS) {
    throw new Error(
      `Expected ${CONCURRENT_PROVIDERS} provider tokens, got ${providerTokens.length}`,
    );
  }
});

afterAll(async () => {
  await app?.close();
  await dataSource?.destroy();
  await pgContainer?.stop();
  await redisContainer?.stop();
});

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedFirstAcceptData(ds: DataSource): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('accept-cat', 'خدمة', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'accept-svc', 'خدمة القبول', 60, true)
     RETURNING id`,
    [cat.id],
  );

  // One company shared by all 50 provider sessions
  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Race Accept Co LLC', 'Race Accept Co', 'race-accept-co', 'active', 1500)
     RETURNING id`,
  );
  companyId = comp.id;

  await ds.query(
    `INSERT INTO company_service_areas (company_id, area)
     VALUES ($1, ST_GeomFromGeoJSON($2)::geography)`,
    [
      companyId,
      JSON.stringify({
        type: 'MultiPolygon',
        coordinates: [
          [[[50.5, 24.4], [51.9, 24.4], [51.9, 26.2], [50.5, 26.2], [50.5, 24.4]]],
        ],
      }),
    ],
  );

  await ds.query(
    `INSERT INTO company_services (company_id, service_id, price, duration_minutes, is_active)
     VALUES ($1, $2, 6000, 60, true)`,
    [companyId, svc.id],
  );

  // 50 distinct company_users (all owners) — each gets its own JWT session
  for (let i = 0; i < CONCURRENT_PROVIDERS; i++) {
    await ds.query(
      `INSERT INTO company_users (company_id, email, display_name, role, status)
       VALUES ($1, $2, $3, 'owner', 'active')`,
      [companyId, `accept-owner-${i}@race-co.qa`, `Owner ${i}`],
    );
  }

  // One customer and one pending order — the target of all 50 concurrent accepts
  const [customer] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('accept-cust@example.com', 'ar', 'active')
     RETURNING id`,
  );

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Accept Race St', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [customer.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
  );

  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T13:00:00+03:00`;
  const slotEnd = `${today}T14:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 5, 5)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );

  // Insert the order directly in pending state
  const [order] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 6000, 0, 6000, 900, 'cod', 'pending', 1)
     RETURNING id`,
    [customer.id, companyId, slot.id, addr.id],
  );
  orderId = order.id;

  // Seed initial status history
  await ds.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id)
     VALUES ($1, NULL, 'pending', 'customer', $2)`,
    [orderId, customer.id],
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T058 — First-to-accept race condition', () => {
  it(
    'exactly 1 of 50 concurrent ACCEPT requests succeeds; 49 return 409',
    async () => {
      const httpServer = app.getHttpServer();

      // Fire all 50 concurrent status-transition requests in true parallel
      const results = await Promise.all(
        Array.from({ length: CONCURRENT_PROVIDERS }, (_, i) =>
          supertest(httpServer)
            .post(`/v1/bookings/${orderId}/status`)
            .set('Authorization', `Bearer ${providerTokens[i]}`)
            .send({ to: 'accepted' }),
        ),
      );

      const statusCodes = results.map((r) => r.status);
      const successes = statusCodes.filter((s) => s === 200 || s === 201);
      const conflicts = statusCodes.filter((s) => s === 409);

      // Primary invariant: exactly one provider wins
      // (Will fail with 50× 404 until the route is implemented)
      expect(successes).toHaveLength(1);

      // All other 49 must be 409 Conflict
      expect(conflicts).toHaveLength(CONCURRENT_PROVIDERS - 1);
    },
    90_000,
  );

  it('orders.status is "accepted" in the database after the race', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(rows[0]!.status).toBe('accepted');
  });

  it('order_status_history has exactly one accepted row for this order', async () => {
    const rows = await dataSource.query<{ to_status: string }[]>(
      `SELECT to_status FROM order_status_history
       WHERE order_id = $1 AND to_status = 'accepted'`,
      [orderId],
    );
    // Exactly one provider accepted — no duplicates
    expect(rows).toHaveLength(1);
  });

  it('the winning response body contains { status: "accepted" }', async () => {
    // Re-assert the shape via a GET on the bookings endpoint
    // (Customer can still read their own booking)
    const jwtService = app.get(JwtService);
    const customerRows = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM users WHERE email = 'accept-cust@example.com'`,
    );
    const customerId = customerRows[0]!.id;
    const customerToken = jwtService.sign({
      sub: customerId,
      principal: 'customer',
      roles: [],
    });

    const res = await supertest(app.getHttpServer())
      .get(`/v1/bookings/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('status', 'accepted');
    expect(res.body).toHaveProperty('id', orderId);
  });
});
