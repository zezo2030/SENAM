import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtensionsAndUsers0001 implements MigrationInterface {
  name = 'ExtensionsAndUsers0001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                 UUID        NOT NULL DEFAULT gen_random_uuid(),
        "email"              CITEXT      NOT NULL,
        "email_verified_at"  TIMESTAMPTZ NULL,
        "display_name"       TEXT        NULL,
        "phone"              TEXT        NULL,
        "locale"             TEXT        NOT NULL DEFAULT 'ar',
        "status"             TEXT        NOT NULL DEFAULT 'active',
        "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"         TIMESTAMPTZ NULL,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "ck_users_status" CHECK (status IN ('active', 'banned', 'deleted'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
