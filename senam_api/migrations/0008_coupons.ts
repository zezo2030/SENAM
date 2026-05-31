import { MigrationInterface, QueryRunner } from 'typeorm';

export class CouponUsages1750000000008 implements MigrationInterface {
  name = 'CouponUsages1750000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "coupon_usages" (
        "coupon_id"  UUID        NOT NULL,
        "user_id"    UUID        NOT NULL,
        "order_id"   UUID        NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_coupon_usages" PRIMARY KEY ("coupon_id", "order_id"),
        CONSTRAINT "fk_coupon_usages_coupon" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_coupon_usages_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_coupon_usages_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "coupon_usages_coupon_user_idx" ON "coupon_usages"("coupon_id", "user_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "coupon_usages_coupon_user_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupon_usages"`);
  }
}
