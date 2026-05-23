import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { CouponEntity } from './entities/coupon.entity.js';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepo: Repository<CouponEntity>,
  ) {}

  /**
   * Validates a coupon code without side effects (read-only preview).
   * Throws UnprocessableEntityException with a descriptive message on any
   * validation failure.
   */
  async validate(
    code: string,
    userId: string,
    subtotal: number,
    companyId?: string,
    categoryId?: string,
  ): Promise<{ discountAmount: number; coupon: CouponEntity }> {
    const coupon = await this.couponRepo
      .createQueryBuilder('c')
      .where('c.code = :code', { code })
      .getOne();

    if (!coupon) {
      throw new NotFoundException('coupon_not_found');
    }

    if (!coupon.isActive) {
      throw new UnprocessableEntityException('coupon_inactive');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new UnprocessableEntityException('coupon_expired');
    }

    if (subtotal < coupon.minOrderAmount) {
      throw new UnprocessableEntityException('coupon_min_order_not_met');
    }

    // Total cap check (optimistic — applyAtomically will enforce strictly)
    if (coupon.totalCap !== null && coupon.usedCount >= coupon.totalCap) {
      throw new UnprocessableEntityException('coupon_exhausted');
    }

    // Scope validation
    if (coupon.scopeCompanyId !== null) {
      if (!companyId || coupon.scopeCompanyId !== companyId) {
        throw new UnprocessableEntityException('coupon_scope_mismatch');
      }
    }

    if (coupon.scopeCategoryId !== null) {
      if (!categoryId || coupon.scopeCategoryId !== categoryId) {
        throw new UnprocessableEntityException('coupon_scope_mismatch');
      }
    }

    // Per-user cap check
    if (coupon.perUserCap !== null) {
      const userUsageCount = await this.couponRepo.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('coupon_usages', 'cu')
        .where('cu.coupon_id = :couponId', { couponId: coupon.id })
        .andWhere('cu.user_id = :userId', { userId })
        .getRawOne<{ count: string }>();

      const count = parseInt(userUsageCount?.count ?? '0', 10);
      if (count >= coupon.perUserCap) {
        throw new UnprocessableEntityException('coupon_per_user_cap_exceeded');
      }
    }

    const discountAmount = this.computeDiscount(coupon, subtotal);

    return { discountAmount, coupon };
  }

  /**
   * Atomically increments used_count and inserts a coupon_usages row.
   * Throws ConflictException if the coupon is exhausted (race condition).
   */
  async applyAtomically(
    couponId: string,
    userId: string,
    orderId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const result = await queryRunner.query(
      `WITH cap AS (
         UPDATE coupons
         SET used_count = used_count + 1
         WHERE id = $1
           AND (total_cap IS NULL OR used_count < total_cap)
           AND is_active = true
           AND now() BETWEEN valid_from AND valid_until
         RETURNING id
       )
       INSERT INTO coupon_usages (coupon_id, user_id, order_id)
       SELECT id, $2, $3 FROM cap`,
      [couponId, userId, orderId],
    );

    // pg driver returns the command tag for INSERT; rowCount 0 means nothing was inserted
    const rowsInserted = Array.isArray(result) ? result.length : (result as { rowCount?: number })?.rowCount ?? 0;

    if (rowsInserted === 0) {
      throw new ConflictException('coupon_exhausted');
    }
  }

  private computeDiscount(coupon: CouponEntity, subtotal: number): number {
    if (coupon.kind === 'percent') {
      // value_bps_or_amount is basis points (e.g. 2000 = 20%)
      return Math.round((subtotal * coupon.valueBpsOrAmount) / 10000);
    }
    // kind === 'fixed': value_bps_or_amount is the fixed discount in minor-currency units
    return Math.min(subtotal, coupon.valueBpsOrAmount);
  }
}
