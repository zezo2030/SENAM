/**
 * T056 — Order lifecycle integration test
 *
 * Tests the full status-transition lifecycle of a booked order via the
 * provider-facing POST /v1/bookings/:id/status endpoint:
 *
 *   pending → accepted → on_the_way → arrived → in_progress → completed
 *
 * Also asserts:
 *  - Each step appends a row to order_status_history
 *  - Illegal transitions (pending → in_progress) return 409
 *  - On "completed", a commission_accruals row exists
 *
 * Uses real PostgreSQL 15 (postgis/postgis:15-3.4) + Redis 7 via Testcontainers.
 * The POST /v1/bookings/:id/status route does NOT exist yet (T059-T068 implement
 * it), so all status-transition tests will fail with 404 until the route is added.
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

const TEST_JWT_SECRET = 'order-lifecycle-test-secret-32chars!';

jest.setTimeout(120_000);

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let companyId: string;
let companyUserId: string;
let orderId: string;
let providerToken: string;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_lifecycle_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_lifecycle_test`;

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
  process.env['S3_BUCKET'] = 'senam-lifecycle-test';
  process.env['S3_ACCESS_KEY_ID'] = 'dummy';
  process.env['S3_SECRET_ACCESS_KEY'] = 'dummy';
  process.env['OTP_RATE_LIMIT_ISSUE_PER_HOUR'] = '10000';
  process.env['OTP_RATE_LIMIT_VERIFY_ATTEMPTS'] = '10000';
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

  await seedLifecycleData(dataSource);

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

  const jwtService = app.get(JwtService);
  providerToken = jwtService.sign({
    sub: companyUserId,
    principal: 'provider',
    roles: ['provider_owner'],
    companyId,
  });
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

async function seedLifecycleData(ds: DataSource): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('lifecycle-cat', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'lifecycle-svc', 'خدمة دورة الحياة', 60, true)
     RETURNING id`,
    [cat.id],
  );

  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Lifecycle Co LLC', 'Lifecycle Co', 'lifecycle-co', 'active', 1500)
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
     VALUES ($1, $2, 8000, 60, true)`,
    [companyId, svc.id],
  );

  const [ownerRow] = await ds.query<{ id: string }[]>(
    `INSERT INTO company_users (company_id, email, display_name, role, status)
     VALUES ($1, 'lifecycle-owner@co.qa', 'Lifecycle Owner', 'owner', 'active')
     RETURNING id`,
    [companyId],
  );
  companyUserId = ownerRow.id;

  const [customer] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('lifecycle-cust@example.com', 'ar', 'active')
     RETURNING id`,
  );

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Lifecycle St', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [customer.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
  );

  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T09:00:00+03:00`;
  const slotEnd = `${today}T10:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 3, 3)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );

  // Insert a pending order directly — skip the full booking flow for test speed
  const [order] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 8000, 0, 8000, 1200, 'cod', 'pending', 1)
     RETURNING id`,
    [customer.id, companyId, slot.id, addr.id],
  );
  orderId = order.id;

  // Seed initial order_status_history entry
  await ds.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id)
     VALUES ($1, NULL, 'pending', 'customer', $2)`,
    [orderId, customer.id],
  );
}

// ---------------------------------------------------------------------------
// Helper: transition order status via the API
// ---------------------------------------------------------------------------

async function transitionStatus(to: string): Promise<supertest.Response> {
  return supertest(app.getHttpServer())
    .post(`/v1/bookings/${orderId}/status`)
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ to });
}

// ---------------------------------------------------------------------------
// Tests — ordered: each step depends on the previous transition succeeding
// ---------------------------------------------------------------------------

describe('T056 — Order lifecycle: full status progression', () => {
  /**
   * These tests run in sequence. Jest's default `--runInBand` flag for
   * integration tests (as configured in package.json) ensures sequential
   * execution. Each test advances the order to the next state.
   *
   * ALL tests in this block FAIL with 404 until the
   * POST /v1/bookings/:id/status route is implemented.
   */

  it('POST /v1/bookings/:id/status {to: accepted} — 200, order is now accepted', async () => {
    const res = await transitionStatus('accepted');
    // Will be 404 until implemented
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'accepted');

    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(rows[0]!.status).toBe('accepted');
  });

  it('order_status_history has a row for pending → accepted', async () => {
    const rows = await dataSource.query<{ from_status: string | null; to_status: string }[]>(
      `SELECT from_status, to_status FROM order_status_history
       WHERE order_id = $1 AND to_status = 'accepted'`,
      [orderId],
    );
    // Will be empty until the status endpoint writes history rows
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.to_status).toBe('accepted');
  });

  it('POST /v1/bookings/:id/status {to: on_the_way} — 200, order is on_the_way', async () => {
    const res = await transitionStatus('on_the_way');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'on_the_way');

    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(rows[0]!.status).toBe('on_the_way');
  });

  it('order_status_history has a row for accepted → on_the_way', async () => {
    const rows = await dataSource.query<{ from_status: string; to_status: string }[]>(
      `SELECT from_status, to_status FROM order_status_history
       WHERE order_id = $1 AND to_status = 'on_the_way'`,
      [orderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.from_status).toBe('accepted');
  });

  it('POST /v1/bookings/:id/status {to: arrived} — 200, order is arrived', async () => {
    const res = await transitionStatus('arrived');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'arrived');
  });

  it('order_status_history has a row for on_the_way → arrived', async () => {
    const rows = await dataSource.query<{ from_status: string; to_status: string }[]>(
      `SELECT from_status, to_status FROM order_status_history
       WHERE order_id = $1 AND to_status = 'arrived'`,
      [orderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.from_status).toBe('on_the_way');
  });

  it('POST /v1/bookings/:id/status {to: in_progress} — 200, order is in_progress', async () => {
    const res = await transitionStatus('in_progress');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'in_progress');
  });

  it('order_status_history has a row for arrived → in_progress', async () => {
    const rows = await dataSource.query<{ from_status: string; to_status: string }[]>(
      `SELECT from_status, to_status FROM order_status_history
       WHERE order_id = $1 AND to_status = 'in_progress'`,
      [orderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.from_status).toBe('arrived');
  });

  it('POST /v1/bookings/:id/status {to: completed} — 200, order is completed', async () => {
    const res = await transitionStatus('completed');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'completed');

    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(rows[0]!.status).toBe('completed');
  });

  it('order_status_history has a row for in_progress → completed', async () => {
    const rows = await dataSource.query<{ from_status: string; to_status: string }[]>(
      `SELECT from_status, to_status FROM order_status_history
       WHERE order_id = $1 AND to_status = 'completed'`,
      [orderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.from_status).toBe('in_progress');
  });

  it('order_status_history contains all 5 provider transitions for this order', async () => {
    // pending (initial), accepted, on_the_way, arrived, in_progress, completed = 6 rows total
    const rows = await dataSource.query<{ to_status: string }[]>(
      `SELECT to_status FROM order_status_history
       WHERE order_id = $1
       ORDER BY at ASC`,
      [orderId],
    );
    const statuses = rows.map((r) => r.to_status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('accepted');
    expect(statuses).toContain('on_the_way');
    expect(statuses).toContain('arrived');
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('completed');
  });

  it('on completed: commission_accruals row exists for this order', async () => {
    // The status endpoint should write a commission_accruals row when completing
    const rows = await dataSource.query<{
      order_id: string;
      kind: string;
      commission_amount: string;
    }[]>(
      `SELECT order_id, kind, commission_amount FROM commission_accruals WHERE order_id = $1`,
      [orderId],
    );
    // Will be empty until the implementation writes this row on completion
    expect(rows.length).toBe(1);
    expect(rows[0]!.order_id).toBe(orderId);
    // COD payment method → kind should be 'cod'
    expect(rows[0]!.kind).toBe('cod');
    expect(Number(rows[0]!.commission_amount)).toBeGreaterThan(0);
  });
});

describe('T056 — Order lifecycle: illegal transition guard', () => {
  let illegalOrderId: string;

  beforeAll(async () => {
    // Seed a fresh pending order for illegal-transition testing
    const [customer] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO users (email, locale, status)
       VALUES ('illegal-cust@example.com', 'ar', 'active')
       RETURNING id`,
    );

    const [addr] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO addresses (user_id, label, line, location)
       VALUES ($1, 'Home', 'Illegal St', ST_GeomFromGeoJSON($2)::geography)
       RETURNING id`,
      [customer.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
    );

    const today = new Date().toISOString().slice(0, 10);
    const slotStart = `${today}T11:00:00+03:00`;
    const slotEnd = `${today}T12:00:00+03:00`;

    const [slot] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
       VALUES ($1, $2, $3, 2, 2)
       RETURNING id`,
      [companyId, slotStart, slotEnd],
    );

    const [order] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO orders (
         customer_id, company_id, slot_id, address_id,
         subtotal, discount, total, commission,
         payment_method, status, dispatch_attempt
       ) VALUES ($1, $2, $3, $4, 8000, 0, 8000, 1200, 'cod', 'pending', 1)
       RETURNING id`,
      [customer.id, companyId, slot.id, addr.id],
    );
    illegalOrderId = order.id;

    await dataSource.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id)
       VALUES ($1, NULL, 'pending', 'customer', $2)`,
      [illegalOrderId, customer.id],
    );
  });

  it('409 — skipping states (pending → in_progress) is rejected', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${illegalOrderId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ to: 'in_progress' })
      .expect(409); // Fails with 404 until implemented; once implemented must return 409

    expect(res.body).toHaveProperty('status', 409);
  });

  it('409 — going backwards (pending → cancelled via illegal enum) is rejected', async () => {
    // Moving to an invalid next state from pending should be rejected.
    // 'on_the_way' is not a valid next step from 'pending' (pending → accepted is the only valid step).
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${illegalOrderId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ to: 'on_the_way' })
      .expect(409); // Fails with 404 until implemented

    expect(res.body).toHaveProperty('status', 409);
  });

  it('order remains in pending after illegal transition attempts', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [illegalOrderId],
    );
    expect(rows[0]!.status).toBe('pending');
  });
});
