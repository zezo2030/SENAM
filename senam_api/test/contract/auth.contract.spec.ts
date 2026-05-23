/**
 * Auth contract tests — POST /v1/auth/otp/request, /otp/verify, /refresh, /logout
 *
 * These tests run against an in-memory NestJS application with all real I/O
 * (Redis, BullMQ, TypeORM) replaced by lightweight mocks.  They deliberately
 * call endpoints that DON'T exist yet so that they fail before implementation
 * and pass once the modules are fully wired.
 *
 * Note on ESM / moduleNameMapper:
 *   Jest is configured with `"^(\\.{1,2}/.*)\\.js$": "$1"` so TypeScript
 *   source files compiled by ts-jest are resolved correctly even though
 *   the imports use the `.js` extension mandated by the project's NodeNext
 *   module resolution.
 *
 * Dependency injection strategy:
 *   AuthModule depends on CacheService (via OtpService + TokensService) and
 *   MailProducer, both of which normally come from @Global modules
 *   (RedisModule, QueueModule).  In testing we cannot import those @Global
 *   modules without triggering real Redis/Bull connections.  Instead we
 *   declare two thin @Global stub modules that export mock values under the
 *   same tokens, then import them alongside AuthModule.  NestJS resolves
 *   the providers from the global scope exactly as it would from the real
 *   infrastructure modules.
 */

import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Global, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

import { AuthModule } from '../../src/modules/auth/auth.module.js';
import { CacheService } from '../../src/infrastructure/cache/cache.service.js';
import { REDIS_CLIENT } from '../../src/infrastructure/cache/redis.module.js';
import { MailProducer } from '../../src/infrastructure/queue/producers/mail.producer.js';
import { UserEntity } from '../../src/modules/users/entities/user.entity.js';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter.js';
import { CorrelationIdInterceptor } from '../../src/common/interceptors/correlation-id.interceptor.js';
import { TokensService } from '../../src/modules/auth/tokens.service.js';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../src/common/guards/roles.guard.js';

// ─── Shared test constants ──────────────────────────────────────────────────

const TEST_EMAIL = 'contract-test@senam.qa';
const TEST_JWT_SECRET = 'contract-test-secret-at-least-32-chars!!';

// ─── Mock factories ───────────────────────────────────────────────────────────

/**
 * Build a fresh CacheService mock object.
 * Mutable reference — tests can re-program individual methods per-test.
 */
function makeCacheServiceMock() {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
    incrWithExpire: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue(true),
  };
}

function makeMailProducerMock() {
  return {
    enqueueOtp: jest.fn().mockResolvedValue(undefined),
    enqueueTransactional: jest.fn().mockResolvedValue(undefined),
  };
}

/** A tiny fake UserEntity row */
function fakeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  const u = new UserEntity();
  u.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  u.email = TEST_EMAIL;
  u.emailVerifiedAt = null;
  u.displayName = null;
  u.phone = null;
  u.locale = 'ar';
  u.status = 'active';
  u.createdAt = new Date();
  u.updatedAt = new Date();
  u.deletedAt = null;
  return Object.assign(u, overrides);
}

// ─── Stub modules ─────────────────────────────────────────────────────────────
//
// We declare these at module scope so they can refer to the shared mock
// objects that the tests mutate per-test.
//
// Using @Global() makes the exports visible to all imported child modules
// (AuthModule → OtpService, TokensService) without each needing to import
// the stub module explicitly.  This mirrors how RedisModule and QueueModule
// work in production.

// Shared mock singletons — allocated once for the describe block lifetime
const sharedCacheMock = makeCacheServiceMock();
const sharedMailMock = makeMailProducerMock();

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
  providers: [{ provide: MailProducer, useValue: sharedMailMock }],
  exports: [MailProducer],
})
class StubQueueModule {}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('Auth contract — POST /v1/auth/*', () => {
  let app: INestApplication;
  let tokensService: TokensService;

  const userRepositoryMock = {
    findOne: jest.fn().mockResolvedValue(fakeUser()),
    create: jest.fn().mockImplementation((data: Partial<UserEntity>) => Object.assign(fakeUser(), data)),
    save: jest.fn().mockImplementation(async (u: UserEntity) => u),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  function resetMocks() {
    sharedCacheMock.get.mockResolvedValue(null);
    sharedCacheMock.set.mockResolvedValue(undefined);
    sharedCacheMock.del.mockResolvedValue(undefined);
    sharedCacheMock.exists.mockResolvedValue(false);
    sharedCacheMock.incrWithExpire.mockResolvedValue(1);
    sharedMailMock.enqueueOtp.mockResolvedValue(undefined);
    userRepositoryMock.findOne.mockResolvedValue(fakeUser());
    userRepositoryMock.update.mockResolvedValue({ affected: 1 });
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: TEST_JWT_SECRET,
              JWT_ACCESS_TTL_SECONDS: 900,
              JWT_REFRESH_TTL_SECONDS: 2592000,
              OTP_RATE_LIMIT_ISSUE_PER_HOUR: 3,
              OTP_RATE_LIMIT_VERIFY_ATTEMPTS: 5,
            }),
          ],
        }),
        // Stub @Global modules must be imported before AuthModule so their
        // exports are available when AuthModule's providers are resolved.
        StubCacheModule,
        StubQueueModule,
        AuthModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      // The UserEntity repository is registered by AuthModule via
      // TypeOrmModule.forFeature([UserEntity]).  We override it here.
      .overrideProvider(getRepositoryToken(UserEntity))
      .useValue(userRepositoryMock)
      .compile();

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
    tokensService = moduleRef.get(TokensService);
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMocks();
  });

  // ─── POST /v1/auth/otp/request ───────────────────────────────────────────

  describe('POST /v1/auth/otp/request', () => {
    it('200 — returns { message: "otp_sent" } for a valid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/request')
        .send({ email: TEST_EMAIL })
        .expect(200);

      expect(res.body).toMatchObject({ message: 'otp_sent' });
      expect(sharedMailMock.enqueueOtp).toHaveBeenCalledTimes(1);
      expect(sharedMailMock.enqueueOtp).toHaveBeenCalledWith(
        expect.objectContaining({ email: TEST_EMAIL }),
      );
    });

    it('400 — missing email field fails class-validator', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/request')
        .send({})
        .expect(400);

      // Error envelope follows RFC-7807 problem+json from AllExceptionsFilter
      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — invalid email string fails @IsEmail', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/request')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — invalid principal value fails @IsIn validation', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/request')
        .send({ email: TEST_EMAIL, principal: 'hacker' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('enqueues OTP mail exactly once on success', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/otp/request')
        .send({ email: TEST_EMAIL, principal: 'customer' })
        .expect(200);

      expect(sharedMailMock.enqueueOtp).toHaveBeenCalledTimes(1);
    });
  });

  // ─── POST /v1/auth/otp/verify ────────────────────────────────────────────

  describe('POST /v1/auth/otp/verify', () => {
    /**
     * Seed the cache mock so verifyOtp succeeds:
     *  1. incrWithExpire returns 1 — below rate-limit
     *  2. cache.get returns a real bcrypt hash of the given code
     */
    async function seedValidOtp(code = '123456'): Promise<void> {
      const hash = await bcrypt.hash(code, 10);
      sharedCacheMock.get.mockImplementation((key: string) => {
        if (key.startsWith('otp:hash:')) return Promise.resolve(hash);
        return Promise.resolve(null);
      });
    }

    it('200 — returns { accessToken, refreshToken } on valid OTP', async () => {
      await seedValidOtp();

      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ email: TEST_EMAIL, code: '123456', principal: 'customer' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
    });

    it('400 — code shorter than 6 chars fails @Length(6,6)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ email: TEST_EMAIL, code: '12345', principal: 'customer' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — code longer than 6 chars fails @Length(6,6)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ email: TEST_EMAIL, code: '1234567', principal: 'customer' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — missing email fails validation', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ code: '123456', principal: 'customer' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('401 — invalid OTP code (hash mismatch) returns 401', async () => {
      const hash = await bcrypt.hash('999999', 10);
      sharedCacheMock.get.mockImplementation((key: string) => {
        if (key.startsWith('otp:hash:')) return Promise.resolve(hash);
        return Promise.resolve(null);
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ email: TEST_EMAIL, code: '123456', principal: 'customer' })
        .expect(401);

      expect(res.body).toHaveProperty('status', 401);
    });

    it('401 — no OTP stored in cache returns 401', async () => {
      sharedCacheMock.get.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/v1/auth/otp/verify')
        .send({ email: TEST_EMAIL, code: '123456', principal: 'customer' })
        .expect(401);

      expect(res.body).toHaveProperty('status', 401);
    });
  });

  // ─── POST /v1/auth/refresh ───────────────────────────────────────────────

  describe('POST /v1/auth/refresh', () => {
    /**
     * Issue a real refresh token via the live TokensService so that
     * rotateRefreshToken can validate its bcrypt hash.
     * We intercept cache.set to capture what was stored, then program
     * cache.get to return that value for subsequent reads.
     */
    async function issueRealRefreshToken(): Promise<string> {
      let storedData: string | null = null;

      sharedCacheMock.set.mockImplementation((_key: string, value: string) => {
        storedData = value;
        return Promise.resolve(undefined);
      });

      const pair = await tokensService.issueTokenPair({
        sub: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        principal: 'customer',
        roles: [],
      });

      // Wire cache.get so rotateRefreshToken finds the stored hash
      const captured = storedData;
      sharedCacheMock.get.mockImplementation((key: string) => {
        if (key.startsWith('refresh:')) return Promise.resolve(captured);
        return Promise.resolve(null);
      });
      sharedCacheMock.set.mockResolvedValue(undefined);

      return pair.refreshToken;
    }

    it('200 — returns new { accessToken, refreshToken } on valid token', async () => {
      const refreshToken = await issueRealRefreshToken();

      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
    });

    it('401 — token whose cache entry is gone returns 401', async () => {
      sharedCacheMock.get.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'some-uuid.some-hex-bytes-that-dont-exist' })
        .expect(401);

      expect(res.body).toHaveProperty('status', 401);
    });

    it('400 — missing refreshToken body fails class-validator @IsString', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });
  });

  // ─── POST /v1/auth/logout ────────────────────────────────────────────────

  describe('POST /v1/auth/logout', () => {
    it('204 — revokes the refresh token and returns no body', async () => {
      const someToken = 'some-uuid.some-hex-bytes-here-32bytesxx';
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({ refreshToken: someToken })
        .expect(204);

      // cache.del must have been called to revoke the refresh: key
      expect(sharedCacheMock.del).toHaveBeenCalled();
    });

    it('400 — missing refreshToken body fails class-validator @IsString', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('204 — logout with any string token is idempotent (no error thrown)', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({ refreshToken: 'nonexistent-token-that-is-fine' })
        .expect(204);
    });
  });
});
