import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, MoreThan, DataSource } from 'typeorm';
import { SlotTemplateEntity } from './entities/slot-template.entity.js';
import { TimeSlotEntity } from './entities/time-slot.entity.js';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(SlotTemplateEntity)
    private readonly templateRepo: Repository<SlotTemplateEntity>,

    @InjectRepository(TimeSlotEntity)
    private readonly slotRepo: Repository<TimeSlotEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Idempotent: finds the active SlotTemplate for the company, generates
   * time-slot rows for that date, inserts with INSERT … ON CONFLICT DO NOTHING.
   * Returns all slots for the requested date.
   */
  async generateForDate(companyId: string, date: string): Promise<TimeSlotEntity[]> {
    // Find the active template for this company and date
    const template = await this.templateRepo
      .createQueryBuilder('t')
      .where('t.company_id = :companyId', { companyId })
      .andWhere('t.effective_from <= :date', { date })
      .andWhere('(t.effective_to IS NULL OR t.effective_to >= :date)', { date })
      .orderBy('t.effective_from', 'DESC')
      .getOne();

    if (!template) {
      throw new NotFoundException(`No active slot template found for company ${companyId}`);
    }

    // Check if the date's weekday is covered by the weekday mask
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // Mask bits: Mon=1 Tue=2 Wed=4 Thu=8 Fri=16 Sat=32 Sun=64
    const dayJs = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
    const maskBit = dayJs === 0 ? 64 : 1 << (dayJs - 1);
    if ((template.weekdayMask & maskBit) === 0) {
      // Day not in schedule — return empty (no slots to generate)
      return [];
    }

    // Generate slot intervals
    const [openHour, openMin] = template.openTime.split(':').map(Number);
    const [closeHour, closeMin] = template.closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const duration = template.slotDurationMinutes;

    const slotsToInsert: Array<{
      company_id: string;
      slot_start_at: Date;
      slot_end_at: Date;
      capacity_total: number;
      capacity_remaining: number;
    }> = [];

    for (let cursor = openMinutes; cursor + duration <= closeMinutes; cursor += duration) {
      const startH = Math.floor(cursor / 60).toString().padStart(2, '0');
      const startM = (cursor % 60).toString().padStart(2, '0');
      const endCursor = cursor + duration;
      const endH = Math.floor(endCursor / 60).toString().padStart(2, '0');
      const endM = (endCursor % 60).toString().padStart(2, '0');

      slotsToInsert.push({
        company_id: companyId,
        slot_start_at: new Date(`${date}T${startH}:${startM}:00+00:00`),
        slot_end_at: new Date(`${date}T${endH}:${endM}:00+00:00`),
        capacity_total: template.capacityPerSlot,
        capacity_remaining: template.capacityPerSlot,
      });
    }

    if (slotsToInsert.length > 0) {
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(TimeSlotEntity)
        .values(
          slotsToInsert.map((s) => ({
            companyId: s.company_id,
            slotStartAt: s.slot_start_at,
            slotEndAt: s.slot_end_at,
            capacityTotal: s.capacity_total,
            capacityRemaining: s.capacity_remaining,
          })),
        )
        .orIgnore()
        .execute();
    }

    // Return all slots for that date
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    return this.slotRepo
      .createQueryBuilder('ts')
      .where('ts.company_id = :companyId', { companyId })
      .andWhere('ts.slot_start_at >= :dayStart', { dayStart })
      .andWhere('ts.slot_start_at <= :dayEnd', { dayEnd })
      .orderBy('ts.slot_start_at', 'ASC')
      .getMany();
  }

  /**
   * Returns available slots (capacity_remaining > 0, slot_start_at in the future)
   * for the given company and date. Generates slots if not yet created.
   */
  async getSlots(companyId: string, date: string): Promise<TimeSlotEntity[]> {
    const now = new Date();

    // Check cache by seeing if any slots already exist for this date
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const existing = await this.slotRepo
      .createQueryBuilder('ts')
      .where('ts.company_id = :companyId', { companyId })
      .andWhere('ts.slot_start_at >= :dayStart', { dayStart })
      .andWhere('ts.slot_start_at <= :dayEnd', { dayEnd })
      .getCount();

    if (existing === 0) {
      // Cache miss — generate slots
      await this.generateForDate(companyId, date);
    }

    return this.slotRepo
      .createQueryBuilder('ts')
      .where('ts.company_id = :companyId', { companyId })
      .andWhere('ts.slot_start_at >= :dayStart', { dayStart })
      .andWhere('ts.slot_start_at <= :dayEnd', { dayEnd })
      .andWhere('ts.capacity_remaining > 0')
      .andWhere('ts.slot_start_at > :now', { now })
      .orderBy('ts.slot_start_at', 'ASC')
      .getMany();
  }

  /**
   * Atomically decrements capacity_remaining for the slot.
   * Returns true if decremented, false if slot is full or not found.
   */
  async decrementCapacity(slotId: string, queryRunner: QueryRunner): Promise<boolean> {
    const result = await queryRunner.query(
      `UPDATE time_slots
       SET capacity_remaining = capacity_remaining - 1
       WHERE id = $1 AND capacity_remaining > 0
       RETURNING id`,
      [slotId],
    );

    return Array.isArray(result) && result.length > 0;
  }
}
