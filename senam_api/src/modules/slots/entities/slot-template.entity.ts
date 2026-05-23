import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('slot_templates')
export class SlotTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'slot_duration_minutes', type: 'int', default: 60 })
  slotDurationMinutes!: number;

  @Column({ name: 'capacity_per_slot', type: 'int', default: 2 })
  capacityPerSlot!: number;

  /** Bitmask Mon=1 Tue=2 Wed=4 Thu=8 Fri=16 Sat=32 Sun=64; default 125 = Mon–Sat */
  @Column({ name: 'weekday_mask', type: 'smallint', default: 125 })
  weekdayMask!: number;

  /** HH:MM format, e.g. "09:00" */
  @Column({ name: 'open_time', type: 'time' })
  openTime!: string;

  /** HH:MM format, e.g. "18:00" */
  @Column({ name: 'close_time', type: 'time' })
  closeTime!: string;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo!: string | null;
}
