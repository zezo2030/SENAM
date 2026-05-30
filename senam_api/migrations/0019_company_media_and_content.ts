import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the fields required for the company-managed public page on the mobile app:
 * - cover_object_key: hero image at the top of the company detail screen
 * - latitude / longitude / map_url: powers the "Location" action pill
 * - features:           JSONB array [{ ar, en, icon? }] — مميزات الشركة chips
 * - gallery_categories: JSONB array [{ id, ar, en, sortOrder }] — owner-defined
 *                       gallery filter pills (e.g. "مطابخ حديثة", "كلاسيك").
 */
export class CompanyMediaAndContent0019 implements MigrationInterface {
  name = 'CompanyMediaAndContent0019';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD COLUMN IF NOT EXISTS "cover_object_key"    TEXT          NULL,
        ADD COLUMN IF NOT EXISTS "latitude"            NUMERIC(9,6)  NULL,
        ADD COLUMN IF NOT EXISTS "longitude"           NUMERIC(9,6)  NULL,
        ADD COLUMN IF NOT EXISTS "map_url"             TEXT          NULL,
        ADD COLUMN IF NOT EXISTS "features"            JSONB         NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "gallery_categories"  JSONB         NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP COLUMN IF EXISTS "gallery_categories",
        DROP COLUMN IF EXISTS "features",
        DROP COLUMN IF EXISTS "map_url",
        DROP COLUMN IF EXISTS "longitude",
        DROP COLUMN IF EXISTS "latitude",
        DROP COLUMN IF EXISTS "cover_object_key"
    `);
  }
}
