import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { NotificationsProducer } from '../../infrastructure/queue/producers/notifications.producer.js';
import { DispatchProducer } from '../../infrastructure/queue/producers/dispatch.producer.js';
import { ApproveCompanyDto } from './dto/approve-company.dto.js';
import { SuspendCompanyDto } from './dto/suspend-company.dto.js';
import { UpdateCommissionDto } from './dto/update-commission.dto.js';
import { InterveneOrderDto } from './dto/intervene-order.dto.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

const TERMINAL_STATUSES = ['completed', 'cancelled', 'unassignable'];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsProducer: NotificationsProducer,
    private readonly dispatchProducer: DispatchProducer,
  ) {}

  // ─── Companies ───────────────────────────────────────────────────────────────

  async listCompanies(filter: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    let whereClause = '';

    if (filter.status) {
      params.push(filter.status);
      whereClause = `WHERE status = $${params.length}`;
    }

    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM companies ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    params.push(limit);
    params.push(offset);

    const data = await this.dataSource.query(
      `SELECT
          id,
          legal_name                  AS "legalName",
          display_name                AS "displayName",
          slug,
          description,
          logo_object_key             AS "logoObjectKey",
          phone,
          email,
          website,
          instagram,
          landline,
          whatsapp_link               AS "whatsappLink",
          region,
          city,
          category_id                 AS "categoryId",
          has_commercial_registration AS "hasCommercialRegistration",
          commercial_registration_no  AS "commercialRegistrationNo",
          custom_service_text         AS "customServiceText",
          additional_notes            AS "additionalNotes",
          subscription_plan           AS "subscriptionPlan",
          subscription_period         AS "subscriptionPeriod",
          subscription_price          AS "subscriptionPrice",
          status,
          kyc_approved_by             AS "kycApprovedBy",
          kyc_approved_at             AS "kycApprovedAt",
          commission_bps              AS "commissionBps",
          rating_avg                  AS "ratingAvg",
          rating_count                AS "ratingCount",
          rejection_rate_pct          AS "rejectionRatePct",
          created_at                  AS "createdAt",
          updated_at                  AS "updatedAt"
        FROM companies ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { data, total, page, limit };
  }

  async approveCompany(
    id: string,
    adminId: string,
    _correlationId?: string,
  ): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE companies
       SET status = 'active', kyc_approved_by = $1, kyc_approved_at = now()
       WHERE id = $2 AND status = 'pending'
       RETURNING id`,
      [adminId, id],
    );

    if (!result.length) {
      throw new ConflictException('company_not_pending_or_not_found');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'company.approve',
      targetKind: 'company',
      targetId: id,
      after: { status: 'active' },
    });

    const owners = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM company_users WHERE company_id = $1 AND role = 'owner'`,
      [id],
    );
    for (const owner of owners) {
      await this.dataSource.query(
        `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
         VALUES ('company_user', $1, 'company.approved', $2, ARRAY['in_app','push','email'], 'pending')`,
        [owner.id, JSON.stringify({ companyId: id })],
      );
      await this.notificationsProducer.enqueue({
        userKind: 'company_user',
        userId: owner.id,
        topic: 'company.approved',
        payload: { companyId: id },
        channels: ['push', 'in_app', 'email'],
      });
    }
  }

  async suspendCompany(
    id: string,
    adminId: string,
    dto: SuspendCompanyDto,
    _correlationId?: string,
  ): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE companies SET status = 'suspended' WHERE id = $1 AND status != 'suspended' RETURNING id`,
      [id],
    );

    if (!result.length) {
      throw new ConflictException('company_not_found_or_already_suspended');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'company.suspend',
      targetKind: 'company',
      targetId: id,
      after: { status: 'suspended' },
      reason: dto.reason,
    });

    const owners = await this.dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM company_users WHERE company_id = $1 AND role = 'owner'`,
      [id],
    );
    for (const owner of owners) {
      await this.dataSource.query(
        `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
         VALUES ('company_user', $1, 'company.suspended', $2, ARRAY['in_app','push','email'], 'pending')`,
        [owner.id, JSON.stringify({ companyId: id, reason: dto.reason })],
      );
      await this.notificationsProducer.enqueue({
        userKind: 'company_user',
        userId: owner.id,
        topic: 'company.suspended',
        payload: { companyId: id, reason: dto.reason },
        channels: ['push', 'in_app', 'email'],
      });
    }
  }

  async updateCommission(
    id: string,
    dto: UpdateCommissionDto,
    adminId: string,
    _correlationId?: string,
  ): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string; commission_bps: number }>>(
      `UPDATE companies SET commission_bps = $1 WHERE id = $2 RETURNING id, commission_bps`,
      [dto.commissionBps, id],
    );

    if (!result.length) {
      throw new NotFoundException('company_not_found');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'company.update_commission',
      targetKind: 'company',
      targetId: id,
      after: { commissionBps: dto.commissionBps },
    });
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async listOrders(filter: {
    status?: string;
    companyId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filter.companyId) {
      params.push(filter.companyId);
      conditions.push(`company_id = $${params.length}`);
    }
    if (filter.from) {
      params.push(filter.from);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (filter.to) {
      params.push(filter.to);
      conditions.push(`created_at <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM orders ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    params.push(limit);
    params.push(offset);

    const data = await this.dataSource.query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { data, total, page, limit };
  }

  async intervene(
    orderId: string,
    dto: InterveneOrderDto,
    adminId: string,
  ): Promise<void> {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Load order with FOR UPDATE lock
      const orders = (await qr.query(
        `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId],
      )) as Array<Record<string, unknown>>;
      const order = orders[0];

      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      const beforeStatus = order['status'] as string;

      if (dto.action === 'cancel') {
        if (TERMINAL_STATUSES.includes(beforeStatus)) {
          throw new ConflictException('order_already_in_terminal_state');
        }

        await qr.query(
          `UPDATE orders SET status = 'cancelled', cancelled_at = now()
           WHERE id = $1 AND status NOT IN ('completed','cancelled','unassignable')`,
          [orderId],
        );

        // Insert order_status_history
        await qr.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, actor_kind, actor_id, reason)
           VALUES ($1, $2, 'cancelled', 'admin', $3, $4)`,
          [orderId, beforeStatus, adminId, dto.reason],
        );

        // Refund if online payment
        if (order['payment_method'] !== 'cod') {
          const payments = (await qr.query(
            `SELECT id FROM payments WHERE order_id = $1 AND status IN ('captured','authorised') LIMIT 1`,
            [orderId],
          )) as Array<{ id: string }>;
          if (payments.length) {
            await this.paymentsService.refund(
              payments[0].id,
              Number(order['total']),
              dto.reason,
              'admin',
              adminId,
              qr,
            );
          }
        }

        await this.auditService.write(
          {
            actorKind: 'admin',
            actorId: adminId,
            action: 'order.intervene',
            targetKind: 'order',
            targetId: orderId,
            before: { status: beforeStatus },
            after: { status: 'cancelled', reason: dto.reason },
            reason: dto.reason,
          },
          qr,
        );

        // Persist in-app notification row
        await qr.query(
          `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
           VALUES ('customer', $1, 'order.cancelled', $2, ARRAY['in_app','push'], 'pending')`,
          [order['customer_id'], JSON.stringify({ orderId, reason: dto.reason })],
        );

        // Enqueue push/email delivery
        await this.notificationsProducer.enqueue({
          userKind: 'customer',
          userId: order['customer_id'] as string,
          topic: 'order.cancelled',
          payload: { orderId, reason: dto.reason },
          channels: ['push', 'in_app'],
        });

      } else if (dto.action === 'refund_full') {
        const payments = (await qr.query(
          `SELECT id FROM payments WHERE order_id = $1 AND status IN ('captured','authorised') LIMIT 1`,
          [orderId],
        )) as Array<{ id: string }>;
        if (!payments.length) {
          throw new BadRequestException('no_refundable_payment_found');
        }

        await this.paymentsService.refund(
          payments[0].id,
          Number(order['total']),
          dto.reason,
          'admin',
          adminId,
          qr,
        );

        await this.auditService.write(
          {
            actorKind: 'admin',
            actorId: adminId,
            action: 'order.intervene',
            targetKind: 'order',
            targetId: orderId,
            before: { status: beforeStatus },
            after: { refundAmount: Number(order['total']), reason: dto.reason },
            reason: dto.reason,
          },
          qr,
        );

        await qr.query(
          `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
           VALUES ('customer', $1, 'order.refunded', $2, ARRAY['in_app','push'], 'pending')`,
          [order['customer_id'], JSON.stringify({ orderId, amount: Number(order['total']), reason: dto.reason })],
        );

        await this.notificationsProducer.enqueue({
          userKind: 'customer',
          userId: order['customer_id'] as string,
          topic: 'order.refunded',
          payload: { orderId, amount: Number(order['total']), reason: dto.reason },
          channels: ['push', 'in_app'],
        });

      } else if (dto.action === 'refund_partial') {
        if (dto.amount === undefined) {
          throw new BadRequestException('amount_required_for_partial_refund');
        }

        const paymentsP = (await qr.query(
          `SELECT id FROM payments WHERE order_id = $1 AND status IN ('captured','authorised') LIMIT 1`,
          [orderId],
        )) as Array<{ id: string }>;
        if (!paymentsP.length) {
          throw new BadRequestException('no_refundable_payment_found');
        }

        await this.paymentsService.refund(
          paymentsP[0].id,
          dto.amount,
          dto.reason,
          'admin',
          adminId,
          qr,
        );

        await this.auditService.write(
          {
            actorKind: 'admin',
            actorId: adminId,
            action: 'order.intervene',
            targetKind: 'order',
            targetId: orderId,
            before: { status: beforeStatus },
            after: { refundAmount: dto.amount, reason: dto.reason },
            reason: dto.reason,
          },
          qr,
        );

        await qr.query(
          `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
           VALUES ('customer', $1, 'order.refunded', $2, ARRAY['in_app','push'], 'pending')`,
          [order['customer_id'], JSON.stringify({ orderId, amount: dto.amount, reason: dto.reason })],
        );

        await this.notificationsProducer.enqueue({
          userKind: 'customer',
          userId: order['customer_id'] as string,
          topic: 'order.refunded',
          payload: { orderId, amount: dto.amount, reason: dto.reason },
          channels: ['push', 'in_app'],
        });

      } else if (dto.action === 'reassign') {
        if (!dto.newCompanyId) {
          throw new BadRequestException('newCompanyId_required_for_reassign');
        }

        await qr.query(
          `UPDATE orders SET company_id = $1 WHERE id = $2`,
          [dto.newCompanyId, orderId],
        );

        // Enqueue new dispatch
        const attempt = (Number(order['dispatch_attempt']) || 1) + 1;
        await this.dispatchProducer.enqueueAcceptTimeout({ orderId, attempt }, 0);

        await this.auditService.write(
          {
            actorKind: 'admin',
            actorId: adminId,
            action: 'order.intervene',
            targetKind: 'order',
            targetId: orderId,
            before: { companyId: order['company_id'] as string },
            after: { companyId: dto.newCompanyId, reason: dto.reason },
            reason: dto.reason,
          },
          qr,
        );

        await qr.query(
          `INSERT INTO notifications (user_kind, user_id, topic, payload, channels, state)
           VALUES ('customer', $1, 'order.reassigned', $2, ARRAY['in_app','push'], 'pending')`,
          [order['customer_id'], JSON.stringify({ orderId, newCompanyId: dto.newCompanyId, reason: dto.reason })],
        );

        await this.notificationsProducer.enqueue({
          userKind: 'customer',
          userId: order['customer_id'] as string,
          topic: 'order.reassigned',
          payload: { orderId, newCompanyId: dto.newCompanyId, reason: dto.reason },
          channels: ['push', 'in_app'],
        });

        // Notify old company
        if (order['company_id']) {
          const companyUsers = (await qr.query(
            `SELECT id FROM company_users WHERE company_id = $1 AND role = 'owner' LIMIT 1`,
            [order['company_id']],
          )) as Array<{ id: string }>;
          if (companyUsers.length) {
            await this.notificationsProducer.enqueue({
              userKind: 'company_user',
              userId: companyUsers[0].id,
              topic: 'order.reassigned_away',
              payload: { orderId, reason: dto.reason },
              channels: ['push', 'in_app'],
            });
          }
        }
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ─── Coupons ─────────────────────────────────────────────────────────────────

  async listCoupons(
    page = 1,
    limit = 20,
  ): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM coupons`,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);
    const data = await this.dataSource.query(
      `SELECT * FROM coupons ORDER BY valid_from DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { data, total, page, limit };
  }

  async createCoupon(dto: CreateCouponDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO coupons
         (code, kind, value_bps_or_amount, min_order_amount, scope_category_id, scope_company_id,
          total_cap, per_user_cap, valid_from, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        dto.code,
        dto.kind,
        dto.valueBpsOrAmount,
        dto.minOrderAmount,
        dto.scopeCategoryId ?? null,
        dto.scopeCompanyId ?? null,
        dto.totalCap ?? null,
        dto.perUserCap ?? null,
        dto.validFrom,
        dto.validUntil,
      ],
    );

    const coupon = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'coupon.create',
      targetKind: 'coupon',
      targetId: coupon.id,
      after: coupon,
    });

    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.code !== undefined) { params.push(dto.code); sets.push(`code = $${params.length}`); }
    if (dto.kind !== undefined) { params.push(dto.kind); sets.push(`kind = $${params.length}`); }
    if (dto.valueBpsOrAmount !== undefined) { params.push(dto.valueBpsOrAmount); sets.push(`value_bps_or_amount = $${params.length}`); }
    if (dto.minOrderAmount !== undefined) { params.push(dto.minOrderAmount); sets.push(`min_order_amount = $${params.length}`); }
    if (dto.scopeCategoryId !== undefined) { params.push(dto.scopeCategoryId); sets.push(`scope_category_id = $${params.length}`); }
    if (dto.scopeCompanyId !== undefined) { params.push(dto.scopeCompanyId); sets.push(`scope_company_id = $${params.length}`); }
    if (dto.totalCap !== undefined) { params.push(dto.totalCap); sets.push(`total_cap = $${params.length}`); }
    if (dto.perUserCap !== undefined) { params.push(dto.perUserCap); sets.push(`per_user_cap = $${params.length}`); }
    if (dto.validFrom !== undefined) { params.push(dto.validFrom); sets.push(`valid_from = $${params.length}`); }
    if (dto.validUntil !== undefined) { params.push(dto.validUntil); sets.push(`valid_until = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE coupons SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('coupon_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'coupon.update',
      targetKind: 'coupon',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteCoupon(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE coupons SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('coupon_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'coupon.delete',
      targetKind: 'coupon',
      targetId: id,
      after: { isActive: false },
    });
  }

  // ─── Categories ──────────────────────────────────────────────────────────────

  async listCategories(): Promise<unknown[]> {
    return this.dataSource.query(`SELECT * FROM categories ORDER BY sort_order ASC, name_ar ASC`);
  }

  async createCategory(dto: CreateCategoryDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO categories (slug, name_ar, name_en, icon_key, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        dto.slug,
        dto.nameAr,
        dto.nameEn ?? null,
        dto.iconKey ?? null,
        dto.sortOrder ?? 0,
        dto.isActive ?? true,
      ],
    );

    const category = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'category.create',
      targetKind: 'category',
      targetId: category.id,
      after: category,
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.slug !== undefined) { params.push(dto.slug); sets.push(`slug = $${params.length}`); }
    if (dto.nameAr !== undefined) { params.push(dto.nameAr); sets.push(`name_ar = $${params.length}`); }
    if (dto.nameEn !== undefined) { params.push(dto.nameEn); sets.push(`name_en = $${params.length}`); }
    if (dto.iconKey !== undefined) { params.push(dto.iconKey); sets.push(`icon_key = $${params.length}`); }
    if (dto.sortOrder !== undefined) { params.push(dto.sortOrder); sets.push(`sort_order = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('category_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'category.update',
      targetKind: 'category',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteCategory(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE categories SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('category_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'category.delete',
      targetKind: 'category',
      targetId: id,
      after: { isActive: false },
    });
  }

  // ─── Services ─────────────────────────────────────────────────────────────────

  async listServices(categoryId?: string): Promise<unknown[]> {
    if (categoryId) {
      return this.dataSource.query(
        `SELECT * FROM services WHERE category_id = $1 ORDER BY name_ar ASC`,
        [categoryId],
      );
    }
    return this.dataSource.query(`SELECT * FROM services ORDER BY name_ar ASC`);
  }

  async createService(dto: CreateServiceDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO services
         (category_id, slug, name_ar, name_en, description_ar, base_duration_minutes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        dto.categoryId,
        dto.slug,
        dto.nameAr,
        dto.nameEn ?? null,
        dto.descriptionAr ?? null,
        dto.baseDurationMinutes ?? 60,
        dto.isActive ?? true,
      ],
    );

    const service = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'service.create',
      targetKind: 'service',
      targetId: service.id,
      after: service,
    });

    return service;
  }

  async updateService(id: string, dto: UpdateServiceDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.categoryId !== undefined) { params.push(dto.categoryId); sets.push(`category_id = $${params.length}`); }
    if (dto.slug !== undefined) { params.push(dto.slug); sets.push(`slug = $${params.length}`); }
    if (dto.nameAr !== undefined) { params.push(dto.nameAr); sets.push(`name_ar = $${params.length}`); }
    if (dto.nameEn !== undefined) { params.push(dto.nameEn); sets.push(`name_en = $${params.length}`); }
    if (dto.descriptionAr !== undefined) { params.push(dto.descriptionAr); sets.push(`description_ar = $${params.length}`); }
    if (dto.baseDurationMinutes !== undefined) { params.push(dto.baseDurationMinutes); sets.push(`base_duration_minutes = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE services SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('service_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'service.update',
      targetKind: 'service',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteService(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE services SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('service_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'service.delete',
      targetKind: 'service',
      targetId: id,
      after: { isActive: false },
    });
  }

  // ─── Banners ─────────────────────────────────────────────────────────────────

  async listBanners(): Promise<unknown[]> {
    return this.dataSource.query(
      `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`,
    );
  }

  async createBanner(dto: CreateBannerDto, adminId: string): Promise<unknown> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `INSERT INTO banners
         (title_ar, title_en, subtitle_ar, subtitle_en, image_url, link_url,
          target_type, target_id, sort_order, is_active, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        dto.titleAr,
        dto.titleEn ?? null,
        dto.subtitleAr ?? null,
        dto.subtitleEn ?? null,
        dto.imageUrl,
        dto.linkUrl ?? null,
        dto.targetType ?? null,
        dto.targetId ?? null,
        dto.sortOrder ?? 0,
        dto.isActive ?? true,
        dto.startsAt ?? null,
        dto.endsAt ?? null,
      ],
    );

    const banner = result[0];
    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'banner.create',
      targetKind: 'banner',
      targetId: banner.id,
      after: banner,
    });

    return banner;
  }

  async updateBanner(id: string, dto: UpdateBannerDto, adminId: string): Promise<unknown> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (dto.titleAr !== undefined) { params.push(dto.titleAr); sets.push(`title_ar = $${params.length}`); }
    if (dto.titleEn !== undefined) { params.push(dto.titleEn); sets.push(`title_en = $${params.length}`); }
    if (dto.subtitleAr !== undefined) { params.push(dto.subtitleAr); sets.push(`subtitle_ar = $${params.length}`); }
    if (dto.subtitleEn !== undefined) { params.push(dto.subtitleEn); sets.push(`subtitle_en = $${params.length}`); }
    if (dto.imageUrl !== undefined) { params.push(dto.imageUrl); sets.push(`image_url = $${params.length}`); }
    if (dto.linkUrl !== undefined) { params.push(dto.linkUrl); sets.push(`link_url = $${params.length}`); }
    if (dto.targetType !== undefined) { params.push(dto.targetType); sets.push(`target_type = $${params.length}`); }
    if (dto.targetId !== undefined) { params.push(dto.targetId); sets.push(`target_id = $${params.length}`); }
    if (dto.sortOrder !== undefined) { params.push(dto.sortOrder); sets.push(`sort_order = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }
    if (dto.startsAt !== undefined) { params.push(dto.startsAt); sets.push(`starts_at = $${params.length}`); }
    if (dto.endsAt !== undefined) { params.push(dto.endsAt); sets.push(`ends_at = $${params.length}`); }

    if (!sets.length) throw new BadRequestException('no_fields_to_update');

    sets.push(`updated_at = now()`);
    params.push(id);
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE banners SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (!result.length) throw new NotFoundException('banner_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'banner.update',
      targetKind: 'banner',
      targetId: id,
      after: dto,
    });

    return result[0];
  }

  async deleteBanner(id: string, adminId: string): Promise<void> {
    const result = await this.dataSource.query<Array<{ id: string }>>(
      `DELETE FROM banners WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.length) throw new NotFoundException('banner_not_found');

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'banner.delete',
      targetKind: 'banner',
      targetId: id,
    });
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  async listUsers(filter: {
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filter.q) {
      params.push(`%${filter.q}%`);
      const i = params.length;
      conditions.push(
        `(email ILIKE $${i} OR phone ILIKE $${i} OR display_name ILIKE $${i})`,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) AS count FROM users ${whereClause}`,
      params,
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    params.push(limit);
    params.push(offset);

    const data = await this.dataSource.query(
      `SELECT id, email, display_name, phone, locale, status,
              email_verified_at, created_at, updated_at, deleted_at
         FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { data, total, page, limit };
  }

  async getUser(id: string): Promise<unknown> {
    const rows = await this.dataSource.query(
      `SELECT id, email, display_name, phone, locale, status,
              email_verified_at, created_at, updated_at, deleted_at
         FROM users WHERE id = $1`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException('user_not_found');
    }
    return rows[0];
  }

  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    adminId: string,
  ): Promise<unknown> {
    const before = await this.dataSource.query<Array<{ status: string }>>(
      `SELECT status FROM users WHERE id = $1`,
      [id],
    );
    if (!before.length) {
      throw new NotFoundException('user_not_found');
    }
    if (before[0].status === 'deleted') {
      throw new ConflictException('user_deleted');
    }

    const result = await this.dataSource.query<Array<Record<string, unknown>>>(
      `UPDATE users
          SET status = $1, updated_at = now()
        WHERE id = $2
        RETURNING id, email, display_name, phone, locale, status, created_at, updated_at`,
      [dto.status, id],
    );

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: dto.status === 'banned' ? 'user.ban' : 'user.reactivate',
      targetKind: 'user',
      targetId: id,
      before: { status: before[0].status },
      after: { status: dto.status },
      ...(dto.reason ? { reason: dto.reason } : {}),
    });

    return result[0];
  }

  async deleteUser(id: string, adminId: string): Promise<void> {
    const before = await this.dataSource.query<Array<{ status: string }>>(
      `SELECT status FROM users WHERE id = $1`,
      [id],
    );
    if (!before.length) {
      throw new NotFoundException('user_not_found');
    }

    const result = await this.dataSource.query<Array<{ id: string }>>(
      `UPDATE users
          SET status = 'deleted',
              deleted_at = now(),
              email = 'deleted+' || id || '@senam.invalid',
              phone = NULL,
              display_name = NULL,
              password_hash = NULL,
              updated_at = now()
        WHERE id = $1 AND status != 'deleted'
        RETURNING id`,
      [id],
    );

    if (!result.length) {
      throw new ConflictException('user_already_deleted');
    }

    await this.auditService.write({
      actorKind: 'admin',
      actorId: adminId,
      action: 'user.delete',
      targetKind: 'user',
      targetId: id,
      before: { status: before[0].status },
      after: { status: 'deleted' },
    });
  }
}
