import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentMethod = 'card' | 'applepay' | 'googlepay' | 'cod';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'unassignable';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'assigned_staff_id', type: 'uuid', nullable: true })
  assignedStaffId!: string | null;

  @Column({ name: 'slot_id', type: 'uuid' })
  slotId!: string;

  @Column({ name: 'address_id', type: 'uuid' })
  addressId!: string;

  @Column({ type: 'bigint' })
  subtotal!: string;

  @Column({ type: 'bigint', default: 0 })
  discount!: string;

  @Column({ type: 'bigint' })
  total!: string;

  @Column({ type: 'bigint' })
  commission!: string;

  @Column({ name: 'payment_method', type: 'text' })
  paymentMethod!: PaymentMethod;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId!: string | null;

  @Column({ type: 'text', default: 'pending' })
  status!: OrderStatus;

  @Column({ name: 'dispatch_attempt', type: 'smallint', default: 1 })
  dispatchAttempt!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;
}
