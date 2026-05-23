import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { SlotsService } from '../slots/slots.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DispatchProducer } from '../../infrastructure/queue/producers/dispatch.producer.js';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly dispatchTimeoutMs: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly slotsService: SlotsService,
    private readonly couponsService: CouponsService,
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
    private readonly dispatchProducer: DispatchProducer,
    private readonly configService: ConfigService,
  ) {
    this.dispatchTimeoutMs = this.configService.get<number>(
      'DISPATCH_ATTEMPT_TIMEOUT_MS',
      300000,
    );
  }

  async createBooking(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<OrderEntity> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Load customer — throw 404 if not found or status != 'active'
      const customers = await queryRunner.query(
        `SELECT id, status FROM users WHERE id = $1`,
        [userId],
      ) as Array<{ id: string; status: string }>;
      const customer = customers[0];
      if (!customer || customer.status !== 'active') {
        throw new NotFoundException('customer_not_found');
      }

      // Step 2: Load company — throw 404 if not active
      const companies = await queryRunner.query(
        `SELECT id, status, commission_bps FROM companies WHERE id = $1`,
        [dto.companyId],
      ) as Array<{ id: string; status: string; commission_bps: number }>;
      const company = companies[0];
      if (!company || company.status !== 'active') {
        throw new NotFoundException('company_not_found');
      }

      // Step 3: Load address — throw 403 if address.user_id != userId
      const addresses = await queryRunner.query(
        `SELECT id, user_id, latitude, longitude FROM addresses WHERE id = $1`,
        [dto.addressId],
      ) as Array<{ id: string; user_id: string; latitude: number; longitude: number }>;
      const address = addresses[0];
      if (!address) {
        throw new NotFoundException('address_not_found');
      }
      if (address.user_id !== userId) {
        throw new ForbiddenException('address_not_owned');
      }

      // Step 4: Load slot via SlotsService — throw 404 if not found
      const slots = await queryRunner.query(
        `SELECT id, company_id, capacity_remaining FROM time_slots WHERE id = $1`,
        [dto.slotId],
      ) as Array<{ id: string; company_id: string; capacity_remaining: number }>;
      const slot = slots[0];
      if (!slot) {
        throw new NotFoundException('slot_not_found');
      }

      // Step 5: Check service area via PostGIS
      const serviceAreaRows = await queryRunner.query(
        `SELECT ST_Covers(area::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geometry) AS covers
         FROM company_service_areas WHERE company_id = $3`,
        [address.longitude, address.latitude, dto.companyId],
      ) as Array<{ covers: boolean }>;

      if (!serviceAreaRows.length || !serviceAreaRows[0]!.covers) {
        throw new UnprocessableEntityException('address_outside_service_area');
      }

      // Step 6: Load company_services for each requested service — sum subtotal
      let subtotal = BigInt(0);
      for (const item of dto.services) {
        const rows = await queryRunner.query(
          `SELECT id, price FROM company_services WHERE id = $1 AND company_id = $2 AND is_active = true`,
          [item.companyServiceId, dto.companyId],
        ) as Array<{ id: string; price: string }>;
        if (!rows.length) {
          throw new NotFoundException(`company_service_not_found: ${item.companyServiceId}`);
        }
        subtotal += BigInt(rows[0]!.price) * BigInt(item.quantity);
      }

      // Step 7: SlotsService.decrementCapacity — throw 409 if returns false
      const decremented = await this.slotsService.decrementCapacity(dto.slotId, queryRunner);
      if (!decremented) {
        throw new ConflictException('slot_full');
      }

      // Step 8: Compute discount, apply coupon if present
      let discount = BigInt(0);

      // Generate a temporary order ID for coupon linkage
      const orderId = crypto.randomUUID();

      if (dto.couponId) {
        try {
          await this.couponsService.applyAtomically(
            dto.couponId,
            userId,
            orderId,
            queryRunner,
          );
          // Retrieve the discount from the coupon to compute it
          // We do a read of the coupon's kind and value to compute the discount
          const couponRows = await queryRunner.query(
            `SELECT kind, value_bps_or_amount FROM coupons WHERE id = $1`,
            [dto.couponId],
          ) as Array<{ kind: string; value_bps_or_amount: number }>;
          if (couponRows.length) {
            const coupon = couponRows[0]!;
            const subtotalNum = Number(subtotal);
            if (coupon.kind === 'percent') {
              discount = BigInt(Math.round((subtotalNum * coupon.value_bps_or_amount) / 10000));
            } else {
              discount = BigInt(Math.min(subtotalNum, coupon.value_bps_or_amount));
            }
          }
        } catch (err) {
          if (err instanceof ConflictException) {
            throw new ConflictException('coupon_exhausted');
          }
          throw err;
        }
      }

      const total = subtotal - discount;

      // Step 9: Compute commission
      const commission = BigInt(Math.round(Number(total) * company.commission_bps / 10000));

      // Step 10: Insert the order row
      const order = queryRunner.manager.create(OrderEntity, {
        id: orderId,
        customerId: userId,
        companyId: dto.companyId,
        assignedStaffId: null,
        slotId: dto.slotId,
        addressId: dto.addressId,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        total: total.toString(),
        commission: commission.toString(),
        paymentMethod: dto.paymentMethod,
        couponId: dto.couponId ?? null,
        status: 'pending',
        dispatchAttempt: 1,
        notes: dto.notes ?? null,
        confirmedAt: null,
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
      });

      const savedOrder = await queryRunner.manager.save(OrderEntity, order);

      // Step 11: Insert initial order_status_history row
      await queryRunner.query(
        `INSERT INTO order_status_history (order_id, status, changed_by_kind, changed_by_id)
         VALUES ($1, 'pending', 'customer', $2)`,
        [savedOrder.id, userId],
      );

      // Step 12: PaymentsService.authoriseForOrder
      await this.paymentsService.authoriseForOrder(
        {
          id: savedOrder.id,
          total: Number(total),
          paymentMethod: dto.paymentMethod,
        },
        dto.returnUrl ?? '',
        queryRunner,
      );

      // Step 13: Enqueue dispatch accept-timeout
      await this.dispatchProducer.enqueueAcceptTimeout(
        { orderId: savedOrder.id, attempt: 1 },
        this.dispatchTimeoutMs,
      );

      // Step 14: Write audit log
      await this.auditService.write(
        {
          actorKind: 'customer',
          actorId: userId,
          action: 'booking.create',
          targetKind: 'order',
          targetId: savedOrder.id,
        },
        queryRunner,
      );

      // Step 15: Commit
      await queryRunner.commitTransaction();

      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async listBookings(
    userId: string,
    status?: string,
  ): Promise<OrderEntity[]> {
    const repo = this.dataSource.getRepository(OrderEntity);
    const qb = repo
      .createQueryBuilder('o')
      .where('o.customer_id = :userId', { userId })
      .orderBy('o.created_at', 'DESC');

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    return qb.getMany();
  }

  async getBooking(userId: string, orderId: string): Promise<OrderEntity> {
    const repo = this.dataSource.getRepository(OrderEntity);
    const order = await repo.findOne({
      where: { id: orderId, customerId: userId },
    });
    if (!order) {
      throw new NotFoundException('order_not_found');
    }
    return order;
  }

  async reorder(userId: string, orderId: string): Promise<Partial<CreateBookingDto>> {
    const order = await this.getBooking(userId, orderId);

    // Load original services from order_items if they exist, otherwise return empty
    const items = await this.dataSource.query(
      `SELECT company_service_id AS "companyServiceId", quantity FROM order_items WHERE order_id = $1`,
      [orderId],
    ) as Array<{ companyServiceId: string; quantity: number }>;

    const draft: Partial<CreateBookingDto> = {
      companyId: order.companyId,
      addressId: order.addressId,
      paymentMethod: order.paymentMethod,
      ...(order.notes !== null ? { notes: order.notes } : {}),
      services: items.map((i) => ({
        companyServiceId: i.companyServiceId,
        quantity: i.quantity,
      })),
    };

    return draft;
  }

  async cancelBooking(userId: string, orderId: string): Promise<OrderEntity> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Load order with row lock
      const orders = await queryRunner.query(
        `SELECT o.id, o.customer_id, o.status, o.payment_method, o.slot_id,
                o.total, o.accepted_at
         FROM orders o
         WHERE o.id = $1
         FOR UPDATE`,
        [orderId],
      ) as Array<{
        id: string;
        customer_id: string;
        status: string;
        payment_method: string;
        slot_id: string;
        total: string;
        accepted_at: Date | null;
      }>;

      const order = orders[0];
      if (!order) {
        throw new NotFoundException('order_not_found');
      }
      if (order.customer_id !== userId) {
        throw new ForbiddenException('order_not_owned');
      }

      if (!['pending', 'accepted'].includes(order.status)) {
        throw new ConflictException('order_cannot_be_cancelled');
      }

      const now = new Date();
      let refundAmount = Number(order.total);

      // Cancellation fee logic for accepted orders based on timing
      if (order.status === 'accepted' && order.accepted_at) {
        const msSinceAccepted = now.getTime() - new Date(order.accepted_at).getTime();
        const hoursSinceAccepted = msSinceAccepted / (1000 * 60 * 60);
        if (hoursSinceAccepted < 1) {
          // Full refund within 1 hour of acceptance
          refundAmount = Number(order.total);
        } else {
          // Apply 20% cancellation fee after 1 hour
          refundAmount = Math.round(Number(order.total) * 0.8);
        }
      }

      // Transition to cancelled
      await queryRunner.query(
        `UPDATE orders SET status = 'cancelled', cancelled_at = now(), updated_at = now()
         WHERE id = $1`,
        [orderId],
      );

      // Increment slot capacity back
      await queryRunner.query(
        `UPDATE time_slots SET capacity_remaining = capacity_remaining + 1 WHERE id = $1`,
        [order.slot_id],
      );

      // Insert status history
      await queryRunner.query(
        `INSERT INTO order_status_history (order_id, status, changed_by_kind, changed_by_id)
         VALUES ($1, 'cancelled', 'customer', $2)`,
        [orderId, userId],
      );

      // Refund if not COD
      if (order.payment_method !== 'cod' && refundAmount > 0) {
        const payments = await queryRunner.query(
          `SELECT id FROM payments WHERE order_id = $1 AND status IN ('authorised', 'captured')
           ORDER BY created_at DESC LIMIT 1`,
          [orderId],
        ) as Array<{ id: string }>;

        if (payments.length) {
          await this.paymentsService.refund(
            payments[0]!.id,
            refundAmount,
            'customer_cancellation',
            'system',
            undefined,
            queryRunner,
          );
        }
      }

      // Write audit log
      await this.auditService.write(
        {
          actorKind: 'customer',
          actorId: userId,
          action: 'booking.cancel',
          targetKind: 'order',
          targetId: orderId,
        },
        queryRunner,
      );

      await queryRunner.commitTransaction();

      const updatedOrder = await this.dataSource.getRepository(OrderEntity).findOne({
        where: { id: orderId },
      });
      return updatedOrder!;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
