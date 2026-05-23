/**
 * Integration test: Customer happy-path booking flow (File 1)
 *
 * Covers:
 *   FR-001 OTP request + verify → JWT pair
 *   FR-010 address creation
 *   FR-020 slot listing
 *   FR-030 booking creation (COD)
 *   SC-001 payment row created for COD
 *   SC-005 slot capacity_remaining decremented by 1
 *   SC-010 audit_logs row written
 *
 * Uses real PostgreSQL 15 (postgis/postgis:15-3.4) + Redis 7 via Testcontainers.
 * Runs all TypeORM migrations before assertions.
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

// --------------------------------------------------------------------------
// Shared state
// --------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

const TEST_JWT_SECRET = 'integration-test-secret-32-chars!!';

let companyId: string;
let slotId: string;
let customerId: string;
let serviceId: string;
let categoryId: string;

jest.setTimeout(120_000);

// --------------------------------------------------------------------------
// Container + app lifecycle
// --------------------------------------------------------------------------

beforeAll(async () => {
  // 1. Start real Postgres 15 with PostGIS
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_test',
      POSTGRES_USER: 'senam',
      POSTGRES_PASSWORD: 'senam_pw',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .withStartupTimeout(60_000)
    .start();

  // 2. Start real Redis 7
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .withStartupTimeout(30_000)
    .start();

  const pgHost = pgContainer.getHost();
  const pgPort = pgContainer.getMappedPort(5432);
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_test`;

  const redisHost = redisContainer.getHost();
  const redisPort = redisContainer.getMappedPort(6379);
  const redisUrl = `redis://${redisHost}:${redisPort}`;

  // 3. Set env vars that NestJS modules read via ConfigService / process.env
  process.env['DATABASE_URL'] = pgUrl;
  process.env['REDIS_URL'] = redisUrl;
  process.env['JWT_SECRET'] = TEST_JWT_SECRET;
  process.env['JWT_ACCESS_TTL_SECONDS'] = '900';
  process.env['JWT_REFRESH_TTL_SECONDS'] = '86400';
  process.env['NODE_ENV'] = 'test';
  process.env['MYFATOORAH_API_KEY'] = 'dummy';
  process.env['MYFATOORAH_WEBHOOK_SECRET'] = 'dummy';
  process.env['S3_ENDPOINT'] = 'http://localhost:9000';
  process.env['S3_BUCKET'] = 'senam-test';
  process.env['S3_ACCESS_KEY_ID'] = 'dummy';
  process.env['S3_SECRET_ACCESS_KEY'] = 'dummy';
  process.env['OTP_RATE_LIMIT_ISSUE_PER_HOUR'] = '100';
  process.env['OTP_RATE_LIMIT_VERIFY_ATTEMPTS'] = '100';

  // 4. Run migrations via a standalone DataSource (not through the NestJS app)
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

  // 5. Seed minimal data
  await seedData(dataSource);

  // 6. Bootstrap the NestJS app
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
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
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

async function seedData(ds: DataSource): Promise<void> {
  // Use DataSource.query<T> which supports generics (returns Promise<T>)
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('cleaning', 'تنظيف', true, 1)
     RETURNING id`,
  );
  categoryId = cat.id;

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'deep-clean', 'تنظيف عميق', 60, true)
     RETURNING id`,
    [categoryId],
  );
  serviceId = svc.id;

  // Company with a service area polygon covering Doha centre (lon 51.53, lat 25.28)
  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Test Co LLC', 'Test Co', 'test-co', 'active', 1500)
     RETURNING id`,
  );
  companyId = comp.id;

  // Polygon: lon 51.4–51.7, lat 25.1–25.5 — encloses (51.53, 25.28)
  await ds.query(
    `INSERT INTO company_service_areas (company_id, area)
     VALUES ($1, ST_GeomFromGeoJSON($2)::geography)`,
    [
      companyId,
      JSON.stringify({
        type: 'MultiPolygon',
        coordinates: [
          [[[51.4, 25.1], [51.7, 25.1], [51.7, 25.5], [51.4, 25.5], [51.4, 25.1]]],
        ],
      }),
    ],
  );

  await ds.query(
    `INSERT INTO company_services (company_id, service_id, price, duration_minutes, is_active)
     VALUES ($1, $2, 10000, 60, true)`,
    [companyId, serviceId],
  );

  // One concrete time slot for today (10:00–11:00 Doha time)
  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T10:00:00+03:00`;
  const slotEnd = `${today}T11:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 3, 3)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );
  slotId = slot.id;

  // Customer user
  const [cust] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('customer@example.com', 'ar', 'active')
     RETURNING id`,
  );
  customerId = cust.id;
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('Customer happy-path booking flow', () => {
  const customerEmail = 'customer@example.com';
  let accessToken: string;
  let addressId: string;

  it('POST /v1/auth/otp/request — 200 and returns otp_sent', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/v1/auth/otp/request')
      .send({ email: customerEmail, principal: 'customer' })
      .expect(200);

    expect(res.body).toMatchObject({ message: 'otp_sent' });
  });

  it('POST /v1/auth/otp/verify — 200, returns JWT pair (OTP injected via Redis)', async () => {
    // Bypass real email by planting the OTP hash directly in Redis
    const { Redis } = await import('ioredis');
    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    const redis = new Redis({ host: redisHost, port: redisPort });

    const knownCode = '123456';
    const hash = await bcrypt.hash(knownCode, 10);
    await redis.set(`otp:hash:${customerEmail}`, hash, 'EX', 600);
    await redis.del(`otp:verify_attempts:${customerEmail}`);
    await redis.quit();

    const res = await supertest(app.getHttpServer())
      .post('/v1/auth/otp/verify')
      .send({ email: customerEmail, code: knownCode, principal: 'customer' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken as string;
  });

  it('GET /v1/healthz — 200 (smoke test: app + containers running)', async () => {
    await supertest(app.getHttpServer()).get('/v1/healthz').expect(200);
  });

  it('POST /v1/addresses — 201 creates address inside the service area', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/v1/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        label: 'Home',
        line: 'Building 42, Al Sadd St',
        area: 'Al Sadd',
        city: 'Doha',
        // Doha centre — inside the seeded polygon
        location: { type: 'Point', coordinates: [51.53, 25.28] },
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    addressId = res.body.id as string;
  });

  it('GET /v1/slots — returns the seeded slot for the company', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await supertest(app.getHttpServer())
      .get('/v1/slots')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ companyId, date: today })
      .expect(200);

    const slots = res.body as { id: string }[];
    expect(Array.isArray(slots)).toBe(true);
    const found = slots.find((s) => s.id === slotId);
    expect(found).toBeDefined();
  });

  it(
    'POST /v1/bookings (COD) — 201, payment row created, slot decremented, audit log written',
    async () => {
      const res = await supertest(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          companyId,
          slotId,
          addressId,
          serviceId,
          paymentMethod: 'cod',
          notes: 'Integration test booking',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      const orderId = res.body.id as string;

      // Assert: payment row created (COD creates a stub payment record)
      const payments = await dataSource.query<{ order_id: string; provider: string }[]>(
        `SELECT order_id, provider FROM payments WHERE order_id = $1`,
        [orderId],
      );
      expect(payments.length).toBeGreaterThanOrEqual(1);
      expect(payments[0]!.order_id).toBe(orderId);

      // Assert: slot capacity_remaining decremented by 1 (was 3, now 2)
      const slots = await dataSource.query<{ capacity_remaining: number }[]>(
        `SELECT capacity_remaining FROM time_slots WHERE id = $1`,
        [slotId],
      );
      expect(slots[0]!.capacity_remaining).toBe(2);

      // Assert: audit_logs row written for this booking
      const auditRows = await dataSource.query<{ action: string; target_id: string }[]>(
        `SELECT action, target_id FROM audit_logs WHERE target_id = $1`,
        [orderId],
      );
      expect(auditRows.length).toBeGreaterThanOrEqual(1);
      expect(auditRows[0]!.target_id).toBe(orderId);
    },
  );
});
