import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('reviews')
@Index('ux_reviews_company_customer', ['companyId', 'customerId'], { unique: true })
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'rating_company', type: 'smallint' })
  ratingCompany!: number;

  @Column({ name: 'rating_speed', type: 'smallint', nullable: true })
  ratingSpeed!: number | null;

  @Column({ name: 'rating_quality', type: 'smallint', nullable: true })
  ratingQuality!: number | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'photo_object_keys', type: 'text', array: true, default: [] })
  photoObjectKeys!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
