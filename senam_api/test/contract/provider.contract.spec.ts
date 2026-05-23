/**
 * T055 — Provider contract tests
 *
 * Verifies that these HTTP routes exist and return correct status codes:
 *
 *   GET    /v1/provider/me/company          → 200 (provider_owner role)
 *   PATCH  /v1/provider/me/company          → 200 (provider_owner role)
 *   GET    /v1/provider/me/staff            → 200 (provider_owner role)
 *   POST   /v1/provider/me/staff            → 201 (provider_owner role)
 *   PATCH  /v1/provider/me/staff/:staffId   → 200 (provider_owner role)
 *   DELETE /v1/provider/me/staff/:staffId   → 204 (provider_owner role)
 *   GET    /v1/provider/me/orders           → 200 (provider_owner role)
 *   POST   /v1/bookings/:id/assign          → 200 (provider_owner role)
 *   GET    /v1/provider/me/financials       → 200 (provider_owner role)
 *   POST   /v1/bookings/:id/status          → 200 (provider JWT, any provider role)
 *
 * Strategy: The provider routes don't exist yet (T059-T068 implement them).
 * These tests use the full AppModule via Testcontainers (same as slot-race.spec.ts)
 * and mint JWTs directly via JwtService. They will return 404 until the provider
 * module is implemented, at which point they should return the expected status codes.
 *
 * Tests FAIL before implementation (404 for missing routes) and PASS after
 * the ProviderModule/ProviderController is wired into AppModule.
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

const TEST_JWT_SECRET = 'provider-contract-test-secret-32chars!';

jest.setTimeout(120_000);

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let companyId: string;
let companyUserId: string; // owner company_user row
let providerOwnerToken: string;
let staffId: string;
let orderId: string;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_provider_contract_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_provider_contract_test`;

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
  process.env['S3_BUCKET'] = 'senam-provider-contract-test';
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

  await seedProviderData(dataSource);

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

  // Mint provider_owner JWT directly — companyId embedded in the payload
  const jwtService = app.get(JwtService);
  providerOwnerToken = jwtService.sign({
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

async function seedProviderData(ds: DataSource): Promise<void> {
  // Minimal category + service
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('provider-cat', 'خدمة', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'provider-svc', 'خدمة تجريبية', 60, true)
     RETURNING id`,
    [cat.id],
  );

  // Company
  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Provider Co LLC', 'Provider Co', 'provider-co', 'active', 1500)
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
     VALUES ($1, $2, 5000, 60, true)`,
    [companyId, svc.id],
  );

  // Owner company_user (role = owner)
  const [ownerRow] = await ds.query<{ id: string }[]>(
    `INSERT INTO company_users (company_id, email, display_name, role, status)
     VALUES ($1, 'owner@provider-co.qa', 'Owner', 'owner', 'active')
     RETURNING id`,
    [companyId],
  );
  companyUserId = ownerRow.id;

  // A staff company_user
  const [staffRow] = await ds.query<{ id: string }[]>(
    `INSERT INTO company_users (company_id, email, display_name, role, status)
     VALUES ($1, 'staff@provider-co.qa', 'Staff Member', 'staff', 'active')
     RETURNING id`,
    [companyId],
  );
  staffId = staffRow.id;

  // A customer and order for testing status transitions
  const [customer] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('cust-for-provider@example.com', 'ar', 'active')
     RETURNING id`,
  );

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Test St', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [customer.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
  );

  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T14:00:00+03:00`;
  const slotEnd = `${today}T15:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 5, 5)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );

  // Insert a pending order directly (skip the booking API)
  const [order] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 5000, 0, 5000, 750, 'cod', 'pending', 1)
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
// Tests — these fail before the ProviderModule is implemented (404 responses)
// and should pass once T059-T068 are complete.
// ---------------------------------------------------------------------------

describe('T055 — Provider contract: /v1/provider/me/* routes', () => {
  describe('GET /v1/provider/me/company', () => {
    it('200 — returns company profile for authenticated provider_owner', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/v1/provider/me/company')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .expect(200); // Fails with 404 until ProviderModule is implemented

      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe(companyId);
    });

    it('401 — no token returns 401', async () => {
      await supertest(app.getHttpServer())
        .get('/v1/provider/me/company')
        .expect(401);
    });

    it('403 — customer token (wrong principal) returns 403', async () => {
      const jwtService = app.get(JwtService);
      const customerToken = jwtService.sign({
        sub: 'some-customer-id',
        principal: 'customer',
        roles: [],
      });
      await supertest(app.getHttpServer())
        .get('/v1/provider/me/company')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('PATCH /v1/provider/me/company', () => {
    it('200 — updates company profile and returns updated resource', async () => {
      const res = await supertest(app.getHttpServer())
        .patch('/v1/provider/me/company')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({ displayName: 'Updated Provider Co' })
        .expect(200); // Fails with 404 until ProviderModule is implemented

      expect(res.body).toHaveProperty('id');
    });

    it('401 — no token returns 401', async () => {
      await supertest(app.getHttpServer())
        .patch('/v1/provider/me/company')
        .send({ displayName: 'Updated' })
        .expect(401);
    });
  });

  describe('GET /v1/provider/me/staff', () => {
    it('200 — returns staff list for the provider company', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/v1/provider/me/staff')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .expect(200); // Fails with 404 until ProviderModule is implemented

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('401 — no token returns 401', async () => {
      await supertest(app.getHttpServer())
        .get('/v1/provider/me/staff')
        .expect(401);
    });
  });

  describe('POST /v1/provider/me/staff', () => {
    it('201 — creates a new staff member', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/v1/provider/me/staff')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({ email: 'newstaff@provider-co.qa', displayName: 'New Staff' })
        .expect(201); // Fails with 404 until ProviderModule is implemented

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'newstaff@provider-co.qa');
    });

    it('400 — invalid body (missing email) returns 400', async () => {
      await supertest(app.getHttpServer())
        .post('/v1/provider/me/staff')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('PATCH /v1/provider/me/staff/:staffId', () => {
    it('200 — updates a staff member', async () => {
      const res = await supertest(app.getHttpServer())
        .patch(`/v1/provider/me/staff/${staffId}`)
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({ displayName: 'Updated Staff Name' })
        .expect(200); // Fails with 404 until ProviderModule is implemented

      expect(res.body).toHaveProperty('id', staffId);
    });

    it('404 — unknown staffId returns 404', async () => {
      await supertest(app.getHttpServer())
        .patch('/v1/provider/me/staff/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({ displayName: 'Ghost' })
        .expect(404);
    });
  });

  describe('DELETE /v1/provider/me/staff/:staffId', () => {
    it('204 — removes a staff member', async () => {
      await supertest(app.getHttpServer())
        .delete(`/v1/provider/me/staff/${staffId}`)
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .expect(204); // Fails with 404 until ProviderModule is implemented
    });
  });

  describe('GET /v1/provider/me/orders', () => {
    it('200 — returns orders for the provider company', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/v1/provider/me/orders')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .expect(200); // Fails with 404 until ProviderModule is implemented

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 — supports status filter query param', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/v1/provider/me/orders')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /v1/provider/me/orders/:id/assign', () => {
    it('200 — assigns a staff member to an order', async () => {
      const res = await supertest(app.getHttpServer())
        .post(`/v1/provider/me/orders/${orderId}/assign`)
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({ staffId })
        .expect(200); // Fails with 404 until ProviderModule is implemented

      expect(res.body).toHaveProperty('id', orderId);
      expect(res.body).toHaveProperty('assignedStaffId', staffId);
    });

    it('404 — unknown orderId returns 404', async () => {
      await supertest(app.getHttpServer())
        .post('/v1/provider/me/orders/00000000-0000-0000-0000-000000000000/assign')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .send({ staffId })
        .expect(404);
    });
  });

  describe('GET /v1/provider/me/financials', () => {
    it('200 — returns financial summary for the provider company', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/v1/provider/me/financials')
        .set('Authorization', `Bearer ${providerOwnerToken}`)
        .expect(200); // Fails with 404 until ProviderModule is implemented

      // Shape TBD by implementation; at minimum a body is returned
      expect(res.body).toBeDefined();
    });
  });
});

describe('T055 — Provider contract: POST /v1/bookings/:id/status', () => {
  it('200 — provider can advance order status (pending → accepted)', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/v1/bookings/${orderId}/status`)
      .set('Authorization', `Bearer ${providerOwnerToken}`)
      .send({ to: 'accepted' })
      .expect(200); // Fails with 404 until BookingsController gets the /status route

    expect(res.body).toHaveProperty('id', orderId);
    expect(res.body).toHaveProperty('status', 'accepted');
  });

  it('400 — missing "to" field returns 400', async () => {
    await supertest(app.getHttpServer())
      .post(`/v1/bookings/${orderId}/status`)
      .set('Authorization', `Bearer ${providerOwnerToken}`)
      .send({})
      .expect(400);
  });

  it('401 — no token returns 401', async () => {
    await supertest(app.getHttpServer())
      .post(`/v1/bookings/${orderId}/status`)
      .send({ to: 'accepted' })
      .expect(401);
  });

  it('404 — unknown orderId returns 404', async () => {
    await supertest(app.getHttpServer())
      .post('/v1/bookings/00000000-0000-0000-0000-000000000000/status')
      .set('Authorization', `Bearer ${providerOwnerToken}`)
      .send({ to: 'accepted' })
      .expect(404);
  });
});
