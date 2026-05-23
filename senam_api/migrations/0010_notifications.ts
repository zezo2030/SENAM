import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications0010 implements MigrationInterface {
  name = 'Notifications0010';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_kind"  TEXT        NOT NULL,
        "user_id"    UUID        NOT NULL,
        "topic"      TEXT        NOT NULL,
        "payload"    JSONB       NULL,
        "channels"   TEXT[]      NOT NULL,
        "state"      TEXT        NOT NULL DEFAULT 'pending',
        "read_at"    TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "ck_notifications_user_kind" CHECK (user_kind IN ('customer', 'company_user', 'admin')),
        CONSTRAINT "ck_notifications_state" CHECK (state IN ('pending', 'sent', 'failed'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "notifications_user_unread_idx"
        ON "notifications"("user_kind", "user_id")
        WHERE read_at IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "notifications_user_unread_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
