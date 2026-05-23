/**
 * T072 — Customer cancellation policy integration test
 *
 * PRD §9.3 cancellation rules:
 *   1. pending  → cancel → full refund, no fee
 *   2. accepted, accepted_at < 1 hour ago → cancel → full refund
 *   3. accepted, accepted_at >= 1 hour ago → cancel → 20% fee, 80% refund
 *   4. on_the_way or later → cancel → 409 (order_cannot_be_cancelled)
 *
 * WHY THIS TEST FAILS NOW:
 *   The cancel endpoint (POST /v1/bookings/:id/cancel) exists in
 *   BookingsController and calls BookingsService.cancelBooking, but the
 *   response body does NOT yet include feeAmount / refundAmount fields.
 *   Additionally cancel-policy.service.ts does not exist as a separate
 *   service.  The integration tests asserting feeAmount / refundAmount in
 *   the response body will fail until the endpoint is updated to return
 *   those fields.  The 409 scenario for on_the_way/later should already
 *   pass once the route is reachable with a valid seed.
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

const TEST_JWT_SECRET = 'customer-cancel-test-secret-32chars!';
const ORDER_TOTAL = 10000; // fils / halala — used across all scenarios

jest.setTimeout(120_000);

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let companyId: string;
let customerId: string;
let slotId: string;
let addressId: string;
let customerToken: string;

// ---------------------------------------------------------------------------
// Container + app lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_cancel_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_cancel_test`;

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
  process.env['S3_BUCKET'] = 'senam-cancel-test';
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

  await seedCancelTestData(dataSource);

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
  customerToken = jwtService.sign({
    sub: customerId,
    principal: 'customer',
    roles: [],
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

async function seedCancelTestData(ds: DataSource): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('cancel-cat', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'cancel-svc', 'خدمة الإلغاء', 60, true)
     RETURNING id`,
    [cat.id],
  );

  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Cancel Co LLC', 'Cancel Co', 'cancel-co', 'active', 1500)
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
     VALUES ($1, $2, $3, 60, true)`,
    [companyId, svc.id, ORDER_TOTAL],
  );

  const [customer] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('cancel-cust@example.com', 'ar', 'active')
     RETURNING id`,
  );
  customerId = customer.id;

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Cancel St', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [customerId, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
  );
  addressId = addr.id;

  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T14:00:00+03:00`;
  const slotEnd = `${today}T15:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 10, 10)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );
  slotId = slot.id;
}

// ---------------------------------------------------------------------------
// Helper: insert an order at a given status with an explicit accepted_at
// ---------------------------------------------------------------------------

async function insertOrder(
  status: string,
  acceptedAtExpr: string | null,
): Promise<string> {
  const acceptedAtClause = acceptedAtExpr ?? 'NULL';

  const [order] = await dataSource.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, accepted_at, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, $5, 0, $5, $6, 'cod', $7, ${acceptedAtClause}, 1)
     RETURNING id`,
    [
      customerId,
      companyId,
      slotId,
      addressId,
      ORDER_TOTAL,
      Math.round(ORDER_TOTAL * 0.15),
      status,
    ],
  );

  return order!.id;
}

// ---------------------------------------------------------------------------
// Scenario 1 — pending order: full refund, no fee
// ---------------------------------------------------------------------------

describe('T072 Scenario 1 — cancel pending order (full refund, no fee)', () => {
  let pendingOrderId: string;

  beforeAll(async () => {
    pendingOrderId = await insertOrder('pending', null);
  });

  it('200 — cancels a pending order with full refund and zero fee', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${pendingOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body).toMatchObject(
      expect.objectContaining({
        status: 'cancelled',
      }),
    );

    // feeAmount and refundAmount are asserted once the endpoint exposes them
    expect(res.body).toHaveProperty('feeAmount', 0);
    expect(res.body).toHaveProperty('refundAmount', ORDER_TOTAL);
  });

  it('DB: order status is cancelled after the call', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [pendingOrderId],
    );
    expect(rows[0]!.status).toBe('cancelled');
  });

  it('DB: slot capacity_remaining is restored by 1', async () => {
    const rows = await dataSource.query<{ capacity_remaining: number }[]>(
      `SELECT capacity_remaining FROM time_slots WHERE id = $1`,
      [slotId],
    );
    // Started at 10, one order was inserted, cancellation should return it to 10
    expect(rows[0]!.capacity_remaining).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — accepted order cancelled within 1 hour: full refund
// ---------------------------------------------------------------------------

describe('T072 Scenario 2 — cancel accepted order within 1 hour (full refund)', () => {
  let recentlyAcceptedOrderId: string;

  beforeAll(async () => {
    // accepted_at is 30 minutes ago — well within the 1-hour free-cancel window
    recentlyAcceptedOrderId = await insertOrder(
      'accepted',
      `now() - interval '30 minutes'`,
    );
  });

  it('200 — cancels an accepted-within-1h order with full refund and zero fee', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${recentlyAcceptedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body).toMatchObject(
      expect.objectContaining({
        status: 'cancelled',
      }),
    );

    expect(res.body).toHaveProperty('feeAmount', 0);
    expect(res.body).toHaveProperty('refundAmount', ORDER_TOTAL);
  });

  it('DB: order status is cancelled', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [recentlyAcceptedOrderId],
    );
    expect(rows[0]!.status).toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — accepted order cancelled after 1 hour: 20% fee, 80% refund
// ---------------------------------------------------------------------------

describe('T072 Scenario 3 — cancel accepted order after 1 hour (20% fee, 80% refund)', () => {
  let lateAcceptedOrderId: string;

  beforeAll(async () => {
    // accepted_at is 90 minutes ago — past the 1-hour free-cancel window
    lateAcceptedOrderId = await insertOrder(
      'accepted',
      `now() - interval '90 minutes'`,
    );
  });

  it('200 — cancels with 20% fee and 80% refund after >1h since acceptance', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${lateAcceptedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body).toMatchObject(
      expect.objectContaining({
        status: 'cancelled',
      }),
    );

    const expectedFee = Math.round(ORDER_TOTAL * 0.2);
    const expectedRefund = Math.round(ORDER_TOTAL * 0.8);

    expect(res.body).toHaveProperty('feeAmount', expectedFee);
    expect(res.body).toHaveProperty('refundAmount', expectedRefund);
  });

  it('DB: order status is cancelled', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [lateAcceptedOrderId],
    );
    expect(rows[0]!.status).toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — on_the_way: cannot cancel (409)
// ---------------------------------------------------------------------------

describe('T072 Scenario 4 — cancel on_the_way order returns 409', () => {
  let onTheWayOrderId: string;

  beforeAll(async () => {
    onTheWayOrderId = await insertOrder(
      'on_the_way',
      `now() - interval '2 hours'`,
    );
  });

  it('409 — order_cannot_be_cancelled when status is on_the_way', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${onTheWayOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(409);

    expect(res.body).toHaveProperty('status', 409);
  });

  it('DB: order status is still on_the_way after rejected cancel', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [onTheWayOrderId],
    );
    expect(rows[0]!.status).toBe('on_the_way');
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — in_progress: cannot cancel (409)
// ---------------------------------------------------------------------------

describe('T072 Scenario 5 — cancel in_progress order returns 409', () => {
  let inProgressOrderId: string;

  beforeAll(async () => {
    inProgressOrderId = await insertOrder(
      'in_progress',
      `now() - interval '3 hours'`,
    );
  });

  it('409 — order_cannot_be_cancelled when status is in_progress', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${inProgressOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(409);

    expect(res.body).toHaveProperty('status', 409);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: auth guard
// ---------------------------------------------------------------------------

describe('T072 auth guard — cancel endpoint', () => {
  it('401 — unauthenticated cancel attempt returns 401', async () => {
    const someId = '00000000-0000-0000-0000-000000000001';
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${someId}/cancel`)
      .expect(401);

    expect(res.body).toHaveProperty('status', 401);
  });

  it('404 — non-existent order id returns 404', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/v1/bookings/00000000-0000-0000-0000-000000000099/cancel')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(404);

    expect(res.body).toHaveProperty('status', 404);
  });
});
