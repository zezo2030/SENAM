import { MigrationInterface, QueryRunner } from 'typeorm';

export class Slots1750000000005 implements MigrationInterface {
  name = 'Slots1750000000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "slot_templates" (
        "id"                    UUID     NOT NULL DEFAULT gen_random_uuid(),
        "company_id"            UUID     NOT NULL,
        "slot_duration_minutes" INTEGER  NOT NULL DEFAULT 60,
        "capacity_per_slot"     INTEGER  NOT NULL DEFAULT 2,
        "weekday_mask"          SMALLINT NOT NULL DEFAULT 125,
        "open_time"             TIME     NOT NULL DEFAULT '08:00',
        "close_time"            TIME     NOT NULL DEFAULT '22:00',
        "effective_from"        DATE     NOT NULL,
        "effective_to"          DATE     NULL,
        CONSTRAINT "pk_slot_templates" PRIMARY KEY ("id"),
        CONSTRAINT "fk_slot_templates_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "time_slots" (
        "id"                 UUID     NOT NULL DEFAULT gen_random_uuid(),
        "company_id"         UUID     NOT NULL,
        "slot_start_at"      TIMESTAMPTZ NOT NULL,
        "slot_end_at"        TIMESTAMPTZ NOT NULL,
        "capacity_total"     SMALLINT NOT NULL,
        "capacity_remaining" SMALLINT NOT NULL,
        CONSTRAINT "pk_time_slots" PRIMARY KEY ("id"),
        CONSTRAINT "uq_time_slots_company_start" UNIQUE ("company_id", "slot_start_at"),
        CONSTRAINT "ck_time_slots_capacity" CHECK (capacity_remaining >= 0 AND capacity_remaining <= capacity_total),
        CONSTRAINT "fk_time_slots_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "time_slots_company_start_idx" ON "time_slots"("company_id", "slot_start_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "time_slots_company_start_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "time_slots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "slot_templates"`);
  }
}
