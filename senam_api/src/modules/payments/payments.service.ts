import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity.js';
import {
  PaymentPort,
} from '../../infrastructure/payments/payment.port.js';

export interface OrderForPayment {
  id: string;
  total: number;
  paymentMethod: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,

    private readonly paymentPort: PaymentPort,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Authorises (or creates) a payment for the given order.
   * For COD: creates a payment row with status='captured', amount=0, provider='cod'.
   * For online: calls PaymentPort.authorise, creates a payment row with status='authorised'.
   * All writes go through the provided queryRunner for transactional safety.
   */
  async authoriseForOrder(
    order: OrderForPayment,
    returnUrl: string,
    queryRunner: QueryRunner,
  ): Promise<PaymentEntity> {
    if (order.paymentMethod === 'cod') {
      const payment = queryRunner.manager.create(PaymentEntity, {
        orderId: order.id,
        provider: 'cod',
        providerPaymentId: null,
        amount: 0,
        status: 'captured',
        rawPayloadRedacted: null,
      });
      return queryRunner.manager.save(PaymentEntity, payment);
    }

    // Online payment via payment port
    const result = await this.paymentPort.authorise({
      orderId: order.id,
      amount: order.total,
      currency: 'SAR',
      returnUrl,
      paymentMethod: order.paymentMethod,
    });

    const payment = queryRunner.manager.create(PaymentEntity, {
      orderId: order.id,
      provider: 'myfatoorah',
      providerPaymentId: result.providerPaymentId,
      amount: order.total,
      status: result.status,
      rawPayloadRedacted: null,
    });

    return queryRunner.manager.save(PaymentEntity, payment);
  }

  /**
   * Issues a refund for a payment. Calls PaymentPort.refund and inserts a
   * refund record. Uses the provided queryRunner if given, otherwise opens
   * its own transaction.
   */
  async refund(
    paymentId: string,
    amount: number,
    reason: string,
    issuedByKind: 'system' | 'admin',
    issuedById?: string,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const payment = await this.paymentRepo.findOneOrFail({ where: { id: paymentId } });

    if (!payment.providerPaymentId) {
      // COD or non-billable payment — nothing to refund at the gateway
      this.logger.log(`Skipping gateway refund for COD payment ${paymentId}`);
    } else {
      await this.paymentPort.refund({
        providerPaymentId: payment.providerPaymentId,
        amount,
        reason,
      });
    }

    const manager = queryRunner?.manager ?? this.dataSource.manager;

    await manager.query(
      `INSERT INTO refunds (payment_id, amount, reason, issued_by_kind, issued_by_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [paymentId, amount, reason, issuedByKind, issuedById ?? null],
    );

    // Update payment status
    await manager
      .createQueryBuilder()
      .update(PaymentEntity)
      .set({ status: 'refunded' })
      .where('id = :id', { id: paymentId })
      .execute();
  }

  /**
   * Verifies the HMAC signature of an incoming webhook and updates the
   * corresponding payment row's status.
   */
  async handleWebhook(body: unknown, signature: string): Promise<void> {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    const valid = this.paymentPort.verifyWebhook({ payload, signature });
    if (!valid) {
      throw new UnprocessableEntityException('webhook_signature_invalid');
    }

    // Parse the provider-specific payload to extract status + providerPaymentId
    let providerPaymentId: string | undefined;
    let newStatus: string | undefined;

    try {
      const parsed = typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : (JSON.parse(payload) as Record<string, unknown>);

      // MyFatoorah webhook shape
      providerPaymentId = String(
        (parsed['InvoiceId'] as string | undefined) ?? (parsed['invoiceId'] as string | undefined) ?? '',
      );
      const eventType = String(parsed['Event'] ?? parsed['event'] ?? '');
      if (eventType === 'PaymentSucceeded' || eventType === 'captured') {
        newStatus = 'captured';
      } else if (eventType === 'PaymentFailed' || eventType === 'failed') {
        newStatus = 'failed';
      } else if (eventType === 'Refunded' || eventType === 'refunded') {
        newStatus = 'refunded';
      }
    } catch (err) {
      this.logger.warn('Failed to parse webhook payload', err);
      return;
    }

    if (!providerPaymentId || !newStatus) {
      this.logger.warn('Webhook payload missing providerPaymentId or status');
      return;
    }

    await this.paymentRepo
      .createQueryBuilder()
      .update(PaymentEntity)
      .set({ status: newStatus })
      .where('provider_payment_id = :id', { id: providerPaymentId })
      .execute();

    this.logger.log(`Payment ${providerPaymentId} status updated to ${newStatus}`);
  }
}
