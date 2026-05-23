import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('review_replies')
export class ReviewReplyEntity {
  @PrimaryColumn({ name: 'review_id', type: 'uuid' })
  reviewId!: string;

  @Column({ name: 'company_user_id', type: 'uuid' })
  companyUserId!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
