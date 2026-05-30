import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CompanyUserRole = 'owner';
export type CompanyUserStatus = 'active' | 'suspended';

/**
 * Each company has exactly one owner login. Staff role / order metrics
 * were removed when SENAM became a directory-only app.
 */
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

  @Column({ type: 'text', default: 'owner' })
  role!: CompanyUserRole;

  @Column({ type: 'text', default: 'active' })
  status!: CompanyUserStatus;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
