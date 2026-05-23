import { Injectable, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationsProducer } from '../../infrastructure/queue/producers/notifications.producer.js';
import { AuditService } from '../audit/audit.service.js';
import { SettlementEntity, SettlementStatus } from './entities/settlement.entity.js';

export interface ComputeWindowResult {
  settlementId: string;
  companyId: string;
  windowStart: Date;
  windowEnd: Date;
  grossOnline: bigint;
  commissionOnline: bigint;
  refundsInWindow: bigint;
  commissionCod: bigint;
  openingCarryForward: bigint;
  netAmount: bigint;
  status: SettlementStatus;
  alreadyExisted: boolean;
}

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);
  private readonly carryForwardAlertThreshold: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly notificationsProducer: NotificationsProducer,
    private readonly auditService: AuditService,
  ) {
    this.carryForwardAlertThreshold = this.configService.get<number>(
      'CARRY_FORWARD_ALERT_THRESHOLD',
      10000,
    );
  }

  /**
   * Compute and persist the settlement for a company's weekly window.
   * Idempotent: if a settlement already exists for (company_id, window_start),
   * returns it without re-computing.
   *
   * Window boundaries must be in UTC (converted from Asia/Qatar by the caller).
   */
  async computeWindow(companyId: string, windowStart: Date): Promise<ComputeWindowResult> {
    const windowEnd = new Date(windowStart.getTime() + 7 * 24 * 3600 * 1000);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Check idempotency: return existing settlement if already computed
      const existing = (await qr.query(
        `SELECT * FROM settlements WHERE company_id = $1 AND window_start = $2 LIMIT 1`,
        [companyId, windowStart],
      )) as SettlementEntity[];

      if (existing.length > 0) {
        const s = existing[0]!;
        await qr.rollbackTransaction();
        return {
          settlementId: s.id,
          companyId,
          windowStart,
          windowEnd,
          grossOnline: BigInt((s as unknown as Record<string, string>)['gross_online'] ?? '0'),
          commissionOnline: BigInt((s as unknown as Record<string, string>)['commission_online'] ?? '0'),
          refundsInWindow: BigInt((s as unknown as Record<string, string>)['refunds_in_window'] ?? '0'),
          commissionCod: BigInt((s as unknown as Record<string, string>)['commission_cod'] ?? '0'),
          openingCarryForward: BigInt((s as unknown as Record<string, string>)['opening_carry_forward'] ?? '0'),
          netAmount: BigInt((s as unknown as Record<string, string>)['net_amount'] ?? '0'),
          status: (s as unknown as Record<string, string>)['status'] as SettlementStatus,
          alreadyExisted: true,
        };
      }

      // Fetch carry-forward from the previous window (if negative)
      const prevRows = (await qr.query(
        `SELECT net_amount FROM settlements
         WHERE company_id = $1 AND window_end = $2 AND net_amount < 0
         ORDER BY window_end DESC LIMIT 1`,
        [companyId, windowStart],
      )) as Array<{ net_amount: string }>;
      const openingCarryForward =
        prevRows.length > 0 ? BigInt(prevRows[0]!.net_amount) : BigInt(0);

      // Aggregate online accruals completed in window
      const onlineRows = (await qr.query(
        `SELECT
           COALESCE(SUM(ca.gross_amount), 0)::TEXT AS gross_online,
           COALESCE(SUM(ca.commission_amount), 0)::TEXT AS commission_online
         FROM commission_accruals ca
         JOIN orders o ON o.id = ca.order_id
         WHERE ca.company_id = $1
           AND ca.kind = 'online'
           AND o.completed_at >= $2
           AND o.completed_at < $3
           AND ca.settlement_id IS NULL`,
        [companyId, windowStart, windowEnd],
      )) as Array<{ gross_online: string; commission_online: string }>;
      const grossOnline = BigInt(onlineRows[0]?.gross_online ?? '0');
      const commissionOnline = BigInt(onlineRows[0]?.commission_online ?? '0');

      // Aggregate COD commission in window
      const codRows = (await qr.query(
        `SELECT COALESCE(SUM(ca.commission_amount), 0)::TEXT AS commission_cod
         FROM commission_accruals ca
         JOIN orders o ON o.id = ca.order_id
         WHERE ca.company_id = $1
           AND ca.kind = 'cod'
           AND o.completed_at >= $2
           AND o.completed_at < $3
           AND ca.settlement_id IS NULL`,
        [companyId, windowStart, windowEnd],
      )) as Array<{ commission_cod: string }>;
      const commissionCod = BigInt(codRows[0]?.commission_cod ?? '0');

      // Aggregate refunds issued in window for this company's orders
      const refundRows = (await qr.query(
        `SELECT COALESCE(SUM(r.amount), 0)::TEXT AS refunds_in_window
         FROM refunds r
         JOIN payments p ON p.id = r.payment_id
         JOIN orders o ON o.id = p.order_id
         WHERE o.company_id = $1
           AND r.created_at >= $2
           AND r.created_at < $3`,
        [companyId, windowStart, windowEnd],
      )) as Array<{ refunds_in_window: string }>;
      const refundsInWindow = BigInt(refundRows[0]?.refunds_in_window ?? '0');

      // Compute net amount
      const netAmount =
        grossOnline - commissionOnline - refundsInWindow - commissionCod + openingCarryForward;

      const status: SettlementStatus = netAmount < BigInt(0) ? 'provider_owes' : 'due';

      // Insert settlement — UNIQUE(company_id, window_start) ensures idempotency at DB level
      const insertResult = (await qr.query(
        `INSERT INTO settlements
           (company_id, window_start, window_end, opening_carry_forward,
            gross_online, commission_online, refunds_in_window, commission_cod,
            net_amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (company_id, window_start) DO NOTHING
         RETURNING id`,
        [
          companyId,
          windowStart,
          windowEnd,
          openingCarryForward.toString(),
          grossOnline.toString(),
          commissionOnline.toString(),
          refundsInWindow.toString(),
          commissionCod.toString(),
          netAmount.toString(),
          status,
        ],
      )) as Array<{ id: string }>;

      if (!insertResult.length) {
        // Race condition: another worker inserted concurrently; fetch the existing row
        await qr.rollbackTransaction();
        return this.computeWindow(companyId, windowStart);
      }

      const settlementId = insertResult[0]!.id;

      // Insert settlement_lines for each accrual in the window
      await qr.query(
        `INSERT INTO settlement_lines (settlement_id, kind, reference_id, amount, description)
         SELECT $1,
                CASE ca.kind WHEN 'online' THEN 'commission_online' ELSE 'commission_cod' END,
                ca.id,
                ca.commission_amount,
                o.id::TEXT
         FROM commission_accruals ca
         JOIN orders o ON o.id = ca.order_id
         WHERE ca.company_id = $2
           AND o.completed_at >= $3
           AND o.completed_at < $4
           AND ca.settlement_id IS NULL`,
        [settlementId, companyId, windowStart, windowEnd],
      );

      // Insert settlement_lines for refunds in the window
      await qr.query(
        `INSERT INTO settlement_lines (settlement_id, kind, reference_id, amount, description)
         SELECT $1, 'refund', r.id, r.amount, r.reason
         FROM refunds r
         JOIN payments p ON p.id = r.payment_id
         JOIN orders o ON o.id = p.order_id
         WHERE o.company_id = $2
           AND r.created_at >= $3
           AND r.created_at < $4`,
        [settlementId, companyId, windowStart, windowEnd],
      );

      // Link accruals to this settlement
      await qr.query(
        `UPDATE commission_accruals ca
         SET settlement_id = $1
         FROM orders o
         WHERE ca.order_id = o.id
           AND ca.company_id = $2
           AND o.completed_at >= $3
           AND o.completed_at < $4
           AND ca.settlement_id IS NULL`,
        [settlementId, companyId, windowStart, windowEnd],
      );

      await qr.commitTransaction();

      this.logger.log(
        `Settlement ${settlementId} computed for company ${companyId}: ` +
          `net_amount=${netAmount} status=${status}`,
      );

      // T098: carry-forward alert when |net_amount| exceeds threshold
      const netAmountAbs = netAmount < BigInt(0) ? -netAmount : netAmount;
      if (netAmountAbs > BigInt(this.carryForwardAlertThreshold) && status === 'provider_owes') {
        await this.notifyFinanceAdmins(settlementId, companyId, netAmount.toString()).catch(
          (err: unknown) =>
            this.logger.warn('Failed to send carry-forward alert', err),
        );
      }

      return {
        settlementId,
        companyId,
        windowStart,
        windowEnd,
        grossOnline,
        commissionOnline,
        refundsInWindow,
        commissionCod,
        openingCarryForward,
        netAmount,
        status,
        alreadyExisted: false,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  /** T098 — emit notification to all finance_admin users when carry-forward exceeds threshold. */
  private async notifyFinanceAdmins(
    settlementId: string,
    companyId: string,
    netAmount: string,
  ): Promise<void> {
    const admins = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT au.id
       FROM admin_users au
       JOIN user_roles ur ON ur.admin_user_id = au.id
       JOIN roles r ON r.id = ur.role_id
       WHERE r.slug = 'finance_admin' AND au.status = 'active'`,
    );

    await Promise.all(
      admins.map((admin) =>
        this.notificationsProducer.enqueue({
          userKind: 'admin',
          userId: admin.id,
          topic: 'settlement.carry_forward_alert',
          payload: { settlementId, companyId, netAmount },
          channels: ['in_app', 'email'],
        }),
      ),
    );

    this.logger.warn(
      `Carry-forward alert sent to ${admins.length} finance_admin(s) for settlement ${settlementId}`,
    );
  }

  async listForCompany(
    companyId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: SettlementEntity[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const rows = await this.dataSource.query<SettlementEntity[]>(
      `SELECT * FROM settlements WHERE company_id = $1 ORDER BY window_start DESC LIMIT $2 OFFSET $3`,
      [companyId, limit, offset],
    );
    const countRows = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM settlements WHERE company_id = $1`,
      [companyId],
    );
    return { data: rows, total: parseInt(countRows[0]?.count ?? '0', 10), page, limit };
  }

  async listAll(
    page = 1,
    limit = 20,
    companyId?: string,
    status?: string,
  ): Promise<{ data: SettlementEntity[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    const filterParams: unknown[] = [];
    const where: string[] = [];

    if (companyId) {
      filterParams.push(companyId);
      where.push(`company_id = $${filterParams.length}`);
    }
    if (status) {
      filterParams.push(status);
      where.push(`status = $${filterParams.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRows = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM settlements ${whereClause}`,
      filterParams,
    );

    const listParams = [...filterParams, limit, offset];
    const rows = await this.dataSource.query<SettlementEntity[]>(
      `SELECT * FROM settlements ${whereClause} ORDER BY window_start DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );

    return { data: rows, total: parseInt(countRows[0]?.count ?? '0', 10), page, limit };
  }

  async findOne(settlementId: string, companyId?: string): Promise<SettlementEntity> {
    const params: unknown[] = [settlementId];
    let companyFilter = '';
    if (companyId) {
      params.push(companyId);
      companyFilter = `AND company_id = $${params.length}`;
    }

    const rows = await this.dataSource.query<SettlementEntity[]>(
      `SELECT * FROM settlements WHERE id = $1 ${companyFilter} LIMIT 1`,
      params,
    );

    if (!rows.length) {
      throw new NotFoundException('settlement_not_found');
    }

    return rows[0]!;
  }

  async markPaid(
    settlementId: string,
    payoutReference: string,
    adminId: string,
  ): Promise<SettlementEntity> {
    const settlement = await this.findOne(settlementId);

    if (settlement.status === 'paid') {
      throw new ConflictException('settlement_already_paid');
    }
    if (settlement.status === 'void') {
      throw new ConflictException('settlement_void');
    }

    const before = { ...settlement };

    await this.dataSource.query(
      `UPDATE settlements SET status = 'paid', payout_reference = $1, updated_at = now()
       WHERE id = $2`,
      [payoutReference, settlementId],
    );

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'settlement.mark_paid',
      targetKind: 'settlement',
      targetId: settlementId,
      before,
      after: { ...settlement, status: 'paid', payoutReference },
    });

    return this.findOne(settlementId);
  }

  async getLines(settlementId: string): Promise<Array<Record<string, unknown>>> {
    return this.dataSource.query(
      `SELECT * FROM settlement_lines WHERE settlement_id = $1 ORDER BY created_at`,
      [settlementId],
    ) as Promise<Array<Record<string, unknown>>>;
  }
}
