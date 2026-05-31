import { MigrationInterface, QueryRunner } from 'typeorm';

export class Banners1750000000014 implements MigrationInterface {
  name = 'Banners1750000000014';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "banners" (
        "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
        "title_ar"     TEXT        NOT NULL,
        "title_en"     TEXT        NULL,
        "subtitle_ar"  TEXT        NULL,
        "subtitle_en"  TEXT        NULL,
        "image_url"    TEXT        NOT NULL,
        "link_url"     TEXT        NULL,
        "target_type"  TEXT        NULL,
        "target_id"    TEXT        NULL,
        "sort_order"   INTEGER     NOT NULL DEFAULT 0,
        "is_active"    BOOLEAN     NOT NULL DEFAULT true,
        "starts_at"    TIMESTAMPTZ NULL,
        "ends_at"      TIMESTAMPTZ NULL,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_banners" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_banners_active_sort"
        ON "banners" ("is_active", "sort_order")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_banners_active_sort"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "banners"`);
  }
}
