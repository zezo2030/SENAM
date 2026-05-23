/**
 * Integration test: SC-005 slot capacity race condition (File 2)
 *
 * Invariant: When 200 concurrent requests attempt to book the same slot
 * with capacity_remaining=1, exactly 1 must succeed (201) and all others
 * must be rejected with 409 Conflict. After all requests settle,
 * capacity_remaining must be 0 in the database.
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
const TEST_JWT_SECRET = 'slot-race-test-secret-32-chars!!!';

jest.setTimeout(120_000);

// --------------------------------------------------------------------------
// Shared state
// --------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let companyId: string;
let slotId: string;
let addressIds: string[];
let userIds: string[];
let accessTokens: string[];
let serviceId: string;

// --------------------------------------------------------------------------
// Container lifecycle
// --------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_race_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_race_test`;

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
  process.env['S3_BUCKET'] = 'senam-race-test';
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

  await seedRaceData(dataSource, CONCURRENT_REQUESTS);

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

  // Mint JWTs directly — no OTP round-trip needed for the race test
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

async function seedRaceData(ds: DataSource, customerCount: number): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('race-cleaning', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'race-deep-clean', 'تنظيف عميق', 60, true)
     RETURNING id`,
    [cat.id],
  );
  serviceId = svc.id;

  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('Race Co LLC', 'Race Co', 'race-co', 'active', 1500)
     RETURNING id`,
  );
  companyId = comp.id;

  // Service area covering all of Qatar
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

  // Single slot with capacity_remaining = 1 — the critical race invariant
  const today = new Date().toISOString().slice(0, 10);
  const slotStart = `${today}T14:00:00+03:00`;
  const slotEnd = `${today}T15:00:00+03:00`;

  const [slot] = await ds.query<{ id: string }[]>(
    `INSERT INTO time_slots (company_id, slot_start_at, slot_end_at, capacity_total, capacity_remaining)
     VALUES ($1, $2, $3, 1, 1)
     RETURNING id`,
    [companyId, slotStart, slotEnd],
  );
  slotId = slot.id;

  // 200 distinct customers, each with one address inside Qatar
  userIds = [];
  addressIds = [];

  for (let i = 0; i < customerCount; i++) {
    const [user] = await ds.query<{ id: string }[]>(
      `INSERT INTO users (email, locale, status)
       VALUES ($1, 'ar', 'active')
       RETURNING id`,
      [`race-customer-${i}@example.com`],
    );
    userIds.push(user.id);

    const [addr] = await ds.query<{ id: string }[]>(
      `INSERT INTO addresses (user_id, label, line, location)
       VALUES ($1, 'Home', 'Test St', ST_GeomFromGeoJSON($2)::geography)
       RETURNING id`,
      [user.id, JSON.stringify({ type: 'Point', coordinates: [51.53, 25.28] })],
    );
    addressIds.push(addr.id);
  }
}

// --------------------------------------------------------------------------
// Race condition test
// --------------------------------------------------------------------------

describe('SC-005 — slot capacity race condition', () => {
  it(
    'exactly 1 of 200 concurrent booking requests succeeds; capacity_remaining=0',
    async () => {
      const httpServer = app.getHttpServer();

      // Fire all 200 requests in true parallel
      const results = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
          supertest(httpServer)
            .post('/v1/bookings')
            .set('Authorization', `Bearer ${accessTokens[i]}`)
            .send({
              companyId,
              slotId,
              addressId: addressIds[i],
              serviceId,
              paymentMethod: 'cod',
            }),
        ),
      );

      const statusCodes = results.map((r) => r.status);
      const successes = statusCodes.filter((s) => s === 201);
      const conflicts = statusCodes.filter((s) => s === 409);

      // Exactly one booking must succeed
      expect(successes).toHaveLength(1);

      // All remaining 199 must be 409 Conflict
      expect(conflicts).toHaveLength(CONCURRENT_REQUESTS - 1);

      // Assert DB invariant: capacity_remaining must be 0
      const rows = await dataSource.query<{ capacity_remaining: number }[]>(
        `SELECT capacity_remaining FROM time_slots WHERE id = $1`,
        [slotId],
      );
      expect(rows[0]!.capacity_remaining).toBe(0);
    },
    90_000,
  );
});
