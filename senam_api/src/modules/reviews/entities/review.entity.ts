import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'staff_id', type: 'uuid', nullable: true })
  staffId!: string | null;

  @Column({ name: 'rating_company', type: 'smallint' })
  ratingCompany!: number;

  @Column({ name: 'rating_staff', type: 'smallint', nullable: true })
  ratingStaff!: number | null;

  @Column({ name: 'rating_speed', type: 'smallint', nullable: true })
  ratingSpeed!: number | null;

  @Column({ name: 'rating_quality', type: 'smallint', nullable: true })
  ratingQuality!: number | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'photo_object_keys', type: 'text', array: true, default: [] })
  photoObjectKeys!: string[];

  @Column({ name: 'locked_at', type: 'timestamptz' })
  lockedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
