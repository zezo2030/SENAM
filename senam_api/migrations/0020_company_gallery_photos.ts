import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Owner-managed portfolio gallery shown on the company "designs" screen.
 * `category_id` is the logical id of one of the entries in
 * `companies.gallery_categories` JSONB (no FK — categories are free-form
 * and owner-managed; NULL means "uncategorized").
 */
export class CompanyGalleryPhotos1750000000020 implements MigrationInterface {
  name = 'CompanyGalleryPhotos1750000000020';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_gallery_photos" (
        "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
        "company_id"   UUID         NOT NULL,
        "category_id"  UUID         NULL,
        "object_key"   TEXT         NOT NULL,
        "caption_ar"   TEXT         NULL,
        "caption_en"   TEXT         NULL,
        "sort_order"   INTEGER      NOT NULL DEFAULT 0,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_company_gallery_photos" PRIMARY KEY ("id"),
        CONSTRAINT "fk_company_gallery_photos_company"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_company_gallery_photos_company_cat_sort"
        ON "company_gallery_photos" ("company_id", "category_id", "sort_order")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "ix_company_gallery_photos_company_cat_sort"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_gallery_photos"`);
  }
}
