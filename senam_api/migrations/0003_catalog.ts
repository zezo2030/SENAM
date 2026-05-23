import { MigrationInterface, QueryRunner } from 'typeorm';

export class Catalog0003 implements MigrationInterface {
  name = 'Catalog0003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"         UUID    NOT NULL DEFAULT gen_random_uuid(),
        "slug"       CITEXT  NOT NULL,
        "name_ar"    TEXT    NOT NULL,
        "name_en"    TEXT    NULL,
        "icon_key"   TEXT    NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "is_active"  BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "pk_categories" PRIMARY KEY ("id"),
        CONSTRAINT "uq_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "services" (
        "id"                    UUID    NOT NULL DEFAULT gen_random_uuid(),
        "category_id"           UUID    NOT NULL,
        "slug"                  CITEXT  NOT NULL,
        "name_ar"               TEXT    NOT NULL,
        "name_en"               TEXT    NULL,
        "description_ar"        TEXT    NULL,
        "base_duration_minutes" INTEGER NOT NULL DEFAULT 60,
        "is_active"             BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "pk_services" PRIMARY KEY ("id"),
        CONSTRAINT "uq_services_category_slug" UNIQUE ("category_id", "slug"),
        CONSTRAINT "fk_services_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
