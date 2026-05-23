import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('company_service_areas')
export class CompanyServiceAreaEntity {
  @PrimaryColumn({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  area!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
