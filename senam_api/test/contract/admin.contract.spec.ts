/**
 * T079 — Admin contract tests
 *
 * Endpoints tested (all under /v1/admin/):
 *   GET  /v1/admin/companies
 *   POST /v1/admin/companies/:id/approve
 *   POST /v1/admin/companies/:id/suspend
 *   PATCH /v1/admin/companies/:id/commission
 *   GET  /v1/admin/orders
 *   POST /v1/admin/orders/:id/intervene
 *   GET  /v1/admin/coupons
 *   POST /v1/admin/coupons
 *   PATCH /v1/admin/coupons/:id
 *   DELETE /v1/admin/coupons/:id
 *   GET  /v1/admin/catalog/categories
 *   POST /v1/admin/catalog/categories
 *   PATCH /v1/admin/catalog/categories/:id
 *   DELETE /v1/admin/catalog/categories/:id
 *   GET  /v1/admin/catalog/services
 *   POST /v1/admin/catalog/services
 *   PATCH /v1/admin/catalog/services/:id
 *   DELETE /v1/admin/catalog/services/:id
 *   GET  /v1/admin/reports/sales
 *   GET  /v1/admin/audit
 *
 * WHY THESE TESTS FAIL NOW:
 *   AdminModule, ReportsModule, and AuditModule do not expose these routes yet.
 *   The imports at the bottom of the test-module builder will throw
 *   module-not-found errors, and even if that were skipped the routes return
 *   404 because no AdminController is registered.  All tests are expected to
 *   fail until the Phase 6 admin implementation is complete.
 *
 * Infrastructure strategy:
 *   Same @Global stub-module pattern as auth.contract.spec.ts.
 *   No real Postgres, Redis, or BullMQ connections are made.
 *   TypeORM DataSource is replaced with a full queryRunner mock.
 *   JWT tokens are minted inline for each role under test.
 */

import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Global, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { CacheService } from '../../src/infrastructure/cache/cache.service.js';
import { REDIS_CLIENT } from '../../src/infrastructure/cache/redis.module.js';
import { MailProducer } from '../../src/infrastructure/queue/producers/mail.producer.js';
import { NotificationsProducer } from '../../src/infrastructure/queue/producers/notifications.producer.js';
import { DispatchProducer } from '../../src/infrastructure/queue/producers/dispatch.producer.js';
import { PaymentPort } from '../../src/infrastructure/payments/payment.port.js';
import { PaymentEntity } from '../../src/modules/payments/entities/payment.entity.js';
import { TokensService } from '../../src/modules/auth/tokens.service.js';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../src/common/guards/roles.guard.js';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter.js';
import { CorrelationIdInterceptor } from '../../src/common/interceptors/correlation-id.interceptor.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { AdminModule } from '../../src/modules/admin/admin.module.js';
import { ReportsModule } from '../../src/modules/reports/reports.module.js';
import { AuditModule } from '../../src/modules/audit/audit.module.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const TEST_JWT_SECRET = 'admin-contract-test-secret-32chars!!';

const ADMIN_USER_ID = 'a0000000-0000-0000-0000-000000000001';
const TEST_COMPANY_ID = 'c0000000-0000-0000-0000-000000000001';
const TEST_ORDER_ID = 'b0000000-0000-0000-0000-000000000001';
const TEST_COUPON_ID = 'd0000000-0000-0000-0000-000000000001';
const TEST_CATEGORY_ID = 'e0000000-0000-0000-0000-000000000001';
const TEST_SERVICE_ID = 'f0000000-0000-0000-0000-000000000001';

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
  search: jest.fn().mockResolvedValue({ items: [], total: 0 }),
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
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
    },
  };
}

const sharedDataSourceMock = {
  query: jest.fn().mockResolvedValue([]),
  createQueryRunner: jest.fn().mockReturnValue(makeQueryRunnerMock()),
  getRepository: jest.fn().mockReturnValue({
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn().mockImplementation(async (e: unknown) => e),
    create: jest.fn().mockImplementation((d: unknown) => d),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
  }),
};

// ─── Repository mocks ─────────────────────────────────────────────────────────

function makeRepoMock(defaultFind: unknown = null) {
  return {
    findOne: jest.fn().mockResolvedValue(defaultFind),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn().mockImplementation(async (e: unknown) => ({ id: 'new-id', ...((e as object) ?? {}) })),
    create: jest.fn().mockImplementation((d: unknown) => d),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
  };
}

const companyRepositoryMock = makeRepoMock({ id: TEST_COMPANY_ID, status: 'pending', commissionBps: 1500 });
const orderRepositoryMock = makeRepoMock({ id: TEST_ORDER_ID, status: 'pending' });
const couponRepositoryMock = makeRepoMock({ id: TEST_COUPON_ID, code: 'TEST10' });
const categoryRepositoryMock = makeRepoMock({ id: TEST_CATEGORY_ID, slug: 'cleaning' });
const serviceRepositoryMock = makeRepoMock({ id: TEST_SERVICE_ID, slug: 'home-cleaning' });
const auditLogRepositoryMock = makeRepoMock(null);
const refundRepositoryMock = makeRepoMock(null);

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

const mockNotificationsProducer = { enqueue: jest.fn().mockResolvedValue(undefined) };
const mockDispatchProducer = {
  enqueueAcceptTimeout: jest.fn().mockResolvedValue(undefined),
  removeAcceptTimeout: jest.fn().mockResolvedValue(undefined),
};
const mockPaymentPort = {
  authorise: jest.fn().mockResolvedValue({ providerPaymentId: 'test-pay-001', status: 'authorised' }),
  capture: jest.fn().mockResolvedValue(undefined),
  refund: jest.fn().mockResolvedValue({ providerRefundId: 'test-refund-001' }),
  verifyWebhook: jest.fn().mockReturnValue(true),
};

@Global()
@Module({
  providers: [
    { provide: MailProducer, useValue: { enqueueOtp: jest.fn(), enqueueTransactional: jest.fn() } },
    { provide: NotificationsProducer, useValue: mockNotificationsProducer },
    { provide: DispatchProducer, useValue: mockDispatchProducer },
  ],
  exports: [MailProducer, NotificationsProducer, DispatchProducer],
})
class StubQueueModule {}

@Global()
@Module({
  providers: [
    { provide: DataSource, useValue: sharedDataSourceMock },
    { provide: AuditService, useValue: sharedAuditMock },
    { provide: PaymentPort, useValue: mockPaymentPort },
  ],
  exports: [DataSource, AuditService, PaymentPort],
})
class StubDatabaseModule {}

// ─── Helper: sign a JWT ───────────────────────────────────────────────────────

function signAdminJwt(jwtService: JwtService, roles: string[]): string {
  return jwtService.sign({
    sub: ADMIN_USER_ID,
    principal: 'admin',
    roles,
  });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('T079 — Admin contract tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let superAdminToken: string;
  let opsAdminToken: string;
  let supportAdminToken: string;
  let financeAdminToken: string;

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
        AdminModule,
        ReportsModule,
        AuditModule,
      ],
      providers: [
        TokensService,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider('CompanyEntityRepository')
      .useValue(companyRepositoryMock)
      .overrideProvider('OrderEntityRepository')
      .useValue(orderRepositoryMock)
      .overrideProvider('CouponEntityRepository')
      .useValue(couponRepositoryMock)
      .overrideProvider('CategoryEntityRepository')
      .useValue(categoryRepositoryMock)
      .overrideProvider('ServiceEntityRepository')
      .useValue(serviceRepositoryMock)
      .overrideProvider(getRepositoryToken(PaymentEntity))
      .useValue(makeRepoMock({ id: 'pay-001', orderId: TEST_ORDER_ID, status: 'authorised', amount: 8000 }))
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
    superAdminToken = signAdminJwt(jwtService, ['super_admin']);
    opsAdminToken = signAdminJwt(jwtService, ['ops_admin']);
    supportAdminToken = signAdminJwt(jwtService, ['support_admin']);
    financeAdminToken = signAdminJwt(jwtService, ['finance_admin']);
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset all repository mocks to safe defaults
    companyRepositoryMock.findOne.mockResolvedValue({ id: TEST_COMPANY_ID, status: 'pending', commissionBps: 1500 });
    companyRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_COMPANY_ID }], 1]);
    orderRepositoryMock.findOne.mockResolvedValue({ id: TEST_ORDER_ID, status: 'pending' });
    orderRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_ORDER_ID }], 1]);
    couponRepositoryMock.findOne.mockResolvedValue({ id: TEST_COUPON_ID, code: 'TEST10' });
    couponRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_COUPON_ID }], 1]);
    categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID, slug: 'cleaning' });
    categoryRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_CATEGORY_ID }], 1]);
    serviceRepositoryMock.findOne.mockResolvedValue({ id: TEST_SERVICE_ID, slug: 'home-cleaning' });
    serviceRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_SERVICE_ID }], 1]);
    sharedAuditMock.write.mockResolvedValue(undefined);
    sharedAuditMock.search.mockResolvedValue({ items: [], total: 0 });
    sharedDataSourceMock.createQueryRunner.mockReturnValue(makeQueryRunnerMock());
  });

  // ─── 401 Unauthenticated guard ───────────────────────────────────────────────

  describe('Unauthenticated requests', () => {
    it('GET /v1/admin/companies — 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/companies')
        .expect(401);
    });

    it('GET /v1/admin/orders — 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/orders')
        .expect(401);
    });

    it('GET /v1/admin/audit — 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/audit')
        .expect(401);
    });
  });

  // ─── Company management ──────────────────────────────────────────────────────

  describe('GET /v1/admin/companies', () => {
    it('200 — super_admin can list companies', async () => {
      companyRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_COMPANY_ID, status: 'pending' }], 1]);

      const res = await request(app.getHttpServer())
        .get('/v1/admin/companies')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can list companies', async () => {
      companyRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_COMPANY_ID, status: 'pending' }], 1]);

      await request(app.getHttpServer())
        .get('/v1/admin/companies')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });

    it('403 — support_admin cannot list companies (read-only role has no admin scope)', async () => {
      // support_admin lacks the required roles for any admin/company endpoint
      await request(app.getHttpServer())
        .get('/v1/admin/companies')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  describe('POST /v1/admin/companies/:id/approve', () => {
    it('200 — super_admin can approve a company', async () => {
      companyRepositoryMock.findOne.mockResolvedValue({ id: TEST_COMPANY_ID, status: 'pending' });

      const res = await request(app.getHttpServer())
        .post(`/v1/admin/companies/${TEST_COMPANY_ID}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can approve a company', async () => {
      companyRepositoryMock.findOne.mockResolvedValue({ id: TEST_COMPANY_ID, status: 'pending' });

      await request(app.getHttpServer())
        .post(`/v1/admin/companies/${TEST_COMPANY_ID}/approve`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });

    it('403 — support_admin cannot approve a company', async () => {
      await request(app.getHttpServer())
        .post(`/v1/admin/companies/${TEST_COMPANY_ID}/approve`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  describe('POST /v1/admin/companies/:id/suspend', () => {
    it('200 — super_admin can suspend a company', async () => {
      companyRepositoryMock.findOne.mockResolvedValue({ id: TEST_COMPANY_ID, status: 'active' });

      const res = await request(app.getHttpServer())
        .post(`/v1/admin/companies/${TEST_COMPANY_ID}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'policy violation' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can suspend a company', async () => {
      companyRepositoryMock.findOne.mockResolvedValue({ id: TEST_COMPANY_ID, status: 'active' });

      await request(app.getHttpServer())
        .post(`/v1/admin/companies/${TEST_COMPANY_ID}/suspend`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ reason: 'policy violation' })
        .expect(200);
    });

    it('403 — support_admin cannot suspend a company', async () => {
      await request(app.getHttpServer())
        .post(`/v1/admin/companies/${TEST_COMPANY_ID}/suspend`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ reason: 'policy violation' })
        .expect(403);
    });
  });

  describe('PATCH /v1/admin/companies/:id/commission', () => {
    it('200 — super_admin can update commission', async () => {
      companyRepositoryMock.findOne.mockResolvedValue({ id: TEST_COMPANY_ID, status: 'active', commissionBps: 1500 });

      const res = await request(app.getHttpServer())
        .patch(`/v1/admin/companies/${TEST_COMPANY_ID}/commission`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ commissionBps: 2000 })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('403 — ops_admin cannot change commission (super_admin only)', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/admin/companies/${TEST_COMPANY_ID}/commission`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ commissionBps: 2000 })
        .expect(403);
    });

    it('403 — support_admin cannot change commission', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/admin/companies/${TEST_COMPANY_ID}/commission`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ commissionBps: 2000 })
        .expect(403);
    });
  });

  // ─── Order management ────────────────────────────────────────────────────────

  describe('GET /v1/admin/orders', () => {
    it('200 — super_admin can list all orders', async () => {
      orderRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_ORDER_ID }], 1]);

      const res = await request(app.getHttpServer())
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can list all orders', async () => {
      orderRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_ORDER_ID }], 1]);

      await request(app.getHttpServer())
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });

    it('200 — support_admin can list orders (read-only access)', async () => {
      orderRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_ORDER_ID }], 1]);

      await request(app.getHttpServer())
        .get('/v1/admin/orders')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(200);
    });
  });

  describe('POST /v1/admin/orders/:id/intervene', () => {
    it('200 — super_admin can intervene on an order (refund_partial)', async () => {
      orderRepositoryMock.findOne.mockResolvedValue({ id: TEST_ORDER_ID, status: 'pending', total: 10000 });

      const res = await request(app.getHttpServer())
        .post(`/v1/admin/orders/${TEST_ORDER_ID}/intervene`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ action: 'refund_partial', amount: 5000, reason: 'customer complaint' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can intervene on an order (cancel)', async () => {
      orderRepositoryMock.findOne.mockResolvedValue({ id: TEST_ORDER_ID, status: 'pending', total: 10000 });

      await request(app.getHttpServer())
        .post(`/v1/admin/orders/${TEST_ORDER_ID}/intervene`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ action: 'cancel', reason: 'admin cancel' })
        .expect(200);
    });

    it('403 — support_admin cannot intervene on orders', async () => {
      await request(app.getHttpServer())
        .post(`/v1/admin/orders/${TEST_ORDER_ID}/intervene`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ action: 'cancel', reason: 'admin cancel' })
        .expect(403);
    });
  });

  // ─── Coupon management ───────────────────────────────────────────────────────

  describe('GET /v1/admin/coupons', () => {
    it('200 — super_admin can list coupons', async () => {
      couponRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_COUPON_ID, code: 'SAVE10' }], 1]);

      const res = await request(app.getHttpServer())
        .get('/v1/admin/coupons')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can list coupons', async () => {
      couponRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_COUPON_ID, code: 'SAVE10' }], 1]);

      await request(app.getHttpServer())
        .get('/v1/admin/coupons')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });
  });

  describe('POST /v1/admin/coupons', () => {
    const validCouponPayload = {
      code: 'NEWCODE20',
      discountType: 'percent',
      discountValue: 20,
      maxUses: 100,
      expiresAt: '2027-01-01T00:00:00.000Z',
    };

    it('201 — super_admin can create a coupon', async () => {
      couponRepositoryMock.findOne.mockResolvedValue(null); // code not already taken

      const res = await request(app.getHttpServer())
        .post('/v1/admin/coupons')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validCouponPayload)
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('201 — ops_admin can create a coupon', async () => {
      couponRepositoryMock.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/v1/admin/coupons')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send(validCouponPayload)
        .expect(201);
    });

    it('403 — support_admin cannot create a coupon', async () => {
      await request(app.getHttpServer())
        .post('/v1/admin/coupons')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send(validCouponPayload)
        .expect(403);
    });
  });

  describe('PATCH /v1/admin/coupons/:id', () => {
    it('200 — super_admin can update a coupon', async () => {
      couponRepositoryMock.findOne.mockResolvedValue({ id: TEST_COUPON_ID, code: 'TEST10' });

      const res = await request(app.getHttpServer())
        .patch(`/v1/admin/coupons/${TEST_COUPON_ID}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ maxUses: 200 })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can update a coupon', async () => {
      couponRepositoryMock.findOne.mockResolvedValue({ id: TEST_COUPON_ID, code: 'TEST10' });

      await request(app.getHttpServer())
        .patch(`/v1/admin/coupons/${TEST_COUPON_ID}`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ maxUses: 200 })
        .expect(200);
    });

    it('403 — support_admin cannot update a coupon', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/admin/coupons/${TEST_COUPON_ID}`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ maxUses: 200 })
        .expect(403);
    });
  });

  describe('DELETE /v1/admin/coupons/:id', () => {
    it('204 — super_admin can delete a coupon', async () => {
      couponRepositoryMock.findOne.mockResolvedValue({ id: TEST_COUPON_ID, code: 'TEST10' });

      await request(app.getHttpServer())
        .delete(`/v1/admin/coupons/${TEST_COUPON_ID}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(204);
    });

    it('204 — ops_admin can delete a coupon', async () => {
      couponRepositoryMock.findOne.mockResolvedValue({ id: TEST_COUPON_ID, code: 'TEST10' });

      await request(app.getHttpServer())
        .delete(`/v1/admin/coupons/${TEST_COUPON_ID}`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(204);
    });

    it('403 — support_admin cannot delete a coupon', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/admin/coupons/${TEST_COUPON_ID}`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  // ─── Catalog: Categories ─────────────────────────────────────────────────────

  describe('GET /v1/admin/catalog/categories', () => {
    it('200 — super_admin can list categories', async () => {
      categoryRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_CATEGORY_ID }], 1]);

      const res = await request(app.getHttpServer())
        .get('/v1/admin/catalog/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can list categories', async () => {
      categoryRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_CATEGORY_ID }], 1]);

      await request(app.getHttpServer())
        .get('/v1/admin/catalog/categories')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });
  });

  describe('POST /v1/admin/catalog/categories', () => {
    const validCategoryPayload = {
      slug: 'new-category',
      nameAr: 'فئة جديدة',
      nameEn: 'New Category',
      sortOrder: 10,
    };

    it('201 — super_admin can create a category', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/v1/admin/catalog/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validCategoryPayload)
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('201 — ops_admin can create a category', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/v1/admin/catalog/categories')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send(validCategoryPayload)
        .expect(201);
    });

    it('403 — support_admin cannot create a category', async () => {
      await request(app.getHttpServer())
        .post('/v1/admin/catalog/categories')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send(validCategoryPayload)
        .expect(403);
    });
  });

  describe('PATCH /v1/admin/catalog/categories/:id', () => {
    it('200 — super_admin can update a category', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID, slug: 'cleaning' });

      const res = await request(app.getHttpServer())
        .patch(`/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ nameAr: 'تنظيف مُحدَّث' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can update a category', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID, slug: 'cleaning' });

      await request(app.getHttpServer())
        .patch(`/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ nameAr: 'تنظيف مُحدَّث' })
        .expect(200);
    });

    it('403 — support_admin cannot update a category', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ nameAr: 'تنظيف مُحدَّث' })
        .expect(403);
    });
  });

  describe('DELETE /v1/admin/catalog/categories/:id', () => {
    it('204 — super_admin can delete a category', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID, slug: 'cleaning' });

      await request(app.getHttpServer())
        .delete(`/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(204);
    });

    it('204 — ops_admin can delete a category', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID, slug: 'cleaning' });

      await request(app.getHttpServer())
        .delete(`/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(204);
    });

    it('403 — support_admin cannot delete a category', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  // ─── Catalog: Services ───────────────────────────────────────────────────────

  describe('GET /v1/admin/catalog/services', () => {
    it('200 — super_admin can list services', async () => {
      serviceRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_SERVICE_ID }], 1]);

      const res = await request(app.getHttpServer())
        .get('/v1/admin/catalog/services')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can list services', async () => {
      serviceRepositoryMock.findAndCount.mockResolvedValue([[{ id: TEST_SERVICE_ID }], 1]);

      await request(app.getHttpServer())
        .get('/v1/admin/catalog/services')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });
  });

  describe('POST /v1/admin/catalog/services', () => {
    const validServicePayload = {
      categoryId: TEST_CATEGORY_ID,
      slug: 'new-service',
      nameAr: 'خدمة جديدة',
      nameEn: 'New Service',
      baseDurationMinutes: 60,
    };

    it('201 — super_admin can create a service', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID });
      serviceRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/v1/admin/catalog/services')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validServicePayload)
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('201 — ops_admin can create a service', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ id: TEST_CATEGORY_ID });
      serviceRepositoryMock.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/v1/admin/catalog/services')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send(validServicePayload)
        .expect(201);
    });

    it('403 — support_admin cannot create a service', async () => {
      await request(app.getHttpServer())
        .post('/v1/admin/catalog/services')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send(validServicePayload)
        .expect(403);
    });
  });

  describe('PATCH /v1/admin/catalog/services/:id', () => {
    it('200 — super_admin can update a service', async () => {
      serviceRepositoryMock.findOne.mockResolvedValue({ id: TEST_SERVICE_ID, slug: 'home-cleaning' });

      const res = await request(app.getHttpServer())
        .patch(`/v1/admin/catalog/services/${TEST_SERVICE_ID}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ baseDurationMinutes: 90 })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can update a service', async () => {
      serviceRepositoryMock.findOne.mockResolvedValue({ id: TEST_SERVICE_ID, slug: 'home-cleaning' });

      await request(app.getHttpServer())
        .patch(`/v1/admin/catalog/services/${TEST_SERVICE_ID}`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ baseDurationMinutes: 90 })
        .expect(200);
    });

    it('403 — support_admin cannot update a service', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/admin/catalog/services/${TEST_SERVICE_ID}`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ baseDurationMinutes: 90 })
        .expect(403);
    });
  });

  describe('DELETE /v1/admin/catalog/services/:id', () => {
    it('204 — super_admin can delete a service', async () => {
      serviceRepositoryMock.findOne.mockResolvedValue({ id: TEST_SERVICE_ID, slug: 'home-cleaning' });

      await request(app.getHttpServer())
        .delete(`/v1/admin/catalog/services/${TEST_SERVICE_ID}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(204);
    });

    it('204 — ops_admin can delete a service', async () => {
      serviceRepositoryMock.findOne.mockResolvedValue({ id: TEST_SERVICE_ID, slug: 'home-cleaning' });

      await request(app.getHttpServer())
        .delete(`/v1/admin/catalog/services/${TEST_SERVICE_ID}`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(204);
    });

    it('403 — support_admin cannot delete a service', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/admin/catalog/services/${TEST_SERVICE_ID}`)
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  // ─── Reports ─────────────────────────────────────────────────────────────────

  describe('GET /v1/admin/reports/sales', () => {
    it('200 — super_admin can access sales report', async () => {
      sharedDataSourceMock.query.mockResolvedValue([{ totalRevenue: '150000', orderCount: '15' }]);

      const res = await request(app.getHttpServer())
        .get('/v1/admin/reports/sales')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — finance_admin can access sales report', async () => {
      sharedDataSourceMock.query.mockResolvedValue([{ totalRevenue: '150000', orderCount: '15' }]);

      await request(app.getHttpServer())
        .get('/v1/admin/reports/sales')
        .set('Authorization', `Bearer ${financeAdminToken}`)
        .expect(200);
    });

    it('403 — ops_admin cannot access sales report (finance restricted)', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/reports/sales')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(403);
    });

    it('403 — support_admin cannot access sales report', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/reports/sales')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  // ─── Audit log ───────────────────────────────────────────────────────────────

  describe('GET /v1/admin/audit', () => {
    it('200 — super_admin can read audit logs', async () => {
      sharedAuditMock.search.mockResolvedValue({ items: [{ action: 'order.intervene', actorId: ADMIN_USER_ID }], total: 1 });

      const res = await request(app.getHttpServer())
        .get('/v1/admin/audit')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — ops_admin can read audit logs', async () => {
      sharedAuditMock.search.mockResolvedValue({ items: [], total: 0 });

      await request(app.getHttpServer())
        .get('/v1/admin/audit')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(200);
    });

    it('200 — support_admin can read audit logs (read-only allowed)', async () => {
      sharedAuditMock.search.mockResolvedValue({ items: [], total: 0 });

      await request(app.getHttpServer())
        .get('/v1/admin/audit')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(200);
    });

    it('200 — finance_admin can read audit logs', async () => {
      sharedAuditMock.search.mockResolvedValue({ items: [], total: 0 });

      await request(app.getHttpServer())
        .get('/v1/admin/audit')
        .set('Authorization', `Bearer ${financeAdminToken}`)
        .expect(200);
    });
  });

  // ─── support_admin 403 sweep on all mutating endpoints ───────────────────────

  describe('support_admin blanket 403 on mutating endpoints', () => {
    const endpoints: Array<{ method: 'post' | 'patch' | 'delete'; path: string; body?: Record<string, unknown> }> = [
      { method: 'post', path: `/v1/admin/companies/${TEST_COMPANY_ID}/approve` },
      { method: 'post', path: `/v1/admin/companies/${TEST_COMPANY_ID}/suspend`, body: { reason: 'test' } },
      { method: 'patch', path: `/v1/admin/companies/${TEST_COMPANY_ID}/commission`, body: { commissionBps: 1000 } },
      { method: 'post', path: `/v1/admin/orders/${TEST_ORDER_ID}/intervene`, body: { action: 'cancel', reason: 'test' } },
      { method: 'post', path: '/v1/admin/coupons', body: { code: 'X', discountType: 'percent', discountValue: 10 } },
      { method: 'patch', path: `/v1/admin/coupons/${TEST_COUPON_ID}`, body: { maxUses: 5 } },
      { method: 'delete', path: `/v1/admin/coupons/${TEST_COUPON_ID}` },
      { method: 'post', path: '/v1/admin/catalog/categories', body: { slug: 'x', nameAr: 'x', sortOrder: 1 } },
      { method: 'patch', path: `/v1/admin/catalog/categories/${TEST_CATEGORY_ID}`, body: { nameAr: 'x' } },
      { method: 'delete', path: `/v1/admin/catalog/categories/${TEST_CATEGORY_ID}` },
      { method: 'post', path: '/v1/admin/catalog/services', body: { categoryId: TEST_CATEGORY_ID, slug: 'x', nameAr: 'x', baseDurationMinutes: 60 } },
      { method: 'patch', path: `/v1/admin/catalog/services/${TEST_SERVICE_ID}`, body: { baseDurationMinutes: 30 } },
      { method: 'delete', path: `/v1/admin/catalog/services/${TEST_SERVICE_ID}` },
    ];

    for (const ep of endpoints) {
      it(`403 — support_admin → ${ep.method.toUpperCase()} ${ep.path}`, async () => {
        const req = request(app.getHttpServer())
          [ep.method](ep.path)
          .set('Authorization', `Bearer ${supportAdminToken}`);

        if (ep.body) req.send(ep.body);

        await req.expect(403);
      });
    }
  });
});
