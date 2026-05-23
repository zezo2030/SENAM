import { MigrationInterface, QueryRunner } from 'typeorm';

export class Payments0007 implements MigrationInterface {
  name = 'Payments0007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"                    UUID        NOT NULL DEFAULT gen_random_uuid(),
        "order_id"              UUID        NOT NULL,
        "provider"              TEXT        NOT NULL,
        "provider_payment_id"   TEXT        NOT NULL,
        "amount"                BIGINT      NOT NULL,
        "status"                TEXT        NOT NULL,
        "raw_payload_redacted"  JSONB       NULL,
        "created_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_payments" PRIMARY KEY ("id"),
        CONSTRAINT "ck_payments_status" CHECK (status IN (
          'authorised', 'captured', 'failed', 'refunded', 'partially_refunded'
        )),
        CONSTRAINT "fk_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refunds" (
        "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
        "payment_id"        UUID        NOT NULL,
        "amount"            BIGINT      NOT NULL,
        "reason"            TEXT        NOT NULL,
        "issued_by_kind"    TEXT        NOT NULL,
        "issued_by_id"      UUID        NULL,
        "provider_refund_id" TEXT       NULL,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_refunds" PRIMARY KEY ("id"),
        CONSTRAINT "ck_refunds_issued_by_kind" CHECK (issued_by_kind IN ('system', 'admin')),
        CONSTRAINT "fk_refunds_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "commission_accruals" (
        "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
        "company_id"        UUID        NOT NULL,
        "order_id"          UUID        NOT NULL,
        "kind"              TEXT        NOT NULL,
        "gross_amount"      BIGINT      NOT NULL,
        "commission_amount" BIGINT      NOT NULL,
        "settlement_id"     UUID        NULL,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_commission_accruals" PRIMARY KEY ("id"),
        CONSTRAINT "uq_commission_accruals_order" UNIQUE ("order_id"),
        CONSTRAINT "ck_commission_accruals_kind" CHECK (kind IN ('online', 'cod')),
        CONSTRAINT "fk_commission_accruals_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_commission_accruals_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_accruals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refunds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
  }
}
