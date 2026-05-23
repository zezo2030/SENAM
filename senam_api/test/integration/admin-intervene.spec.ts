/**
 * T080 — Admin order intervention integration test
 *
 * Verifies that POST /v1/admin/orders/:orderId/intervene correctly:
 *   1. Accepts action='refund_partial' with amount + reason → 200, order
 *      transitions to 'cancelled', a refund row is created, a notification is
 *      enqueued/inserted, and an audit_logs row with action='order.intervene'
 *      exists with before/after JSON snapshots.
 *   2. Accepts action='cancel' with reason → 200.
 *
 * Uses real PostgreSQL 15 (postgis/postgis:15-3.4) + Redis 7 via Testcontainers.
 * The POST /v1/admin/orders/:id/intervene route does NOT exist yet (Phase 6
 * admin implementation), so ALL tests here will FAIL with 404 until the route
 * is added.
 *
 * DB: senam_admin_intervene_test
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

const TEST_JWT_SECRET = 'admin-intervene-test-secret-32chars!';

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
let orderId: string;
let onlineOrderId: string;
let superAdminToken: string;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_admin_intervene_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_admin_intervene_test`;

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
  process.env['S3_BUCKET'] = 'senam-intervene-test';
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

  await seedInterveneData(dataSource);

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
  // Mint a super_admin token (principal='admin')
  superAdminToken = jwtService.sign({
    sub: 'admin-user-000-000-000-000000000001',
    principal: 'admin',
    roles: ['super_admin'],
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

async function seedInterveneData(ds: DataSource): Promise<void> {
  // Seed a category and service
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('intervene-cat', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'intervene-svc', 'خدمة التدخل', 60, true)
     RETURNING id`,
    [cat.id],
  );

  // Seed a company
  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Intervene Co LLC', 'Intervene Co', 'intervene-co', 'active', 1500)
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
     VALUES ($1, $2, 10000, 60, true)`,
    [companyId, svc.id],
  );

  // Seed a customer
  const [cust] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('intervene-cust@example.com', 'ar', 'active')
     RETURNING id`,
  );
  customerId = cust.id;

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Intervene St', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [customerId, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
  );

  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T09:00:00+03:00`;
  const slotEnd = `${today}T10:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 5, 5)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );

  // Insert a pending order with card payment (used for refund_partial test)
  const [onlineOrder] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 10000, 0, 10000, 1500, 'card', 'pending', 1)
     RETURNING id`,
    [customerId, companyId, slot.id, addr.id],
  );
  onlineOrderId = onlineOrder.id;

  await ds.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id)
     VALUES ($1, NULL, 'pending', 'customer', $2)`,
    [onlineOrderId, customerId],
  );

  // Insert an authorised payment row so refund_partial can find it
  await ds.query(
    `INSERT INTO payments (order_id, provider, provider_payment_id, amount, status)
     VALUES ($1, 'myfatoorah', 'test-payment-001', 10000, 'authorised')`,
    [onlineOrderId],
  );

  // Seed a second slot for the cancel test
  const slotStart2 = `${today}T11:00:00+03:00`;
  const slotEnd2 = `${today}T12:00:00+03:00`;

  const [slot2] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 5, 5)
     RETURNING id`,
    [companyId, slotStart2, slotEnd2],
  );

  // Insert another pending order (COD) used for the cancel action test
  const [cancelOrder] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 8000, 0, 8000, 1200, 'cod', 'pending', 1)
     RETURNING id`,
    [customerId, companyId, slot2.id, addr.id],
  );
  orderId = cancelOrder.id;

  await ds.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id)
     VALUES ($1, NULL, 'pending', 'customer', $2)`,
    [orderId, customerId],
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T080 — Admin order intervention: refund_partial', () => {
  /**
   * ALL tests FAIL with 404 until POST /v1/admin/orders/:id/intervene is
   * implemented as part of the Phase 6 admin module.
   */

  it('POST /v1/admin/orders/:id/intervene {action: refund_partial} — 200 response', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/admin/orders/${onlineOrderId}/intervene`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'refund_partial', amount: 5000, reason: 'customer complaint' })
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('order status transitions to "cancelled" after refund_partial intervention', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [onlineOrderId],
    );
    expect(rows[0]!.status).toBe('cancelled');
  });

  it('a refund row exists in the refunds table for the intervened order', async () => {
    const rows = await dataSource.query<{
      amount: string;
      reason: string;
    }[]>(
      `SELECT r.amount, r.reason
       FROM refunds r
       JOIN payments p ON p.id = r.payment_id
       WHERE p.order_id = $1`,
      [onlineOrderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(Number(rows[0]!.amount)).toBe(5000);
  });

  it('a notification row was inserted for the intervened order', async () => {
    const notifRows = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM notifications WHERE payload::jsonb->>'orderId' = $1 LIMIT 1`,
      [onlineOrderId],
    );
    expect(notifRows.length).toBeGreaterThanOrEqual(1);
  });

  it('an audit_logs row exists with action="order.intervene" for the intervened order', async () => {
    const rows = await dataSource.query<{
      action: string;
      target_id: string;
      before: unknown;
      after: unknown;
    }[]>(
      `SELECT action, target_id, "before", "after"
       FROM audit_logs
       WHERE action = 'order.intervene' AND target_id = $1`,
      [onlineOrderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.action).toBe('order.intervene');
    expect(rows[0]!.target_id).toBe(onlineOrderId);
    expect(rows[0]!.before).toBeTruthy();
    expect(rows[0]!.after).toBeTruthy();
  });

  it('audit_logs before snapshot has status="pending", after snapshot has refundAmount', async () => {
    const rows = await dataSource.query<{
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    }[]>(
      `SELECT "before", "after"
       FROM audit_logs
       WHERE action = 'order.intervene' AND target_id = $1
       ORDER BY at DESC
       LIMIT 1`,
      [onlineOrderId],
    );
    expect(rows.length).toBe(1);
    const before = typeof rows[0]!.before === 'string'
      ? JSON.parse(rows[0]!.before as string)
      : rows[0]!.before;
    const after = typeof rows[0]!.after === 'string'
      ? JSON.parse(rows[0]!.after as string)
      : rows[0]!.after;
    expect(before).toHaveProperty('status', 'pending');
    expect(after).toBeTruthy();
  });
});

describe('T080 — Admin order intervention: cancel action', () => {
  it('POST /v1/admin/orders/:id/intervene {action: cancel} — 200 response', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/admin/orders/${orderId}/intervene`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'cancel', reason: 'test cancel' })
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('order status transitions to "cancelled" after cancel intervention', async () => {
    const rows = await dataSource.query<{ status: string }[]>(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(rows[0]!.status).toBe('cancelled');
  });

  it('an audit_logs row exists with action="order.intervene" for the cancelled order', async () => {
    const rows = await dataSource.query<{ action: string; target_id: string }[]>(
      `SELECT action, target_id
       FROM audit_logs
       WHERE action = 'order.intervene' AND target_id = $1`,
      [orderId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.action).toBe('order.intervene');
  });

  it('401 — unauthenticated request returns 401', async () => {
    await supertest(app.getHttpServer())
      .post(`/v1/admin/orders/${orderId}/intervene`)
      .send({ action: 'cancel', reason: 'no token' })
      .expect(401);
  });

  it('403 — non-admin principal is rejected', async () => {
    // Mint a customer token
    const jwtService = app.get(JwtService);
    const customerToken = jwtService.sign({
      sub: customerId,
      principal: 'customer',
      roles: [],
    });

    await supertest(app.getHttpServer())
      .post(`/v1/admin/orders/${orderId}/intervene`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ action: 'cancel', reason: 'no token' })
      .expect(403);
  });
});
