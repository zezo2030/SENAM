/**
 * T069 — Reviews contract tests
 *
 * Endpoints tested:
 *   POST /v1/bookings/:id/review  — submit a review for a completed order
 *   POST /v1/reviews/:id/reply    — provider reply to a review
 *
 * WHY THESE TESTS FAIL NOW:
 *   ReviewsModule does not exist yet.  The import at the bottom of the
 *   test-module builder will throw a compile-time module-not-found error,
 *   and even if that were skipped, the routes return 404 because no
 *   ReviewsController is registered.  All tests are expected to fail until
 *   T069 implementation is complete.
 *
 * Infrastructure strategy:
 *   Same @Global stub-module pattern as auth.contract.spec.ts.
 *   No real Postgres, Redis, or BullMQ connections are made.
 *   TypeORM repository tokens for Review and ReviewReply entities are
 *   overridden with lightweight mock objects.
 */

import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Global, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';

import { CacheService } from '../../src/infrastructure/cache/cache.service.js';
import { REDIS_CLIENT } from '../../src/infrastructure/cache/redis.module.js';
import { MailProducer } from '../../src/infrastructure/queue/producers/mail.producer.js';
import { TokensService } from '../../src/modules/auth/tokens.service.js';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../src/common/guards/roles.guard.js';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter.js';
import { CorrelationIdInterceptor } from '../../src/common/interceptors/correlation-id.interceptor.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { ReviewsModule } from '../../src/modules/reviews/reviews.module.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const TEST_JWT_SECRET = 'reviews-contract-test-secret-32chars!';
const TEST_CUSTOMER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TEST_PROVIDER_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const TEST_ORDER_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const TEST_OTHER_ORDER_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const TEST_REVIEW_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const TEST_COMPANY_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

// ─── Shared mocks ─────────────────────────────────────────────────────────────

const sharedCacheMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  incrWithExpire: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue(true),
};

const sharedAuditMock = {
  write: jest.fn().mockResolvedValue(undefined),
};

function makeQueryRunnerMock() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    manager: {
      create: jest.fn().mockImplementation((_cls: unknown, data: unknown) => data),
      save: jest.fn().mockImplementation(async (_cls: unknown, entity: unknown) => entity),
    },
  };
}

const sharedDataSourceMock = {
  query: jest.fn().mockResolvedValue([]),
  createQueryRunner: jest.fn().mockReturnValue(makeQueryRunnerMock()),
  getRepository: jest.fn().mockReturnValue({
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation(async (e: unknown) => e),
    create: jest.fn().mockImplementation((d: unknown) => d),
  }),
};

// Mock repository objects — tests reprogram findOne per scenario

const reviewRepositoryMock = {
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockImplementation(async (e: unknown) => ({ id: TEST_REVIEW_ID, ...((e as object) ?? {}) })),
  create: jest.fn().mockImplementation((d: unknown) => d),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};

const reviewReplyRepositoryMock = {
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockImplementation(async (e: unknown) => ({ id: 'reply-id-1', ...((e as object) ?? {}) })),
  create: jest.fn().mockImplementation((d: unknown) => d),
};

const orderRepositoryMock = {
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
};

// ─── Stub @Global modules ─────────────────────────────────────────────────────

@Global()
@Module({
  providers: [
    { provide: REDIS_CLIENT, useValue: {} },
    { provide: CacheService, useValue: sharedCacheMock },
  ],
  exports: [REDIS_CLIENT, CacheService],
})
class StubCacheModule {}

@Global()
@Module({
  providers: [
    { provide: MailProducer, useValue: { enqueueOtp: jest.fn(), enqueueTransactional: jest.fn() } },
  ],
  exports: [MailProducer],
})
class StubQueueModule {}

@Global()
@Module({
  providers: [
    { provide: DataSource, useValue: sharedDataSourceMock },
    { provide: AuditService, useValue: sharedAuditMock },
  ],
  exports: [DataSource, AuditService],
})
class StubDatabaseModule {}

// ─── Helper: sign a JWT ───────────────────────────────────────────────────────

function signJwt(
  jwtService: JwtService,
  overrides: { sub?: string; principal?: string; roles?: string[]; companyId?: string } = {},
): string {
  return jwtService.sign({
    sub: overrides.sub ?? TEST_CUSTOMER_ID,
    principal: overrides.principal ?? 'customer',
    roles: overrides.roles ?? [],
    ...(overrides.companyId ? { companyId: overrides.companyId } : {}),
  });
}

// ─── Fake entity shapes ───────────────────────────────────────────────────────

function fakeCompletedOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_ORDER_ID,
    customerId: TEST_CUSTOMER_ID,
    companyId: TEST_COMPANY_ID,
    status: 'completed',
    ...overrides,
  };
}

function fakeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_REVIEW_ID,
    orderId: TEST_ORDER_ID,
    customerId: TEST_CUSTOMER_ID,
    rating: 5,
    comment: 'Great service',
    reply: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('T069 — Reviews contract tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let customerToken: string;
  let providerToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              JWT_SECRET: TEST_JWT_SECRET,
              JWT_ACCESS_TTL_SECONDS: 900,
              JWT_REFRESH_TTL_SECONDS: 2592000,
            }),
          ],
        }),
        JwtModule.register({
          global: true,
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: 900 },
        }),
        StubCacheModule,
        StubQueueModule,
        StubDatabaseModule,
        ReviewsModule,
      ],
      providers: [
        TokensService,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider('ReviewEntityRepository')
      .useValue(reviewRepositoryMock)
      .overrideProvider('ReviewReplyEntityRepository')
      .useValue(reviewReplyRepositoryMock)
      .overrideProvider('OrderEntityRepository')
      .useValue(orderRepositoryMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new CorrelationIdInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    jwtService = moduleRef.get(JwtService);
    customerToken = signJwt(jwtService, { sub: TEST_CUSTOMER_ID, principal: 'customer' });
    providerToken = signJwt(jwtService, {
      sub: TEST_PROVIDER_USER_ID,
      principal: 'provider',
      roles: ['provider_owner'],
      companyId: TEST_COMPANY_ID,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    orderRepositoryMock.findOne.mockResolvedValue(null);
    reviewRepositoryMock.findOne.mockResolvedValue(null);
    reviewReplyRepositoryMock.findOne.mockResolvedValue(null);
  });

  // ─── POST /v1/bookings/:id/review ─────────────────────────────────────────

  describe('POST /v1/bookings/:orderId/review', () => {
    const validReviewPayload = {
      rating: 5,
      comment: 'Excellent work, very professional!',
    };

    it('201 — creates review for a completed order owned by the customer', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(fakeCompletedOrder());
      reviewRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validReviewPayload)
        .expect(201);

      expect(res.body).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          rating: 5,
        }),
      );
    });

    it('401 — unauthenticated request returns 401', async () => {
      await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .send(validReviewPayload)
        .expect(401);
    });

    it('404 — order not found returns 404', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validReviewPayload)
        .expect(404);

      expect(res.body).toHaveProperty('status', 404);
    });

    it('403 — order belongs to a different customer returns 403', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(
        fakeCompletedOrder({ customerId: 'other-customer-id-not-matching' }),
      );

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validReviewPayload)
        .expect(403);

      expect(res.body).toHaveProperty('status', 403);
    });

    it('422 — order is not completed returns 422', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(
        fakeCompletedOrder({ status: 'accepted' }),
      );

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validReviewPayload)
        .expect(422);

      expect(res.body).toHaveProperty('status', 422);
    });

    it('409 — review already exists for this order returns 409', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(fakeCompletedOrder());
      reviewRepositoryMock.findOne.mockResolvedValue(fakeReview());

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validReviewPayload)
        .expect(409);

      expect(res.body).toHaveProperty('status', 409);
    });

    it('400 — missing rating field returns 400', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(fakeCompletedOrder());

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ comment: 'No rating here' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — rating outside 1–5 range returns 400', async () => {
      orderRepositoryMock.findOne.mockResolvedValue(fakeCompletedOrder());

      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${TEST_ORDER_ID}/review`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 10, comment: 'Way too high' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });
  });

  // ─── POST /v1/reviews/:id/reply ───────────────────────────────────────────

  describe('POST /v1/reviews/:id/reply', () => {
    const validReplyPayload = {
      comment: 'Thank you for your feedback, we look forward to serving you again!',
    };

    it('201 — provider can reply to an existing review', async () => {
      reviewRepositoryMock.findOne.mockResolvedValue(
        fakeReview({ companyId: TEST_COMPANY_ID }),
      );
      reviewReplyRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post(`/v1/reviews/${TEST_REVIEW_ID}/reply`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(validReplyPayload)
        .expect(201);

      expect(res.body).toMatchObject(
        expect.objectContaining({
          comment: expect.any(String),
        }),
      );
    });

    it('401 — unauthenticated reply returns 401', async () => {
      await request(app.getHttpServer())
        .post(`/v1/reviews/${TEST_REVIEW_ID}/reply`)
        .send(validReplyPayload)
        .expect(401);
    });

    it('404 — review not found returns 404', async () => {
      reviewRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post(`/v1/reviews/${TEST_REVIEW_ID}/reply`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(validReplyPayload)
        .expect(404);

      expect(res.body).toHaveProperty('status', 404);
    });

    it('409 — reply already exists for this review returns 409', async () => {
      reviewRepositoryMock.findOne.mockResolvedValue(
        fakeReview({ companyId: TEST_COMPANY_ID }),
      );
      reviewReplyRepositoryMock.findOne.mockResolvedValue({
        id: 'existing-reply-id',
        reviewId: TEST_REVIEW_ID,
        comment: 'Already replied',
      });

      const res = await request(app.getHttpServer())
        .post(`/v1/reviews/${TEST_REVIEW_ID}/reply`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(validReplyPayload)
        .expect(409);

      expect(res.body).toHaveProperty('status', 409);
    });

    it('400 — missing comment field returns 400', async () => {
      reviewRepositoryMock.findOne.mockResolvedValue(
        fakeReview({ companyId: TEST_COMPANY_ID }),
      );

      const res = await request(app.getHttpServer())
        .post(`/v1/reviews/${TEST_REVIEW_ID}/reply`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });
  });
});
