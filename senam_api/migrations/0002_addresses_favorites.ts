import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddressesFavorites1750000000002 implements MigrationInterface {
  name = 'AddressesFavorites1750000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"      UUID        NOT NULL,
        "label"        TEXT        NULL,
        "line"         TEXT        NOT NULL,
        "area"         TEXT        NULL,
        "city"         TEXT        NULL,
        "location"     GEOGRAPHY(Point, 4326) NOT NULL,
        "access_notes" TEXT        NULL,
        "is_default"   BOOLEAN     NOT NULL DEFAULT false,
        CONSTRAINT "pk_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "fk_addresses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "user_id"    UUID        NOT NULL,
        "company_id" UUID        NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_favorites" PRIMARY KEY ("user_id", "company_id"),
        CONSTRAINT "fk_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "addresses_user_id_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "addresses"`);
  }
}
