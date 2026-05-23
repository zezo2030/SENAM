/**
 * T091 — Settlement computation integration test
 *
 * Builds a 7-day fixture (10 online orders, 3 COD orders, 2 partial refunds,
 * 1 prior-window negative balance), runs computeWindow, and asserts every
 * aggregate matches a hand-calculated expected value to the cent.
 *
 * Strategy: uses a real DataSource mock that returns controlled SQL responses,
 * allowing precise numeric assertions without a live Postgres connection.
 * Full Testcontainers-based validation is out of scope for this contract layer —
 * the slot-race / customer-happy-path tests cover real-DB integration.
 *
 * WHY THESE TESTS FAIL BEFORE T093:
 *   SettlementsService does not exist; importing it throws module-not-found.
 */

import 'reflect-metadata';

jest.setTimeout(30_000);

// ─── Fixtures (hand-calculated) ───────────────────────────────────────────────

const COMPANY_ID = 'c0000000-0000-0000-0000-000000000001';
const WINDOW_START = new Date('2026-05-11T21:00:00.000Z'); // Sunday 00:00 Qatar
const WINDOW_END = new Date('2026-05-18T21:00:00.000Z');   // next Sunday 00:00 Qatar

// 10 online orders, each 10 000 fils (100 QAR) gross, 1 500 commission (15%)
const GROSS_ONLINE = BigInt(10 * 10000);         // 100 000
const COMMISSION_ONLINE = BigInt(10 * 1500);     //  15 000
// 3 COD orders, commission 1 500 each
const COMMISSION_COD = BigInt(3 * 1500);         //   4 500
// 2 partial refunds, 5 000 each
const REFUNDS_IN_WINDOW = BigInt(2 * 5000);      //  10 000
// Prior-window carry-forward (negative from last week)
const OPENING_CARRY_FORWARD = BigInt(-3000);     //  -3 000

// net = gross_online - commission_online - refunds - commission_cod + carry_forward
const EXPECTED_NET =
  GROSS_ONLINE - COMMISSION_ONLINE - REFUNDS_IN_WINDOW - COMMISSION_COD + OPENING_CARRY_FORWARD;
// = 100000 - 15000 - 10000 - 4500 + (-3000) = 67500

const SETTLEMENT_ID = 'sett-0000-0000-0000-000000000001';

describe('T091 — settlement-compute: fixture-based numeric validation', () => {
  let SettlementsServiceClass: typeof import('../../src/modules/settlements/settlements.service.js').SettlementsService;

  beforeAll(async () => {
    const mod = await import('../../src/modules/settlements/settlements.service.js');
    SettlementsServiceClass = mod.SettlementsService;
  });

  function buildService(overrides: Partial<Record<string, jest.Mock>> = {}) {
    const qrMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockImplementation(async (sql: string) => {
        // idempotency check — no existing settlement
        if (/SELECT \* FROM settlements WHERE company_id/i.test(sql)) return [];
        // carry-forward from previous window
        if (/window_end.*net_amount < 0/i.test(sql) || /net_amount.*window_end/i.test(sql))
          return [{ net_amount: OPENING_CARRY_FORWARD.toString() }];
        // online accruals
        if (/commission_accruals.*kind.*online/i.test(sql) || /online.*commission_accruals/i.test(sql))
          return [{ gross_online: GROSS_ONLINE.toString(), commission_online: COMMISSION_ONLINE.toString() }];
        // cod accruals
        if (/commission_accruals.*kind.*cod/i.test(sql) || /cod.*commission_accruals/i.test(sql))
          return [{ commission_cod: COMMISSION_COD.toString() }];
        // refunds
        if (/refunds.*payments.*orders/i.test(sql) || /SUM.*r\.amount/i.test(sql))
          return [{ refunds_in_window: REFUNDS_IN_WINDOW.toString() }];
        // insert settlement
        if (/INSERT INTO settlements/i.test(sql))
          return [{ id: SETTLEMENT_ID }];
        // other inserts/updates
        return [];
      }),
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(qrMock),
      query: jest.fn().mockResolvedValue([]),
    };

    const configMock = {
      get: jest.fn().mockImplementation((key: string, def: unknown) => {
        if (key === 'CARRY_FORWARD_ALERT_THRESHOLD') return 10000;
        return def;
      }),
    };

    const notificationsMock = { enqueue: jest.fn().mockResolvedValue(undefined) };
    const auditMock = { write: jest.fn().mockResolvedValue(undefined) };

    // Apply any test-specific overrides
    if (overrides['qrQuery']) {
      qrMock.query = overrides['qrQuery'] as jest.Mock;
    }

    return new SettlementsServiceClass(
      dataSourceMock as never,
      configMock as never,
      notificationsMock as never,
      auditMock as never,
    );
  }

  it('computes net_amount correctly against hand-calculated expected value', async () => {
    const service = buildService();
    const result = await service.computeWindow(COMPANY_ID, WINDOW_START);

    expect(result.grossOnline).toBe(GROSS_ONLINE);
    expect(result.commissionOnline).toBe(COMMISSION_ONLINE);
    expect(result.commissionCod).toBe(COMMISSION_COD);
    expect(result.refundsInWindow).toBe(REFUNDS_IN_WINDOW);
    expect(result.openingCarryForward).toBe(OPENING_CARRY_FORWARD);
    expect(result.netAmount).toBe(EXPECTED_NET);
    expect(Number(result.netAmount)).toBe(67500);
  });

  it('sets status=due when net_amount is positive', async () => {
    const service = buildService();
    const result = await service.computeWindow(COMPANY_ID, WINDOW_START);
    expect(result.status).toBe('due');
  });

  it('sets status=provider_owes when net_amount is negative', async () => {
    const qrOverride = jest.fn().mockImplementation(async (sql: string) => {
      if (/SELECT \* FROM settlements WHERE company_id/i.test(sql)) return [];
      if (/window_end.*net_amount/i.test(sql)) return [];
      // Tiny online gross, huge COD commission → negative
      if (/commission_accruals.*kind.*online/i.test(sql) || /online.*commission_accruals/i.test(sql))
        return [{ gross_online: '100', commission_online: '15' }];
      if (/commission_accruals.*kind.*cod/i.test(sql) || /cod.*commission_accruals/i.test(sql))
        return [{ commission_cod: '500000' }];
      if (/SUM.*r\.amount/i.test(sql)) return [{ refunds_in_window: '0' }];
      if (/INSERT INTO settlements/i.test(sql)) return [{ id: SETTLEMENT_ID }];
      return [];
    });

    const service = buildService({ qrQuery: qrOverride });
    const result = await service.computeWindow(COMPANY_ID, WINDOW_START);

    expect(result.netAmount).toBeLessThan(BigInt(0));
    expect(result.status).toBe('provider_owes');
  });

  it('returns settlementId from the DB insert', async () => {
    const service = buildService();
    const result = await service.computeWindow(COMPANY_ID, WINDOW_START);
    expect(result.settlementId).toBe(SETTLEMENT_ID);
    expect(result.alreadyExisted).toBe(false);
  });

  it('emits carry-forward alert to finance_admins when |net_amount| exceeds threshold and status=provider_owes', async () => {
    const FINANCE_ADMIN_ID = 'fa000000-0000-0000-0000-000000000001';
    const notificationsMock = { enqueue: jest.fn().mockResolvedValue(undefined) };

    const qrOverride = jest.fn().mockImplementation(async (sql: string) => {
      if (/SELECT \* FROM settlements WHERE company_id/i.test(sql)) return [];
      if (/window_end.*net_amount/i.test(sql)) return [];
      if (/commission_accruals.*kind.*online/i.test(sql) || /online.*commission_accruals/i.test(sql))
        return [{ gross_online: '0', commission_online: '0' }];
      if (/commission_accruals.*kind.*cod/i.test(sql) || /cod.*commission_accruals/i.test(sql))
        return [{ commission_cod: '0' }];
      if (/SUM.*r\.amount/i.test(sql)) return [{ refunds_in_window: '0' }];
      if (/INSERT INTO settlements/i.test(sql)) return [{ id: SETTLEMENT_ID }];
      return [];
    });

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        query: qrOverride,
      }),
      // Admin query goes through dataSource.query directly
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (/admin_users/i.test(sql)) return [{ id: FINANCE_ADMIN_ID }];
        return [];
      }),
    };

    const configMock = {
      get: jest.fn().mockImplementation((key: string, def: unknown) => {
        if (key === 'CARRY_FORWARD_ALERT_THRESHOLD') return 10000;
        return def;
      }),
    };

    const service = new SettlementsServiceClass(
      dataSourceMock as never,
      configMock as never,
      notificationsMock as never,
      { write: jest.fn() } as never,
    );

    // Override to produce a large negative net_amount
    qrOverride.mockImplementation(async (sql: string) => {
      if (/SELECT \* FROM settlements WHERE company_id/i.test(sql)) return [];
      if (/window_end.*net_amount/i.test(sql)) return [];
      if (/commission_accruals.*kind.*online/i.test(sql) || /online.*commission_accruals/i.test(sql))
        return [{ gross_online: '0', commission_online: '0' }];
      if (/commission_accruals.*kind.*cod/i.test(sql) || /cod.*commission_accruals/i.test(sql))
        return [{ commission_cod: '50000' }]; // huge cod commission → negative net
      if (/SUM.*r\.amount/i.test(sql)) return [{ refunds_in_window: '0' }];
      if (/INSERT INTO settlements/i.test(sql)) return [{ id: SETTLEMENT_ID }];
      return [];
    });

    await service.computeWindow(COMPANY_ID, WINDOW_START);

    expect(notificationsMock.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        userKind: 'admin',
        userId: FINANCE_ADMIN_ID,
        topic: 'settlement.carry_forward_alert',
      }),
    );
  });
});
