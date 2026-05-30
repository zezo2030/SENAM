import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an English description column to `services` so the admin dashboard
 * can persist bilingual descriptions (it already submits `descriptionEn`
 * alongside `descriptionAr`).
 */
export class ServiceDescriptionEn0018 implements MigrationInterface {
  name = 'ServiceDescriptionEn0018';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
        ADD COLUMN IF NOT EXISTS "description_en" TEXT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
        DROP COLUMN IF EXISTS "description_en"
    `);
  }
}
