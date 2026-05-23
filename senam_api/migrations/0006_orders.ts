import { MigrationInterface, QueryRunner } from 'typeorm';

export class Orders0006 implements MigrationInterface {
  name = 'Orders0006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id"                    UUID        NOT NULL DEFAULT gen_random_uuid(),
        "code"                  CITEXT      NOT NULL,
        "kind"                  TEXT        NOT NULL,
        "value_bps_or_amount"   BIGINT      NOT NULL,
        "min_order_amount"      BIGINT      NOT NULL DEFAULT 0,
        "scope_category_id"     UUID        NULL,
        "scope_company_id"      UUID        NULL,
        "total_cap"             INTEGER     NULL,
        "per_user_cap"          INTEGER     NULL,
        "valid_from"            TIMESTAMPTZ NOT NULL,
        "valid_until"           TIMESTAMPTZ NOT NULL,
        "used_count"            INTEGER     NOT NULL DEFAULT 0,
        "is_active"             BOOLEAN     NOT NULL DEFAULT true,
        CONSTRAINT "pk_coupons" PRIMARY KEY ("id"),
        CONSTRAINT "uq_coupons_code" UNIQUE ("code"),
        CONSTRAINT "ck_coupons_kind" CHECK (kind IN ('percent', 'fixed')),
        CONSTRAINT "fk_coupons_category" FOREIGN KEY ("scope_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_coupons_company" FOREIGN KEY ("scope_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
        "customer_id"       UUID        NOT NULL,
        "company_id"        UUID        NOT NULL,
        "assigned_staff_id" UUID        NULL,
        "slot_id"           UUID        NOT NULL,
        "address_id"        UUID        NOT NULL,
        "subtotal"          BIGINT      NOT NULL,
        "discount"          BIGINT      NOT NULL DEFAULT 0,
        "total"             BIGINT      NOT NULL,
        "commission"        BIGINT      NOT NULL,
        "payment_method"    TEXT        NOT NULL,
        "coupon_id"         UUID        NULL,
        "status"            TEXT        NOT NULL DEFAULT 'pending',
        "dispatch_attempt"  SMALLINT    NOT NULL DEFAULT 1,
        "notes"             TEXT        NULL,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "confirmed_at"      TIMESTAMPTZ NULL,
        "accepted_at"       TIMESTAMPTZ NULL,
        "started_at"        TIMESTAMPTZ NULL,
        "completed_at"      TIMESTAMPTZ NULL,
        "cancelled_at"      TIMESTAMPTZ NULL,
        CONSTRAINT "pk_orders" PRIMARY KEY ("id"),
        CONSTRAINT "ck_orders_status" CHECK (status IN (
          'pending', 'accepted', 'on_the_way', 'arrived', 'in_progress',
          'completed', 'cancelled', 'unassignable'
        )),
        CONSTRAINT "ck_orders_payment_method" CHECK (payment_method IN ('card', 'applepay', 'googlepay', 'cod')),
        CONSTRAINT "fk_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_orders_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_orders_staff" FOREIGN KEY ("assigned_staff_id") REFERENCES "company_users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_orders_slot" FOREIGN KEY ("slot_id") REFERENCES "time_slots"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_orders_address" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_orders_coupon" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "orders_customer_status_idx" ON "orders"("customer_id", "status")`);
    await queryRunner.query(`CREATE INDEX "orders_company_status_idx" ON "orders"("company_id", "status")`);
    await queryRunner.query(`CREATE INDEX "orders_completed_at_idx" ON "orders"("completed_at")`);

    await queryRunner.query(`
      CREATE TABLE "order_status_history" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "order_id"    UUID        NOT NULL,
        "from_status" TEXT        NULL,
        "to_status"   TEXT        NOT NULL,
        "actor_kind"  TEXT        NOT NULL,
        "actor_id"    UUID        NULL,
        "reason"      TEXT        NULL,
        "at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_order_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "order_status_history_order_idx" ON "order_status_history"("order_id", "at" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "order_status_history_order_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_status_history"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "orders_completed_at_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "orders_company_status_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "orders_customer_status_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons"`);
  }
}
