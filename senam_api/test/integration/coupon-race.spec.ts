/**
 * Integration test: SC-005 coupon usage race condition (File 3)
 *
 * Invariant: When 200 concurrent requests attempt to apply a coupon whose
 * total_cap=1, exactly 1 application must succeed and coupons.used_count
 * must equal 1 in the database. All others must receive 409.
 *
 * Setup: 1 coupon with total_cap=1, 200 customers each with 1 pending
 * (unconfirmed) booking that is eligible for the coupon.
 *
 * Uses real PostgreSQL 15 (postgis/postgis:15-3.4) + Redis 7 via Testcontainers.
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

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const CONCURRENT_REQUESTS = 200;
const TEST_JWT_SECRET = 'coupon-race-secret-at-least-32-chars!';

jest.setTimeout(120_000);

// --------------------------------------------------------------------------
// Shared state
// --------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let couponCode: string;
let couponId: string;
let orderIds: string[];
let userIds: string[];
let accessTokens: string[];

// --------------------------------------------------------------------------
// Container lifecycle
// --------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_coupon_race',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_coupon_race`;

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
  process.env['S3_BUCKET'] = 'senam-coupon-test';
  process.env['S3_ACCESS_KEY_ID'] = 'dummy';
  process.env['S3_SECRET_ACCESS_KEY'] = 'dummy';
  process.env['OTP_RATE_LIMIT_ISSUE_PER_HOUR'] = '10000';
  process.env['OTP_RATE_LIMIT_VERIFY_ATTEMPTS'] = '10000';

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

  await seedCouponRaceData(dataSource, CONCURRENT_REQUESTS);

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
  accessTokens = userIds.map((uid) =>
    jwtService.sign({ sub: uid, principal: 'customer', roles: [] }),
  );
});

afterAll(async () => {
  await app?.close();
  await dataSource?.destroy();
  await pgContainer?.stop();
  await redisContainer?.stop();
});

// --------------------------------------------------------------------------
// Seed helpers
// --------------------------------------------------------------------------

async function seedCouponRaceData(ds: DataSource, customerCount: number): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('coupon-cleaning', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'coupon-clean', 'تنظيف عميق', 60, true)
     RETURNING id`,
    [cat.id],
  );
  const serviceId = svc.id;

  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Coupon Co LLC', 'Coupon Co', 'coupon-co', 'active', 1500)
     RETURNING id`,
  );
  const companyId = comp.id;

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
    [companyId, serviceId],
  );

  // One time slot with enough capacity for all 200 orders
  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T16:00:00+03:00`;
  const slotEnd = `${today}T17:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id`,
    [companyId, slotStart, slotEnd, customerCount],
  );
  const slotId = slot.id;

  // Coupon with total_cap=1 — the race target
  couponCode = 'RACE-ONE';
  const now = new Date();
  const validUntil = new Date(now.getTime() + 86_400_000); // +1 day

  const [coupon] = await ds.query<{ id: string }[]>(
    `INSERT INTO coupons
       (code, kind, value_bps_or_amount, min_order_amount, total_cap, per_user_cap,
        valid_from, valid_until, used_count, is_active)
     VALUES ($1, 'fixed', 1000, 0, 1, 1, $2, $3, 0, true)
     RETURNING id`,
    [couponCode, now.toISOString(), validUntil.toISOString()],
  );
  couponId = coupon.id;

  // 200 customers each with 1 pending order (no coupon applied yet)
  userIds = [];
  orderIds = [];

  for (let i = 0; i < customerCount; i++) {
    const [user] = await ds.query<{ id: string }[]>(
      `INSERT INTO users (email, locale, status)
       VALUES ($1, 'ar', 'active')
       RETURNING id`,
      [`coupon-race-${i}@example.com`],
    );
    userIds.push(user.id);

    const [addr] = await ds.query<{ id: string }[]>(
      `INSERT INTO addresses (user_id, label, line, location)
       VALUES ($1, 'Home', 'Test St', ST_GeomFromGeoJSON($2)::geography)
       RETURNING id`,
      [user.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
    );

    // Pre-create a pending order for each customer (no coupon applied)
    const subtotal = 5000;
    const commission = Math.floor(subtotal * 0.15);

    const [order] = await ds.query<{ id: string }[]>(
      `INSERT INTO orders
         (customer_id, company_id, slot_id, address_id,
          subtotal, discount, total, commission, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, 0, $5, $6, 'cod', 'pending')
       RETURNING id`,
      [user.id, companyId, slotId, addr.id, subtotal, commission],
    );
    orderIds.push(order.id);
  }
}

// --------------------------------------------------------------------------
// Race condition test
// --------------------------------------------------------------------------

describe('SC-005 — coupon usage race condition', () => {
  it(
    'exactly 1 of 200 concurrent coupon applications succeeds; used_count=1',
    async () => {
      const httpServer = app.getHttpServer();

      // Fire all 200 apply-coupon requests concurrently
      const results = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
          supertest(httpServer)
            .post(`/v1/bookings/${orderIds[i]}/coupon`)
            .set('Authorization', `Bearer ${accessTokens[i]}`)
            .send({ code: couponCode }),
        ),
      );

      const statusCodes = results.map((r) => r.status);
      const successes = statusCodes.filter((s) => s === 200 || s === 201);
      const conflicts = statusCodes.filter((s) => s === 409);

      // Exactly one coupon application must succeed
      expect(successes).toHaveLength(1);

      // All others must be rejected with 409 Conflict
      expect(conflicts).toHaveLength(CONCURRENT_REQUESTS - 1);

      // Assert DB invariant: coupons.used_count must be exactly 1
      const rows = await dataSource.query<{ used_count: number }[]>(
        `SELECT used_count FROM coupons WHERE id = $1`,
        [couponId],
      );
      expect(rows[0]!.used_count).toBe(1);
    },
    90_000,
  );
});
