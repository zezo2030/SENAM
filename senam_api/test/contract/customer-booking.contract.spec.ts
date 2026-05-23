/**
 * Customer & Booking contract tests
 *
 * Endpoints tested (all under /v1):
 *   GET  /me                         — 200 user shape, 401 without token
 *   POST /me/addresses               — 201 address shape
 *   GET  /companies                  — 200 array
 *   GET  /companies/:id              — 200 company shape
 *   GET  /companies/:id/services     — 200 array
 *   GET  /companies/:id/slots        — 200 array
 *   POST /bookings                   — 201 booking shape
 *   GET  /bookings                   — 200 array
 *   POST /uploads/presign            — 200 { uploadUrl, objectKey }
 *
 * These tests are EXPECTED TO FAIL before the feature modules are wired.
 * The current state of the repository has no controllers for /me, /companies,
 * /bookings, or /uploads/presign, so every request returns 404.  Once the
 * controllers exist, these tests will turn green.
 *
 * Infrastructure strategy:
 *   We build a slim NestJS test application using the same @Global stub module
 *   pattern used in auth.contract.spec.ts.  No real Postgres, Redis, or BullMQ
 *   connections are made.  All infrastructure ports are replaced with in-memory
 *   mock objects.
 *
 *   The JwtAuthGuard is active (it reads from the real TokensService which only
 *   calls jwtService.verify, no Redis).  Tests that need an authenticated user
 *   obtain a real JWT signed with the test secret.
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
import { ObjectStoragePort } from '../../src/infrastructure/storage/object-storage.port.js';
import { PaymentPort } from '../../src/infrastructure/payments/payment.port.js';
import { TokensService } from '../../src/modules/auth/tokens.service.js';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../src/common/guards/roles.guard.js';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter.js';
import { CorrelationIdInterceptor } from '../../src/common/interceptors/correlation-id.interceptor.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';

// ─── Test constants ──────────────────────────────────────────────────────────

const TEST_JWT_SECRET = 'contract-test-secret-at-least-32-chars!!';
const TEST_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const TEST_COMPANY_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const TEST_SLOT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const TEST_ADDRESS_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

// ─── Shared infrastructure mocks ─────────────────────────────────────────────

const sharedCacheMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  incrWithExpire: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue(true),
};

const sharedDataSourceMock = {
  query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
  }),
};

const sharedStorageMock: Pick<ObjectStoragePort, 'presignUpload' | 'presignDownload'> = {
  presignUpload: jest.fn().mockResolvedValue({
    uploadUrl: 'https://storage.example.com/presigned?sig=test',
    objectKey: 'uploads/test-object-key',
  }),
  presignDownload: jest.fn().mockResolvedValue('https://storage.example.com/download/test'),
};

const sharedPaymentMock: Pick<PaymentPort, 'authorise' | 'capture' | 'refund' | 'verifyWebhook'> = {
  authorise: jest.fn().mockResolvedValue({ providerPaymentId: 'pay_test', status: 'authorised' }),
  capture: jest.fn().mockResolvedValue(undefined),
  refund: jest.fn().mockResolvedValue({ providerRefundId: 'ref_test' }),
  verifyWebhook: jest.fn().mockReturnValue(true),
};

const sharedAuditMock = {
  write: jest.fn().mockResolvedValue(undefined),
};

// ─── Stub @Global modules ─────────────────────────────────────────────────────
//
// Each stub module exports its token under the same provider token as the real
// infrastructure module.  Declaring them @Global makes the exports available
// to all child modules without explicit imports.

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
  providers: [{ provide: ObjectStoragePort, useValue: sharedStorageMock }],
  exports: [ObjectStoragePort],
})
class StubStorageModule {}

@Global()
@Module({
  providers: [{ provide: PaymentPort, useValue: sharedPaymentMock }],
  exports: [PaymentPort],
})
class StubPaymentsModule {}

@Global()
@Module({
  providers: [
    { provide: DataSource, useValue: sharedDataSourceMock },
    { provide: AuditService, useValue: sharedAuditMock },
  ],
  exports: [DataSource, AuditService],
})
class StubDatabaseModule {}

// ─── Helper: sign a test JWT ──────────────────────────────────────────────────

function signTestJwt(
  jwtService: JwtService,
  payload: { sub?: string; principal?: string; roles?: string[] } = {},
): string {
  return jwtService.sign(
    {
      sub: payload.sub ?? TEST_USER_ID,
      principal: payload.principal ?? 'customer',
      roles: payload.roles ?? [],
    },
    { expiresIn: 900 },
  );
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('Customer & Booking contract tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let bearerToken: string;

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
        // Stub infrastructure modules (ordered before any feature modules)
        StubCacheModule,
        StubQueueModule,
        StubStorageModule,
        StubPaymentsModule,
        StubDatabaseModule,
        //
        // Feature modules (users, companies, bookings, uploads, etc.) are
        // intentionally NOT imported here because they do not exist yet.
        // Once implemented they should be imported here and the 404 failures
        // will become 200/201 successes.
        //
      ],
      providers: [
        // TokensService is needed by JwtAuthGuard
        TokensService,
        // Global guards — mirror AppModule
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
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
    jwtService = moduleRef.get(JwtService);
    bearerToken = signTestJwt(jwtService);
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /v1/me ─────────────────────────────────────────────────────────
  //
  // EXPECTED CURRENT STATE: 404 (no controller registered)
  // EXPECTED AFTER IMPLEMENTATION: 200 with user shape

  describe('GET /v1/me', () => {
    it('200 — returns user profile shape for authenticated request', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/me')
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(res.body).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
        }),
      );
    });

    it('401 — no Authorization header returns 401', async () => {
      await request(app.getHttpServer())
        .get('/v1/me')
        .expect(401);
    });

    it('401 — malformed Bearer token returns 401', async () => {
      await request(app.getHttpServer())
        .get('/v1/me')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });
  });

  // ─── POST /v1/me/addresses ───────────────────────────────────────────────

  describe('POST /v1/me/addresses', () => {
    const validAddressPayload = {
      label: 'Home',
      street: '123 Al Waab St',
      city: 'Doha',
      lat: 25.2854,
      lng: 51.531,
    };

    it('201 — creates address and returns address shape', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/me/addresses')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send(validAddressPayload)
        .expect(201);

      expect(res.body).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
        }),
      );
    });

    it('401 — unauthenticated request returns 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/me/addresses')
        .send(validAddressPayload)
        .expect(401);
    });
  });

  // ─── GET /v1/companies ──────────────────────────────────────────────────

  describe('GET /v1/companies', () => {
    it('200 — returns an array of companies', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/companies')
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 — accepts optional filter and pagination query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/companies')
        .query({ lat: 25.2854, lng: 51.531, sort: 'nearest', page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── GET /v1/companies/:id ──────────────────────────────────────────────

  describe('GET /v1/companies/:id', () => {
    it('200 — returns company shape for a known id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/companies/${TEST_COMPANY_ID}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(res.body).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
        }),
      );
    });

    it('404 — unknown company id returns 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('status', 404);
    });
  });

  // ─── GET /v1/companies/:id/services ─────────────────────────────────────

  describe('GET /v1/companies/:id/services', () => {
    it('200 — returns array of services for the company', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/companies/${TEST_COMPANY_ID}/services`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── GET /v1/companies/:id/slots ─────────────────────────────────────────

  describe('GET /v1/companies/:id/slots', () => {
    it('200 — returns array of slots for a given date', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/companies/${TEST_COMPANY_ID}/slots`)
        .query({ date: '2026-06-01' })
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('400 — missing required date query param returns 400', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/companies/${TEST_COMPANY_ID}/slots`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });
  });

  // ─── POST /v1/bookings ───────────────────────────────────────────────────

  describe('POST /v1/bookings', () => {
    const validBookingPayload = {
      companyId: TEST_COMPANY_ID,
      services: [
        { companyServiceId: '11111111-1111-1111-1111-111111111111', quantity: 1 },
      ],
      slotId: TEST_SLOT_ID,
      addressId: TEST_ADDRESS_ID,
      paymentMethod: 'card',
    };

    it('201 — creates a booking and returns booking shape', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send(validBookingPayload)
        .expect(201);

      expect(res.body).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          status: expect.any(String),
        }),
      );
    });

    it('401 — unauthenticated booking attempt returns 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/bookings')
        .send(validBookingPayload)
        .expect(401);
    });

    it('400 — missing required companyId returns 400', async () => {
      const { companyId: _omit, ...withoutCompany } = validBookingPayload;
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send(withoutCompany)
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — empty services array is rejected as minItems:1 violation', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ ...validBookingPayload, services: [] })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — invalid paymentMethod enum value returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ ...validBookingPayload, paymentMethod: 'wire_transfer' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });
  });

  // ─── GET /v1/bookings ────────────────────────────────────────────────────

  describe('GET /v1/bookings', () => {
    it('200 — returns array of bookings for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/bookings')
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 — accepts optional status filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/bookings')
        .query({ status: 'completed' })
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('401 — unauthenticated listing returns 401', async () => {
      await request(app.getHttpServer())
        .get('/v1/bookings')
        .expect(401);
    });
  });

  // ─── POST /v1/uploads/presign ────────────────────────────────────────────

  describe('POST /v1/uploads/presign', () => {
    const validPresignPayload = {
      purpose: 'gallery',
      contentType: 'image/jpeg',
    };

    it('200 — returns { uploadUrl, objectKey } for authenticated request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/uploads/presign')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send(validPresignPayload)
        .expect(200);

      expect(res.body).toHaveProperty('uploadUrl');
      expect(res.body).toHaveProperty('objectKey');
      expect(typeof res.body.uploadUrl).toBe('string');
      expect(typeof res.body.objectKey).toBe('string');
    });

    it('401 — unauthenticated presign returns 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/uploads/presign')
        .send(validPresignPayload)
        .expect(401);
    });

    it('400 — missing purpose field returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/uploads/presign')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ contentType: 'image/jpeg' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });

    it('400 — invalid purpose enum value returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/uploads/presign')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ purpose: 'unknown_purpose', contentType: 'image/jpeg' })
        .expect(400);

      expect(res.body).toHaveProperty('status', 400);
    });
  });

  // ─── JWT guard cross-cutting concern ─────────────────────────────────────
  //
  // These tests use /v1/healthz (which exists via HealthModule would exist,
  // but since we don't import it either, we test /v1/auth/otp/request which
  // is @Public — and then a protected endpoint that doesn't exist.
  //
  // The cross-cutting JWT tests that need an existing endpoint are better
  // tested in the auth spec.  Here we just confirm that the guard module
  // compiled correctly and the JWT service uses the right secret.

  describe('JWT guard — cross-cutting', () => {
    it('401 — tampered token (signature invalid) is rejected', async () => {
      const tamperedToken = bearerToken.slice(0, -5) + 'XXXXX';

      // This will return 404 (route doesn't exist) not 401 because /v1/me
      // has no controller yet.  Once UsersModule is wired, this will be 401.
      // We assert that we do NOT get 200 (auth doesn't accidentally succeed).
      const res = await request(app.getHttpServer())
        .get('/v1/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).not.toBe(200);
    });

    it('401 — token signed with wrong secret is rejected', async () => {
      const wrongSecretService = new JwtService({ secret: 'completely-different-secret-value!!' });
      const wrongToken = wrongSecretService.sign({ sub: TEST_USER_ID, principal: 'customer', roles: [] });

      const res = await request(app.getHttpServer())
        .get('/v1/me')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(res.status).not.toBe(200);
    });

    it('JwtService signs with the correct test secret', () => {
      const payload = { sub: TEST_USER_ID, principal: 'customer', roles: [] as string[] };
      const token = jwtService.sign(payload);
      const decoded = jwtService.verify<typeof payload>(token);
      expect(decoded.sub).toBe(TEST_USER_ID);
    });
  });
});
