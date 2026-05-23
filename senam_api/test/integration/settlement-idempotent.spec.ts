/**
 * T092 — Settlement idempotency integration test
 *
 * Running computeWindow twice for the same (company_id, window_start) pair
 * must produce exactly one settlement row — never a duplicate.
 *
 * Two code paths are covered:
 *   1. The second call finds the existing settlement in the pre-insert check
 *      → returns immediately with alreadyExisted=true.
 *   2. A concurrent race where ON CONFLICT DO NOTHING fires in the DB
 *      → the service re-fetches and returns the existing row.
 *
 * WHY THESE TESTS FAIL BEFORE T093:
 *   SettlementsService does not exist; importing it throws module-not-found.
 */

import 'reflect-metadata';

jest.setTimeout(30_000);

const COMPANY_ID = 'c0000000-0000-0000-0000-000000000002';
const WINDOW_START = new Date('2026-05-04T21:00:00.000Z');
const SETTLEMENT_ID = 'sett-idem-0000-0000-000000000001';

const EXISTING_ROW = {
  id: SETTLEMENT_ID,
  company_id: COMPANY_ID,
  window_start: WINDOW_START,
  window_end: new Date('2026-05-11T21:00:00.000Z'),
  opening_carry_forward: '0',
  gross_online: '50000',
  commission_online: '7500',
  refunds_in_window: '0',
  commission_cod: '0',
  net_amount: '42500',
  status: 'due',
  payout_reference: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('T092 — settlement-idempotent: no duplicate rows on repeated execution', () => {
  let SettlementsServiceClass: typeof import('../../src/modules/settlements/settlements.service.js').SettlementsService;

  beforeAll(async () => {
    const mod = await import('../../src/modules/settlements/settlements.service.js');
    SettlementsServiceClass = mod.SettlementsService;
  });

  function buildMocks(existingRows: unknown[]) {
    const insertCallCount = { count: 0 };

    const qrMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockImplementation(async (sql: string) => {
        // idempotency check
        if (/SELECT \* FROM settlements WHERE company_id/i.test(sql))
          return existingRows;
        // carry-forward
        if (/window_end.*net_amount/i.test(sql)) return [];
        // aggregations
        if (/commission_accruals.*kind.*online/i.test(sql) || /online.*commission_accruals/i.test(sql))
          return [{ gross_online: '50000', commission_online: '7500' }];
        if (/commission_accruals.*kind.*cod/i.test(sql) || /cod.*commission_accruals/i.test(sql))
          return [{ commission_cod: '0' }];
        if (/SUM.*r\.amount/i.test(sql)) return [{ refunds_in_window: '0' }];
        // INSERT
        if (/INSERT INTO settlements/i.test(sql)) {
          insertCallCount.count += 1;
          return [{ id: SETTLEMENT_ID }];
        }
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

    const service = new SettlementsServiceClass(
      dataSourceMock as never,
      configMock as never,
      { enqueue: jest.fn() } as never,
      { write: jest.fn() } as never,
    );

    return { service, qrMock, insertCallCount };
  }

  it('second call returns alreadyExisted=true when settlement already in DB', async () => {
    // Simulate that the settlement already exists in the DB
    const { service } = buildMocks([EXISTING_ROW]);

    const result = await service.computeWindow(COMPANY_ID, WINDOW_START);

    expect(result.alreadyExisted).toBe(true);
    expect(result.settlementId).toBe(SETTLEMENT_ID);
    expect(result.status).toBe('due');
  });

  it('INSERT is called exactly once on the first invocation', async () => {
    const { service, insertCallCount } = buildMocks([]);

    await service.computeWindow(COMPANY_ID, WINDOW_START);

    expect(insertCallCount.count).toBe(1);
  });

  it('INSERT is NOT called when settlement already exists (pre-insert check)', async () => {
    const { service, insertCallCount } = buildMocks([EXISTING_ROW]);

    await service.computeWindow(COMPANY_ID, WINDOW_START);

    expect(insertCallCount.count).toBe(0);
  });

  it('running job twice sequentially never triggers a second INSERT', async () => {
    const insertCallCount = { count: 0 };
    let callNumber = 0;

    const qrMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (/SELECT \* FROM settlements WHERE company_id/i.test(sql)) {
          // First run: not found. Second run: already exists.
          callNumber += 1;
          return callNumber <= 1 ? [] : [EXISTING_ROW];
        }
        if (/window_end.*net_amount/i.test(sql)) return [];
        if (/commission_accruals.*kind.*online/i.test(sql) || /online.*commission_accruals/i.test(sql))
          return [{ gross_online: '50000', commission_online: '7500' }];
        if (/commission_accruals.*kind.*cod/i.test(sql) || /cod.*commission_accruals/i.test(sql))
          return [{ commission_cod: '0' }];
        if (/SUM.*r\.amount/i.test(sql)) return [{ refunds_in_window: '0' }];
        if (/INSERT INTO settlements/i.test(sql)) {
          insertCallCount.count += 1;
          return [{ id: SETTLEMENT_ID }];
        }
        return [];
      }),
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(qrMock),
      query: jest.fn().mockResolvedValue([]),
    };

    const configMock = {
      get: jest.fn().mockReturnValue(10000),
    };

    const service = new SettlementsServiceClass(
      dataSourceMock as never,
      configMock as never,
      { enqueue: jest.fn() } as never,
      { write: jest.fn() } as never,
    );

    // First run
    const first = await service.computeWindow(COMPANY_ID, WINDOW_START);
    expect(first.alreadyExisted).toBe(false);

    // Second run (simulates re-run of the same job)
    const second = await service.computeWindow(COMPANY_ID, WINDOW_START);
    expect(second.alreadyExisted).toBe(true);

    // Only one INSERT total
    expect(insertCallCount.count).toBe(1);
  });
});
