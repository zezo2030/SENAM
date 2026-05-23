import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SettlementStatus = 'due' | 'provider_owes' | 'paid' | 'void';

@Entity('settlements')
export class SettlementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'window_start', type: 'timestamptz' })
  windowStart!: Date;

  @Column({ name: 'window_end', type: 'timestamptz' })
  windowEnd!: Date;

  @Column({ name: 'opening_carry_forward', type: 'bigint', default: 0 })
  openingCarryForward!: string;

  @Column({ name: 'gross_online', type: 'bigint' })
  grossOnline!: string;

  @Column({ name: 'commission_online', type: 'bigint' })
  commissionOnline!: string;

  @Column({ name: 'refunds_in_window', type: 'bigint' })
  refundsInWindow!: string;

  @Column({ name: 'commission_cod', type: 'bigint' })
  commissionCod!: string;

  @Column({ name: 'net_amount', type: 'bigint' })
  netAmount!: string;

  @Column({ type: 'text' })
  status!: SettlementStatus;

  @Column({ name: 'payout_reference', type: 'text', nullable: true })
  payoutReference!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
