import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditSettlements0012 implements MigrationInterface {
  name = 'AuditSettlements0012';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
        "at"             TIMESTAMPTZ NOT NULL DEFAULT now(),
        "actor_kind"     TEXT        NOT NULL,
        "actor_id"       UUID        NULL,
        "action"         TEXT        NOT NULL,
        "target_kind"    TEXT        NULL,
        "target_id"      UUID        NULL,
        "before"         JSONB       NULL,
        "after"          JSONB       NULL,
        "reason"         TEXT        NULL,
        "correlation_id" TEXT        NULL,
        CONSTRAINT "pk_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "ck_audit_logs_actor_kind" CHECK (actor_kind IN ('admin', 'system', 'customer', 'provider'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "audit_logs_target_idx" ON "audit_logs"("target_kind", "target_id", "at" DESC)`);

    await queryRunner.query(`
      CREATE TABLE "settlements" (
        "id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
        "company_id"           UUID        NOT NULL,
        "window_start"         TIMESTAMPTZ NOT NULL,
        "window_end"           TIMESTAMPTZ NOT NULL,
        "opening_carry_forward" BIGINT     NOT NULL DEFAULT 0,
        "gross_online"         BIGINT      NOT NULL,
        "commission_online"    BIGINT      NOT NULL,
        "refunds_in_window"    BIGINT      NOT NULL,
        "commission_cod"       BIGINT      NOT NULL,
        "net_amount"           BIGINT      NOT NULL,
        "status"               TEXT        NOT NULL,
        "payout_reference"     TEXT        NULL,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_settlements" PRIMARY KEY ("id"),
        CONSTRAINT "uq_settlements_company_window" UNIQUE ("company_id", "window_start"),
        CONSTRAINT "ck_settlements_status" CHECK (status IN ('due', 'provider_owes', 'paid', 'void')),
        CONSTRAINT "fk_settlements_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "settlement_lines" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "settlement_id" UUID        NOT NULL,
        "kind"          TEXT        NOT NULL,
        "reference_id"  UUID        NOT NULL,
        "amount"        BIGINT      NOT NULL,
        "description"   TEXT        NULL,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_settlement_lines" PRIMARY KEY ("id"),
        CONSTRAINT "fk_settlement_lines_settlement" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "commission_accruals"
        ADD CONSTRAINT "fk_commission_accruals_settlement"
          FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "commission_accruals" DROP CONSTRAINT IF EXISTS "fk_commission_accruals_settlement"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settlement_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settlements"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "audit_logs_target_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
