import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reviews used to be gated on a completed order (one review per order).
 * SENAM is now a directory app; orders no longer flow through the platform,
 * so reviews are by `(company_id, customer_id)` — any authenticated customer
 * can leave one review per company, with a 48h edit window dropped along
 * with the order lock.
 *
 * Removes: order_id, staff_id, rating_staff, locked_at and their FKs.
 * Adds:    UNIQUE (company_id, customer_id).
 *
 * Dedupe before adding the unique index: if a customer happened to have
 * multiple reviews for the same company (multi-order legacy), keep the
 * most recent and discard the rest.
 */
export class DecoupleReviewsFromOrders1750000000021 implements MigrationInterface {
  name = 'DecoupleReviewsFromOrders1750000000021';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Drop FKs that reference tables we're about to remove (orders, company_users.staff).
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "fk_reviews_order"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "fk_reviews_staff"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "uq_reviews_order"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "ck_reviews_rating_staff"`);

    // 2) Dedupe potential (company_id, customer_id) collisions: keep newest.
    await queryRunner.query(`
      DELETE FROM "reviews" r
       USING "reviews" newer
       WHERE r.company_id = newer.company_id
         AND r.customer_id = newer.customer_id
         AND r.created_at  < newer.created_at
    `);

    // 3) Drop columns no longer used.
    await queryRunner.query(`
      ALTER TABLE "reviews"
        DROP COLUMN IF EXISTS "order_id",
        DROP COLUMN IF EXISTS "staff_id",
        DROP COLUMN IF EXISTS "rating_staff",
        DROP COLUMN IF EXISTS "locked_at"
    `);

    // 4) Add the new uniqueness constraint.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ux_reviews_company_customer"
        ON "reviews" ("company_id", "customer_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "ux_reviews_company_customer"`);
    await queryRunner.query(`
      ALTER TABLE "reviews"
        ADD COLUMN IF NOT EXISTS "order_id"     UUID        NULL,
        ADD COLUMN IF NOT EXISTS "staff_id"     UUID        NULL,
        ADD COLUMN IF NOT EXISTS "rating_staff" SMALLINT    NULL,
        ADD COLUMN IF NOT EXISTS "locked_at"    TIMESTAMPTZ NULL
    `);
    // FKs and uq_reviews_order not restored: their referenced tables may be gone.
  }
}
