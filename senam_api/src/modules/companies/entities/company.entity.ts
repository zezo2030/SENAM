import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CompanyStatus = 'pending' | 'active' | 'suspended';
export type SubscriptionPlan = 'basic' | 'pro' | 'vip';
export type SubscriptionPeriod = 'monthly' | 'annual' | 'promo';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'legal_name', type: 'text' })
  legalName!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ type: 'citext', unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'logo_object_key', type: 'text', nullable: true })
  logoObjectKey!: string | null;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @Column({ name: 'has_commercial_registration', type: 'boolean', default: true })
  hasCommercialRegistration!: boolean;

  @Column({ name: 'commercial_registration_no', type: 'text', nullable: true })
  commercialRegistrationNo!: string | null;

  @Column({ type: 'citext', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  website!: string | null;

  @Column({ type: 'text', nullable: true })
  instagram!: string | null;

  @Column({ type: 'text', nullable: true })
  landline!: string | null;

  @Column({ name: 'whatsapp_link', type: 'text', nullable: true })
  whatsappLink!: string | null;

  @Column({ type: 'text', nullable: true })
  region!: string | null;

  @Column({ type: 'text', nullable: true })
  city!: string | null;

  @Column({ name: 'custom_service_text', type: 'text', nullable: true })
  customServiceText!: string | null;

  @Column({ name: 'additional_notes', type: 'text', nullable: true })
  additionalNotes!: string | null;

  @Column({ name: 'subscription_plan', type: 'text', nullable: true })
  subscriptionPlan!: SubscriptionPlan | null;

  @Column({ name: 'subscription_period', type: 'text', nullable: true })
  subscriptionPeriod!: SubscriptionPeriod | null;

  @Column({ name: 'subscription_price', type: 'bigint', nullable: true, transformer: { to: (v?: number | null) => v, from: (v?: string | null) => v == null ? null : Number(v) } })
  subscriptionPrice!: number | null;

  @Column({ type: 'text', default: 'pending' })
  status!: CompanyStatus;

  @Column({ name: 'kyc_approved_by', type: 'uuid', nullable: true })
  kycApprovedBy!: string | null;

  @Column({ name: 'kyc_approved_at', type: 'timestamptz', nullable: true })
  kycApprovedAt!: Date | null;

  @Column({ name: 'commission_bps', type: 'int', default: 0 })
  commissionBps!: number;

  @Column({ name: 'rating_avg', type: 'numeric', default: 0 })
  ratingAvg!: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ name: 'rejection_rate_pct', type: 'numeric', default: 0 })
  rejectionRatePct!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
