import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Case-insensitive text (citext extension required) */
  @Column({ type: 'citext', unique: true })
  code!: string;

  @Column({ type: 'text' })
  kind!: 'percent' | 'fixed';

  /** Basis-points for percent coupons, minor-currency units for fixed */
  @Column({ name: 'value_bps_or_amount', type: 'bigint' })
  valueBpsOrAmount!: number;

  /** Minimum order subtotal in minor-currency units */
  @Column({ name: 'min_order_amount', type: 'bigint' })
  minOrderAmount!: number;

  @Column({ name: 'scope_category_id', type: 'uuid', nullable: true })
  scopeCategoryId!: string | null;

  @Column({ name: 'scope_company_id', type: 'uuid', nullable: true })
  scopeCompanyId!: string | null;

  @Column({ name: 'total_cap', type: 'int', nullable: true })
  totalCap!: number | null;

  @Column({ name: 'per_user_cap', type: 'int', nullable: true })
  perUserCap!: number | null;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom!: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil!: Date;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
