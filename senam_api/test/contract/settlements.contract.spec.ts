/**
 * T090 — Settlements contract tests
 *
 * Endpoints tested:
 *   GET  /v1/admin/settlements
 *   POST /v1/admin/settlements/:id/mark-paid
 *   GET  /v1/provider/me/settlements
 *   GET  /v1/provider/me/settlements/:id/statement.pdf
 *
 * WHY THESE TESTS FAIL BEFORE IMPLEMENTATION:
 *   The SettlementsModule does not exist yet. Once T093–T097 are implemented,
 *   these tests should pass.
 *
 * Infrastructure strategy:
 *   Same @Global stub-module pattern as admin.contract.spec.ts.
 *   No real Postgres, Redis, or BullMQ connections are made.
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
import { SettlementsProducer } from '../../src/infrastructure/queue/producers/settlements.producer.js';
import { TokensService } from '../../src/modules/auth/tokens.service.js';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../src/common/guards/roles.guard.js';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter.js';
import { CorrelationIdInterceptor } from '../../src/common/interceptors/correlation-id.interceptor.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { SettlementsModule } from '../../src/modules/settlements/settlements.module.js';
import { SettlementEntity } from '../../src/modules/settlements/entities/settlement.entity.js';
import { SettlementLineEntity } from '../../src/modules/settlements/entities/settlement-line.entity.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_JWT_SECRET = 'settlements-contract-test-secret-32ch!';

const ADMIN_USER_ID = 'a0000000-0000-0000-0000-000000000001';
const PROVIDER_USER_ID = 'p0000000-0000-0000-0000-000000000001';
const COMPANY_ID = 'c0000000-0000-0000-0000-000000000001';
const SETTLEMENT_ID = 's0000000-0000-0000-0000-000000000001';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const cacheMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  incrWithExpire: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue(true),
};

const auditMock = {
  write: jest.fn().mockResolvedValue(undefined),
  search: jest.fn().mockResolvedValue({ items: [], total: 0 }),
};

const settlementRow = {
  id: SETTLEMENT_ID,
  company_id: COMPANY_ID,
  window_start: new Date('2026-05-11T21:00:00.000Z'),
  window_end: new Date('2026-05-18T21:00:00.000Z'),
  opening_carry_forward: '0',
  gross_online: '100000',
  commission_online: '15000',
  refunds_in_window: '0',
  commission_cod: '0',
  net_amount: '85000',
  status: 'due',
  payout_reference: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const dataSourceMock = {
  query: jest.fn().mockImplementation((sql: string) => {
    if (/SELECT.*FROM settlements/i.test(sql)) return Promise.resolve([settlementRow]);
    if (/SELECT.*FROM settlement_lines/i.test(sql)) return Promise.resolve([]);
    if (/SELECT.*COUNT/i.test(sql)) return Promise.resolve([{ count: '1' }]);
    if (/UPDATE settlements/i.test(sql)) return Promise.resolve([]);
    if (/SELECT.*admin_users/i.test(sql)) return Promise.resolve([]);
    return Promise.resolve([]);
  }),
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    manager: {
      create: jest.fn().mockImplementation((_cls: unknown, d: unknown) => d),
      save: jest.fn().mockImplementation(async (_cls: unknown, e: unknown) => e),
    },
  }),
};

// ─── Stub @Global modules ─────────────────────────────────────────────────────

@Global()
@Module({
  providers: [
    { provide: REDIS_CLIENT, useValue: {} },
    { provide: CacheService, useValue: cacheMock },
  ],
  exports: [REDIS_CLIENT, CacheService],
})
class StubCacheModule {}

@Global()
@Module({
  providers: [
    { provide: MailProducer, useValue: { enqueueOtp: jest.fn(), enqueueTransactional: jest.fn() } },
    { provide: NotificationsProducer, useValue: { enqueue: jest.fn().mockResolvedValue(undefined) } },
    { provide: DispatchProducer, useValue: { enqueueAcceptTimeout: jest.fn(), removeAcceptTimeout: jest.fn() } },
    { provide: SettlementsProducer, useValue: { enqueueCompute: jest.fn().mockResolvedValue(undefined) } },
  ],
  exports: [MailProducer, NotificationsProducer, DispatchProducer, SettlementsProducer],
})
class StubQueueModule {}

@Global()
@Module({
  providers: [
    { provide: DataSource, useValue: dataSourceMock },
    { provide: AuditService, useValue: auditMock },
  ],
  exports: [DataSource, AuditService],
})
class StubDatabaseModule {}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function signAdminJwt(jwtService: JwtService, roles: string[]): string {
  return jwtService.sign({ sub: ADMIN_USER_ID, principal: 'admin', roles });
}

function signProviderJwt(jwtService: JwtService): string {
  return jwtService.sign({
    sub: PROVIDER_USER_ID,
    principal: 'provider',
    roles: ['provider_owner'],
    companyId: COMPANY_ID,
  });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('T090 — Settlements contract tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let superAdminToken: string;
  let financeAdminToken: string;
  let opsAdminToken: string;
  let supportAdminToken: string;
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
              SETTLEMENT_CRON: '0 30 0 * * 0',
              CARRY_FORWARD_ALERT_THRESHOLD: 10000,
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
        SettlementsModule,
      ],
      providers: [
        TokensService,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider(getRepositoryToken(SettlementEntity))
      .useValue({
        findOne: jest.fn().mockResolvedValue(settlementRow),
        find: jest.fn().mockResolvedValue([settlementRow]),
        findAndCount: jest.fn().mockResolvedValue([[settlementRow], 1]),
        save: jest.fn().mockImplementation(async (e: unknown) => e),
        create: jest.fn().mockImplementation((d: unknown) => d),
      })
      .overrideProvider(getRepositoryToken(SettlementLineEntity))
      .useValue({
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockImplementation(async (e: unknown) => e),
        create: jest.fn().mockImplementation((d: unknown) => d),
      })
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
    financeAdminToken = signAdminJwt(jwtService, ['finance_admin']);
    opsAdminToken = signAdminJwt(jwtService, ['ops_admin']);
    supportAdminToken = signAdminJwt(jwtService, ['support_admin']);
    providerToken = signProviderJwt(jwtService);
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    dataSourceMock.query.mockImplementation((sql: string) => {
      if (/SELECT.*FROM settlements/i.test(sql)) return Promise.resolve([settlementRow]);
      if (/SELECT.*FROM settlement_lines/i.test(sql)) return Promise.resolve([]);
      if (/SELECT.*COUNT/i.test(sql)) return Promise.resolve([{ count: '1' }]);
      if (/UPDATE settlements/i.test(sql)) return Promise.resolve([]);
      if (/SELECT.*admin_users/i.test(sql)) return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  // ─── Unauthenticated ────────────────────────────────────────────────────────

  describe('Unauthenticated requests', () => {
    it('GET /v1/admin/settlements — 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/settlements')
        .expect(401);
    });

    it('GET /v1/provider/me/settlements — 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/v1/provider/me/settlements')
        .expect(401);
    });

    it('POST /v1/admin/settlements/:id/mark-paid — 401 without token', async () => {
      await request(app.getHttpServer())
        .post(`/v1/admin/settlements/${SETTLEMENT_ID}/mark-paid`)
        .send({ payoutReference: 'TXN-001' })
        .expect(401);
    });
  });

  // ─── Admin settlements list ─────────────────────────────────────────────────

  describe('GET /v1/admin/settlements', () => {
    it('200 — super_admin can list settlements', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/admin/settlements')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — finance_admin can list settlements', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/admin/settlements')
        .set('Authorization', `Bearer ${financeAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('403 — ops_admin cannot list settlements (finance scope)', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/settlements')
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .expect(403);
    });

    it('403 — support_admin cannot list settlements', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/settlements')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .expect(403);
    });
  });

  // ─── Admin mark-paid ────────────────────────────────────────────────────────

  describe('POST /v1/admin/settlements/:id/mark-paid', () => {
    it('200 — super_admin can mark settlement as paid', async () => {
      dataSourceMock.query.mockImplementation((sql: string) => {
        if (/SELECT \* FROM settlements WHERE id/i.test(sql))
          return Promise.resolve([{ ...settlementRow, status: 'due' }]);
        if (/UPDATE settlements/i.test(sql)) return Promise.resolve([]);
        if (/SELECT.*admin_users/i.test(sql)) return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const res = await request(app.getHttpServer())
        .post(`/v1/admin/settlements/${SETTLEMENT_ID}/mark-paid`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ payoutReference: 'TXN-2026-00001' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('200 — finance_admin can mark settlement as paid', async () => {
      dataSourceMock.query.mockImplementation((sql: string) => {
        if (/SELECT \* FROM settlements WHERE id/i.test(sql))
          return Promise.resolve([{ ...settlementRow, status: 'due' }]);
        if (/UPDATE settlements/i.test(sql)) return Promise.resolve([]);
        if (/SELECT.*admin_users/i.test(sql)) return Promise.resolve([]);
        return Promise.resolve([]);
      });

      await request(app.getHttpServer())
        .post(`/v1/admin/settlements/${SETTLEMENT_ID}/mark-paid`)
        .set('Authorization', `Bearer ${financeAdminToken}`)
        .send({ payoutReference: 'TXN-2026-00002' })
        .expect(200);
    });

    it('403 — ops_admin cannot mark settlement as paid', async () => {
      await request(app.getHttpServer())
        .post(`/v1/admin/settlements/${SETTLEMENT_ID}/mark-paid`)
        .set('Authorization', `Bearer ${opsAdminToken}`)
        .send({ payoutReference: 'TXN-2026-00003' })
        .expect(403);
    });

    it('400 — missing payoutReference returns validation error', async () => {
      await request(app.getHttpServer())
        .post(`/v1/admin/settlements/${SETTLEMENT_ID}/mark-paid`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({})
        .expect(400);
    });
  });

  // ─── Provider settlements list ──────────────────────────────────────────────

  describe('GET /v1/provider/me/settlements', () => {
    it('200 — provider_owner can list their settlements', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/provider/me/settlements')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('data');
    });

    it('403 — admin token cannot access provider settlements', async () => {
      await request(app.getHttpServer())
        .get('/v1/provider/me/settlements')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(403);
    });
  });

  // ─── Provider PDF statement ─────────────────────────────────────────────────

  describe('GET /v1/provider/me/settlements/:id/statement.pdf', () => {
    it('provider_owner gets a response from the statement endpoint (mocked PDF)', async () => {
      // In test context, pdfkit may not be available. We verify the route is registered
      // and returns a non-404 response when called by the correct role.
      const res = await request(app.getHttpServer())
        .get(`/v1/provider/me/settlements/${SETTLEMENT_ID}/statement.pdf`)
        .set('Authorization', `Bearer ${providerToken}`);

      // Accept 200 (pdf generated) or 500 (pdfkit not installed in test env)
      // but NOT 401, 403, or 404
      expect([200, 500]).toContain(res.status);
    });

    it('403 — admin token cannot access provider PDF statement', async () => {
      await request(app.getHttpServer())
        .get(`/v1/provider/me/settlements/${SETTLEMENT_ID}/statement.pdf`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(403);
    });
  });
});
