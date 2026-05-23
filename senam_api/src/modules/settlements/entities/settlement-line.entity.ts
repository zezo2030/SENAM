import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('settlement_lines')
export class SettlementLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'settlement_id', type: 'uuid' })
  settlementId!: string;

  @Column({ type: 'text' })
  kind!: string;

  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId!: string;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
