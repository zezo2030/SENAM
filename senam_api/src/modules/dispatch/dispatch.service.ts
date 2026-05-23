import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsProducer } from '../../infrastructure/queue/producers/notifications.producer.js';
import { PaymentsService } from '../payments/payments.service.js';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly notificationsProducer: NotificationsProducer,
    private readonly paymentsService: PaymentsService,
  ) {}

  async markUnassignable(orderId: string): Promise<void> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Load the order
      const orders = await qr.query(
        `SELECT id, slot_id, payment_method, company_id, total, status
         FROM orders
         WHERE id = $1
         FOR UPDATE`,
        [orderId],
      ) as Array<{
        id: string;
        slot_id: string;
        payment_method: string;
        company_id: string;
        total: string;
        status: string;
      }>;

      const order = orders[0];
      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      // a. Update status to unassignable
      await qr.query(
        `UPDATE orders SET status = 'unassignable', updated_at = now()
         WHERE id = $1 AND status = 'pending'`,
        [orderId],
      );

      // b. Increment time_slots.capacity_remaining back
      await qr.query(
        `UPDATE time_slots
         SET capacity_remaining = capacity_remaining + 1
         FROM orders
         WHERE orders.id = $1 AND time_slots.id = orders.slot_id`,
        [orderId],
      );

      // c. Insert order_status_history row
      await qr.query(
        `INSERT INTO order_status_history
           (order_id, from_status, to_status, actor_kind, actor_id, reason)
         VALUES ($1, $2, 'unassignable', 'system', NULL, 'dispatch_max_attempts_exceeded')`,
        [orderId, order.status],
      );

      // d. For online payments: look up payment and refund
      if (order.payment_method !== 'cod') {
        const payments = await qr.query(
          `SELECT id, amount FROM payments
           WHERE order_id = $1 AND status IN ('authorised', 'captured')
           ORDER BY created_at DESC
           LIMIT 1`,
          [orderId],
        ) as Array<{ id: string; amount: string }>;

        if (payments.length) {
          const payment = payments[0]!;
          try {
            await this.paymentsService.refund(
              payment.id,
              Number(order.total),
              'dispatch_unassignable',
              'system',
              undefined,
              qr,
            );
          } catch (err) {
            this.logger.error(
              `Failed to refund payment ${payment.id} for unassignable order ${orderId}`,
              err,
            );
          }
        }
      }

      // e. Write audit log
      await this.auditService.write(
        {
          actorKind: 'system',
          action: 'dispatch.unassignable',
          targetKind: 'order',
          targetId: orderId,
          reason: 'dispatch_max_attempts_exceeded',
        },
        qr,
      );

      await qr.commitTransaction();

      // f. Enqueue admin notification (after commit, non-critical)
      try {
        await this.notificationsProducer.enqueue({
          userKind: 'admin',
          userId: 'system',
          topic: 'order.unassignable',
          payload: { orderId, companyId: order.company_id },
          channels: ['in_app', 'email'],
        });
      } catch (err) {
        this.logger.warn(
          `Failed to enqueue unassignable notification for order ${orderId}`,
          err,
        );
      }
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
