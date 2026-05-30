import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the now-unused `base_duration_minutes` column from `services`,
 * and adds `icon_key` + `image_key` columns so admins can upload an icon and
 * a banner image per service from the dashboard.
 */
export class ServiceIconImage0017 implements MigrationInterface {
  name = 'ServiceIconImage0017';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
        ADD COLUMN IF NOT EXISTS "icon_key"  TEXT NULL,
        ADD COLUMN IF NOT EXISTS "image_key" TEXT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "services"
        DROP COLUMN IF EXISTS "base_duration_minutes"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
        ADD COLUMN IF NOT EXISTS "base_duration_minutes" INTEGER NOT NULL DEFAULT 60
    `);
    await queryRunner.query(`
      ALTER TABLE "services"
        DROP COLUMN IF EXISTS "image_key",
        DROP COLUMN IF EXISTS "icon_key"
    `);
  }
}
