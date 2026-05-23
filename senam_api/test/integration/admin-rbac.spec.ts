/**
 * T081 — Admin RBAC integration test
 *
 * Verifies that the `support_admin` role is denied (403) on all mutating
 * admin endpoints, while `super_admin` is permitted on read endpoints.
 *
 * Seed: one company
 *
 * Tokens minted:
 *   support_admin_token  — { sub: adminUserId, principal: 'admin', roles: ['support_admin'] }
 *   super_admin_token    — { sub: adminUserId, principal: 'admin', roles: ['super_admin'] }
 *
 * Uses real PostgreSQL 15 (postgis/postgis:15-3.4) + Redis 7 via Testcontainers.
 * The routes do NOT exist yet (Phase 6 admin implementation), so all tests
 * will FAIL with 404 until the implementation is complete; once implemented
 * the RBAC assertions must hold.
 *
 * DB: senam_admin_rbac_test
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

const TEST_JWT_SECRET = 'admin-rbac-test-secret-32chars!!';
const ADMIN_USER_ID = 'admin-rbac-00-0000-0000-000000000001';

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
let support_admin_token: string;
let super_admin_token: string;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_admin_rbac_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_admin_rbac_test`;

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
  process.env['S3_BUCKET'] = 'senam-rbac-test';
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

  await seedRbacData(dataSource);

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

  support_admin_token = jwtService.sign({
    sub: ADMIN_USER_ID,
    principal: 'admin',
    roles: ['support_admin'],
  });

  super_admin_token = jwtService.sign({
    sub: ADMIN_USER_ID,
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

async function seedRbacData(ds: DataSource): Promise<void> {
  // One company in pending state — enough for all RBAC endpoint calls
  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('RBAC Co LLC', 'RBAC Co', 'rbac-co', 'pending', 1500)
     RETURNING id`,
  );
  companyId = comp.id;

  // Seed a customer and a pending order for the intervene endpoint
  const [cust] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('rbac-cust@example.com', 'ar', 'active')
     RETURNING id`,
  );

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'RBAC St', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [cust.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
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

  const [order] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 8000, 0, 8000, 1200, 'cod', 'pending', 1)
     RETURNING id`,
    [cust.id, companyId, slot.id, addr.id],
  );
  orderId = order.id;

  await ds.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id)
     VALUES ($1, NULL, 'pending', 'customer', $2)`,
    [orderId, cust.id],
  );
}

// ---------------------------------------------------------------------------
// Tests — support_admin MUST receive 403 on mutating endpoints
// ---------------------------------------------------------------------------

describe('T081 — Admin RBAC: support_admin is denied on mutating endpoints', () => {
  /**
   * All these tests will FAIL with 404 until the admin routes are implemented.
   * Once implemented they MUST return 403 for the support_admin role.
   */

  it('support_admin → POST /v1/admin/companies/:id/approve → 403', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/admin/companies/${companyId}/approve`)
      .set('Authorization', `Bearer ${support_admin_token}`)
      .expect(403);

    expect(res.body).toHaveProperty('status', 403);
  });

  it('support_admin → POST /v1/admin/companies/:id/suspend → 403', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/admin/companies/${companyId}/suspend`)
      .set('Authorization', `Bearer ${support_admin_token}`)
      .send({ reason: 'rbac test' })
      .expect(403);

    expect(res.body).toHaveProperty('status', 403);
  });

  it('support_admin → PATCH /v1/admin/companies/:id/commission → 403', async () => {
    const res = await supertest(app.getHttpServer())
      .patch(`/v1/admin/companies/${companyId}/commission`)
      .set('Authorization', `Bearer ${support_admin_token}`)
      .send({ commissionBps: 2000 })
      .expect(403);

    expect(res.body).toHaveProperty('status', 403);
  });

  it('support_admin → POST /v1/admin/orders/:id/intervene → 403', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/admin/orders/${orderId}/intervene`)
      .set('Authorization', `Bearer ${support_admin_token}`)
      .send({ action: 'cancel', reason: 'rbac test' })
      .expect(403);

    expect(res.body).toHaveProperty('status', 403);
  });

  it('support_admin → POST /v1/admin/coupons → 403', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/v1/admin/coupons')
      .set('Authorization', `Bearer ${support_admin_token}`)
      .send({
        code: 'RBAC10',
        discountType: 'percent',
        discountValue: 10,
        maxUses: 50,
        expiresAt: '2027-12-31T23:59:59.000Z',
      })
      .expect(403);

    expect(res.body).toHaveProperty('status', 403);
  });
});

// ---------------------------------------------------------------------------
// Tests — super_admin MUST receive 200 on read endpoints
// ---------------------------------------------------------------------------

describe('T081 — Admin RBAC: super_admin is permitted on read endpoints', () => {
  /**
   * All these tests will FAIL with 404 until the admin routes are implemented.
   * Once implemented they MUST return 200 for the super_admin role.
   */

  it('super_admin → GET /v1/admin/companies → 200', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/v1/admin/companies')
      .set('Authorization', `Bearer ${super_admin_token}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('super_admin → GET /v1/admin/orders → 200', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/v1/admin/orders')
      .set('Authorization', `Bearer ${super_admin_token}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('super_admin → GET /v1/admin/audit → 200', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/v1/admin/audit')
      .set('Authorization', `Bearer ${super_admin_token}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('T081 — Admin RBAC: edge cases', () => {
  it('401 — request without any token is rejected on a protected admin endpoint', async () => {
    await supertest(app.getHttpServer())
      .post(`/v1/admin/companies/${companyId}/approve`)
      .expect(401);
  });

  it('401 — request without any token on GET /v1/admin/orders is rejected', async () => {
    await supertest(app.getHttpServer())
      .get('/v1/admin/orders')
      .expect(401);
  });

  it('403 — support_admin is denied even on a non-existent company id', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000099';
    // RBAC guard must fire before the not-found check
    await supertest(app.getHttpServer())
      .post(`/v1/admin/companies/${nonExistentId}/approve`)
      .set('Authorization', `Bearer ${support_admin_token}`)
      .expect(403);
  });
});
