/**
 * Integration test: FR-038 service area geographic validation (File 4)
 *
 * Invariant: A booking whose delivery address falls inside the company's
 * service area polygon must succeed (201). A booking whose address falls
 * outside that polygon must fail with 422 Unprocessable Entity.
 *
 * Service area polygon covers Doha centre: lon 51.4–51.7, lat 25.1–25.5
 *   Inside  point: (51.53, 25.28) — Doha centre, well inside
 *   Outside point: (50.10, 24.50) — desert south-west of Qatar, well outside
 *
 * Also verifies the PostGIS ST_Contains predicate directly against the DB,
 * and that the company geo-search endpoint respects service area boundaries.
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

const TEST_JWT_SECRET = 'service-area-secret-at-least-32!!!!';

jest.setTimeout(120_000);

// --------------------------------------------------------------------------
// Shared state
// --------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let insideCustomerId: string;
let insideAddressId: string;
let insideToken: string;

let outsideCustomerId: string;
let outsideAddressId: string;
let outsideToken: string;

let companyId: string;
let slotId: string;
let serviceId: string;

// --------------------------------------------------------------------------
// Container lifecycle
// --------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_service_area',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_service_area`;

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
  process.env['S3_BUCKET'] = 'senam-area-test';
  process.env['S3_ACCESS_KEY_ID'] = 'dummy';
  process.env['S3_SECRET_ACCESS_KEY'] = 'dummy';
  process.env['OTP_RATE_LIMIT_ISSUE_PER_HOUR'] = '100';
  process.env['OTP_RATE_LIMIT_VERIFY_ATTEMPTS'] = '100';

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

  await seedServiceAreaData(dataSource);

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
  insideToken = jwtService.sign({
    sub: insideCustomerId,
    principal: 'customer',
    roles: [],
  });
  outsideToken = jwtService.sign({
    sub: outsideCustomerId,
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

// --------------------------------------------------------------------------
// Seed helpers
// --------------------------------------------------------------------------

/**
 * Polygon covers lon 51.4–51.7, lat 25.1–25.5 (Doha centre only).
 *   Inside  point: (51.53, 25.28) — well inside
 *   Outside point: (50.10, 24.50) — well outside (south-west of Qatar)
 */
async function seedServiceAreaData(ds: DataSource): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('area-cleaning', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'area-clean', 'تنظيف عميق', 60, true)
     RETURNING id`,
    [cat.id],
  );
  serviceId = svc.id;

  // Company with a service area tightly bounded around Doha centre
  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Area Co LLC', 'Area Co', 'area-co', 'active', 1500)
     RETURNING id`,
  );
  companyId = comp.id;

  // Polygon covering lon 51.4–51.7, lat 25.1–25.5
  await ds.query(
    `INSERT INTO company_service_areas (company_id, area)
     VALUES ($1, ST_GeomFromGeoJSON($2)::geography)`,
    [
      companyId,
      JSON.stringify({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [51.4, 25.1],
              [51.7, 25.1],
              [51.7, 25.5],
              [51.4, 25.5],
              [51.4, 25.1],
            ],
          ],
        ],
      }),
    ],
  );

  await ds.query(
    `INSERT INTO company_services (company_id, service_id, price, duration_minutes, is_active)
     VALUES ($1, $2, 8000, 60, true)`,
    [companyId, serviceId],
  );

  // One slot with enough capacity for both booking attempts
  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T12:00:00+03:00`;
  const slotEnd = `${today}T13:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 10, 10)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );
  slotId = slot.id;

  // Customer INSIDE the service area — address at Doha centre (51.53, 25.28)
  const [inUser] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('inside@example.com', 'ar', 'active')
     RETURNING id`,
  );
  insideCustomerId = inUser.id;

  const [inAddr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Al Sadd St, Doha', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [insideCustomerId, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
  );
  insideAddressId = inAddr.id;

  // Customer OUTSIDE the service area — address at (50.10, 24.50)
  const [outUser] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('outside@example.com', 'ar', 'active')
     RETURNING id`,
  );
  outsideCustomerId = outUser.id;

  const [outAddr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Remote', 'Desert Road', ST_GeomFromGeoJSON($2)::geography)
     RETURNING id`,
    [outsideCustomerId, JSON.stringify({ type: 'Point', coordinates: [50.10, 24.50] })],
  );
  outsideAddressId = outAddr.id;
}

// --------------------------------------------------------------------------
// Service area tests
// --------------------------------------------------------------------------

describe('FR-038 — service area geographic validation', () => {
  it(
    'DB-level: ST_Contains confirms inside point is within polygon, outside point is not',
    async () => {
      // This test is purely against PostGIS — independent of application logic.
      // If this fails, all subsequent application tests would be meaningless.
      const [insideCheck] = await dataSource.query<{ within: boolean }[]>(
        `SELECT ST_Contains(
           area::geometry,
           ST_SetSRID(ST_MakePoint(51.53, 25.28), 4326)
         ) AS within
         FROM company_service_areas
         WHERE company_id = $1`,
        [companyId],
      );
      expect(insideCheck!.within).toBe(true);

      const [outsideCheck] = await dataSource.query<{ within: boolean }[]>(
        `SELECT ST_Contains(
           area::geometry,
           ST_SetSRID(ST_MakePoint(50.10, 24.50), 4326)
         ) AS within
         FROM company_service_areas
         WHERE company_id = $1`,
        [companyId],
      );
      expect(outsideCheck!.within).toBe(false);
    },
  );

  it(
    'POST /v1/bookings — 201 for customer address INSIDE the service area',
    async () => {
      const res = await supertest(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${insideToken}`)
        .send({
          companyId,
          slotId,
          addressId: insideAddressId,
          serviceId,
          paymentMethod: 'cod',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');

      // Slot capacity was decremented from 10 to 9
      const rows = await dataSource.query<{ capacity_remaining: number }[]>(
        `SELECT capacity_remaining FROM time_slots WHERE id = $1`,
        [slotId],
      );
      expect(rows[0]!.capacity_remaining).toBe(9);
    },
  );

  it(
    'POST /v1/bookings — 422 for customer address OUTSIDE the service area',
    async () => {
      const res = await supertest(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${outsideToken}`)
        .send({
          companyId,
          slotId,
          addressId: outsideAddressId,
          serviceId,
          paymentMethod: 'cod',
        });

      // FR-038: address outside service area → 422 Unprocessable Entity
      expect(res.status).toBe(422);

      // Problem-detail shape (AllExceptionsFilter)
      expect(res.body).toMatchObject({ status: 422 });
      expect(res.body).toHaveProperty('detail');

      const detail = (res.body.detail as string).toLowerCase();
      // Implementation may use any of these keywords in the rejection message
      expect(
        detail.includes('service_area') ||
        detail.includes('address') ||
        detail.includes('coverage') ||
        detail.includes('area') ||
        detail.includes('location'),
      ).toBe(true);

      // Slot capacity must NOT have changed — still 9 after the successful booking above
      const rows = await dataSource.query<{ capacity_remaining: number }[]>(
        `SELECT capacity_remaining FROM time_slots WHERE id = $1`,
        [slotId],
      );
      expect(rows[0]!.capacity_remaining).toBe(9);
    },
  );

  it(
    'GET /v1/companies?lon=&lat= — inside point returns the company, outside does not',
    async () => {
      // Point inside the service area — company should appear
      const insideRes = await supertest(app.getHttpServer())
        .get('/v1/companies')
        .set('Authorization', `Bearer ${insideToken}`)
        .query({ lon: '51.53', lat: '25.28' })
        .expect(200);

      const insideCompanies = insideRes.body as { id: string }[];
      expect(insideCompanies.some((c) => c.id === companyId)).toBe(true);

      // Point outside the service area — company should NOT appear
      const outsideRes = await supertest(app.getHttpServer())
        .get('/v1/companies')
        .set('Authorization', `Bearer ${outsideToken}`)
        .query({ lon: '50.10', lat: '24.50' })
        .expect(200);

      const outsideCompanies = outsideRes.body as { id: string }[];
      expect(outsideCompanies.some((c) => c.id === companyId)).toBe(false);
    },
  );
});
