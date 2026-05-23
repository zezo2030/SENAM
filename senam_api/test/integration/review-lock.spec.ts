/**
 * T071 — Review edit-lock integration test
 *
 * WHY THIS TEST FAILS NOW:
 *   The PATCH /v1/reviews/:id endpoint does not exist yet.  Both scenarios
 *   will receive 404 responses.  Once the ReviewsModule is implemented with
 *   a PATCH handler that enforces the 48-hour edit window via the locked_at
 *   column, Scenario A must return 422 (review_locked) and Scenario B must
 *   return 200 with the updated comment.
 *
 * Scenario A — locked review (locked_at in the past):
 *   Create a review row with locked_at = now() - interval '1 second'
 *   PATCH /v1/reviews/:id → expect 422 (review_locked)
 *
 * Scenario B — editable review (locked_at in the future):
 *   Create a review row with locked_at = now() + interval '47 hours'
 *   PATCH /v1/reviews/:id with updated comment → expect 200
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

const TEST_JWT_SECRET = 'review-lock-test-secret-32-chars!!';

jest.setTimeout(120_000);

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let dataSource: DataSource;
let app: INestApplication;

let customerId: string;
let companyId: string;
let orderId: string;
let customerToken: string;

// ---------------------------------------------------------------------------
// Container + app lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4')
    .withEnvironment({
      POSTGRES_DB: 'senam_reviewlock_test',
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
  const pgUrl = `postgres://senam:senam_pw@${pgHost}:${pgPort}/senam_reviewlock_test`;

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
  process.env['S3_BUCKET'] = 'senam-reviewlock-test';
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

  await seedReviewLockData(dataSource);

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

async function seedReviewLockData(ds: DataSource): Promise<void> {
  const [cat] = await ds.query<{ id: string }[]>(
    `INSERT INTO categories (slug, name_ar, is_active, sort_order)
     VALUES ('reviewlock-cat', 'تنظيف', true, 1)
     RETURNING id`,
  );

  const [svc] = await ds.query<{ id: string }[]>(
    `INSERT INTO services (category_id, slug, name_ar, base_duration_minutes, is_active)
     VALUES ($1, 'reviewlock-svc', 'خدمة التقييم', 60, true)
     RETURNING id`,
    [cat.id],
  );

  const [comp] = await ds.query<{ id: string }[]>(
    `INSERT INTO companies (legal_name, display_name, slug, status, commission_bps)
     VALUES ('ReviewLock Co LLC', 'ReviewLock Co', 'reviewlock-co', 'active', 1500)
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

  const [customer] = await ds.query<{ id: string }[]>(
    `INSERT INTO users (email, locale, status)
     VALUES ('reviewlock-cust@example.com', 'ar', 'active')
     RETURNING id`,
  );
  customerId = customer.id;

  const [addr] = await ds.query<{ id: string }[]>(
    `INSERT INTO addresses (user_id, label, line, location)
     VALUES ($1, 'Home', 'Lock St', ST_GeomFromGeoJSON($2)::geography)
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

  const [order] = await ds.query<{ id: string }[]>(
    `INSERT INTO orders (
       customer_id, company_id, slot_id, address_id,
       subtotal, discount, total, commission,
       payment_method, status, dispatch_attempt
     ) VALUES ($1, $2, $3, $4, 8000, 0, 8000, 1200, 'cod', 'completed', 1)
     RETURNING id`,
    [customerId, companyId, slot.id, addr.id],
  );
  orderId = order.id;
}

// ---------------------------------------------------------------------------
// Helper: insert a review row with a specific locked_at value
// ---------------------------------------------------------------------------

async function insertReview(lockedAtExpr: string): Promise<string> {
  const [row] = await dataSource.query<{ id: string }[]>(
    `INSERT INTO reviews (order_id, customer_id, company_id, rating, comment, locked_at)
     VALUES ($1, $2, $3, 5, 'Original comment', ${lockedAtExpr})
     RETURNING id`,
    [orderId, customerId, companyId],
  );
  return row!.id;
}

// ---------------------------------------------------------------------------
// Scenario A — locked review
// ---------------------------------------------------------------------------

describe('T071 Scenario A — PATCH /v1/reviews/:id on a locked review', () => {
  let lockedReviewId: string;

  beforeAll(async () => {
    // locked_at is in the past (1 second ago) → edit window has closed
    lockedReviewId = await insertReview(`now() - interval '1 second'`);
  });

  it('422 — returns review_locked when locked_at is in the past', async () => {
    const res = await supertest(app.getHttpServer())
      .patch(`/v1/reviews/${lockedReviewId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ comment: 'Trying to edit a locked review' })
      .expect(422);

    expect(res.body).toHaveProperty('status', 422);
  });

  it('DB row is unchanged after a rejected edit attempt', async () => {
    const rows = await dataSource.query<{ comment: string }[]>(
      `SELECT comment FROM reviews WHERE id = $1`,
      [lockedReviewId],
    );
    expect(rows[0]!.comment).toBe('Original comment');
  });
});

// ---------------------------------------------------------------------------
// Scenario B — editable review (within 48-hour window)
// ---------------------------------------------------------------------------

describe('T071 Scenario B — PATCH /v1/reviews/:id within the edit window', () => {
  let editableReviewId: string;

  beforeAll(async () => {
    // locked_at is 47 hours in the future → edit window is still open
    editableReviewId = await insertReview(`now() + interval '47 hours'`);
  });

  it('200 — updates comment when locked_at is in the future', async () => {
    const res = await supertest(app.getHttpServer())
      .patch(`/v1/reviews/${editableReviewId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ comment: 'Updated comment within window' })
      .expect(200);

    expect(res.body).toMatchObject(
      expect.objectContaining({
        comment: 'Updated comment within window',
      }),
    );
  });

  it('DB row reflects the updated comment', async () => {
    const rows = await dataSource.query<{ comment: string }[]>(
      `SELECT comment FROM reviews WHERE id = $1`,
      [editableReviewId],
    );
    expect(rows[0]!.comment).toBe('Updated comment within window');
  });

  it('401 — unauthenticated PATCH returns 401', async () => {
    const res = await supertest(app.getHttpServer())
      .patch(`/v1/reviews/${editableReviewId}`)
      .send({ comment: 'No auth' })
      .expect(401);

    expect(res.body).toHaveProperty('status', 401);
  });

  it('400 — empty comment string is rejected', async () => {
    const res = await supertest(app.getHttpServer())
      .patch(`/v1/reviews/${editableReviewId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ comment: '' })
      .expect(400);

    expect(res.body).toHaveProperty('status', 400);
  });
});
