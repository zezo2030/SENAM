import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { DispatchProducer } from '../../infrastructure/queue/producers/dispatch.producer.js';
import { EventBusService } from '../../common/events/event-bus.js';
import type { JwtPayload } from '../auth/tokens.service.js';
import type { OrderStatus } from './entities/order.entity.js';

/** Map of valid transitions: from → set of valid to-states */
const TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(['accepted', 'cancelled']),
  accepted: new Set(['on_the_way', 'cancelled']),
  on_the_way: new Set(['arrived', 'cancelled']),
  arrived: new Set(['in_progress', 'cancelled']),
  in_progress: new Set(['completed', 'cancelled']),
};

/** Timestamp column to update for each terminal state */
const TIMESTAMP_FIELD: Partial<Record<string, string>> = {
  accepted: 'accepted_at',
  in_progress: 'started_at',
  completed: 'completed_at',
  cancelled: 'cancelled_at',
};

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly dispatchProducer: DispatchProducer,
    private readonly eventBus: EventBusService,
  ) {}

  async transition(
    orderId: string,
    to: string,
    actor: JwtPayload,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const ownQr = !queryRunner;
    const qr = queryRunner ?? this.dataSource.createQueryRunner();

    if (ownQr) {
      await qr.connect();
      await qr.startTransaction();
    }

    try {
      // 1. Load order with FOR UPDATE row lock
      const rows = await qr.query(
        `SELECT id, status, customer_id, company_id, assigned_staff_id, total, commission,
                payment_method, dispatch_attempt
         FROM orders
         WHERE id = $1
         FOR UPDATE`,
        [orderId],
      ) as Array<{
        id: string;
        status: OrderStatus;
        customer_id: string;
        company_id: string;
        assigned_staff_id: string | null;
        total: string;
        commission: string;
        payment_method: string;
        dispatch_attempt: number;
      }>;

      const order = rows[0];
      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      // 2. RBAC validation
      if (actor.principal === 'provider') {
        if (order.company_id !== actor.companyId) {
          throw new ForbiddenException('order_not_assigned_to_your_company');
        }
      } else if (actor.principal === 'customer') {
        if (to !== 'cancelled') {
          throw new ForbiddenException('customers_can_only_cancel');
        }
      }
      // admin: no extra restriction

      // 3. Validate transition
      const validNextStates = TRANSITIONS[order.status];
      if (!validNextStates || !validNextStates.has(to)) {
        throw new ConflictException(
          `invalid_transition:${order.status}→${to}`,
        );
      }

      // 4. Build UPDATE query with optional timestamp field
      const tsField = TIMESTAMP_FIELD[to];
      const updateSql = tsField
        ? `UPDATE orders SET status = $1, ${tsField} = now(), updated_at = now()
           WHERE id = $2 AND status = $3
           RETURNING id`
        : `UPDATE orders SET status = $1, updated_at = now()
           WHERE id = $2 AND status = $3
           RETURNING id`;

      const updated = await qr.query(updateSql, [to, orderId, order.status]) as Array<{ id: string }>;

      if (!updated.length) {
        throw new ConflictException('transition_race_conflict');
      }

      // 5. Insert order_status_history row
      await qr.query(
        `INSERT INTO order_status_history
           (order_id, from_status, to_status, actor_kind, actor_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          order.status,
          to,
          actor.principal,
          actor.sub,
        ],
      );

      // 6. Audit log
      await this.auditService.write(
        {
          actorKind: actor.principal,
          actorId: actor.sub,
          action: `order.status.${to}`,
          targetKind: 'order',
          targetId: orderId,
          before: { status: order.status },
          after: { status: to },
        },
        qr,
      );

      // 7. T068: If completing, write commission_accruals and increment staff completed_orders_count
      if (to === 'completed') {
        const kind = order.payment_method === 'cod' ? 'cod' : 'online';

        await qr.query(
          `INSERT INTO commission_accruals
             (company_id, order_id, kind, gross_amount, commission_amount)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (order_id) DO NOTHING`,
          [
            order.company_id,
            orderId,
            kind,
            order.total,
            order.commission,
          ],
        );

        if (order.assigned_staff_id) {
          await qr.query(
            `UPDATE company_users
             SET completed_orders_count = completed_orders_count + 1, updated_at = now()
             WHERE id = $1`,
            [order.assigned_staff_id],
          );
        }
      }

      // 8. If accepted: remove the pending dispatch timeout job
      if (to === 'accepted') {
        try {
          await this.dispatchProducer.removeAcceptTimeout(
            orderId,
            order.dispatch_attempt,
          );
        } catch (err) {
          // Non-fatal: job may have already fired
          this.logger.warn(
            `Failed to remove accept-timeout job for order ${orderId}: ${String(err)}`,
          );
        }
      }

      // 9. Publish order status changed event
      this.eventBus.publishOrderStatusChanged({
        orderId,
        fromStatus: order.status,
        toStatus: to,
        customerId: order.customer_id,
        companyId: order.company_id,
        assignedStaffId: order.assigned_staff_id,
      });

      if (ownQr) {
        await qr.commitTransaction();
      }
    } catch (err) {
      if (ownQr) {
        await qr.rollbackTransaction();
      }
      throw err;
    } finally {
      if (ownQr) {
        await qr.release();
      }
    }
  }
}
