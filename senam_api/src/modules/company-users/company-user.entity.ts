import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CompanyUserRole = 'owner' | 'staff';
export type CompanyUserStatus = 'active' | 'suspended';

@Entity('company_users')
export class CompanyUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'citext', unique: true })
  email!: string;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ type: 'text', default: 'staff' })
  role!: CompanyUserRole;

  @Column({ name: 'rating_avg', type: 'numeric', default: 0 })
  ratingAvg!: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ name: 'completed_orders_count', type: 'int', default: 0 })
  completedOrdersCount!: number;

  @Column({ type: 'text', default: 'active' })
  status!: CompanyUserStatus;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
