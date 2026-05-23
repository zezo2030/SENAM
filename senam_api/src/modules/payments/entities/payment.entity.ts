import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ name: 'provider_payment_id', type: 'text', nullable: true })
  providerPaymentId!: string | null;

  /** Amount in minor-currency units */
  @Column({ type: 'bigint' })
  amount!: number;

  /**
   * payment lifecycle status:
   *   authorised | pending_redirect | captured | cod | failed | refunded
   */
  @Column({ type: 'text' })
  status!: string;

  @Column({ name: 'raw_payload_redacted', type: 'jsonb', nullable: true })
  rawPayloadRedacted!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
