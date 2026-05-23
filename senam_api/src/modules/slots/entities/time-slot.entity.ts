import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('time_slots')
export class TimeSlotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'slot_start_at', type: 'timestamptz' })
  slotStartAt!: Date;

  @Column({ name: 'slot_end_at', type: 'timestamptz' })
  slotEndAt!: Date;

  @Column({ name: 'capacity_total', type: 'smallint' })
  capacityTotal!: number;

  @Column({ name: 'capacity_remaining', type: 'smallint' })
  capacityRemaining!: number;
}
