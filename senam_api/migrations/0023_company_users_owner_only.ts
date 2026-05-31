import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Companies no longer have staff (the marketplace dispatch flow is gone).
 * Each company has exactly one owner login. Staff rows are removed and the
 * role constraint is narrowed to 'owner'. Order-related metric columns on
 * company_users are dropped since there are no orders.
 */
export class CompanyUsersOwnerOnly1750000000023 implements MigrationInterface {
  name = 'CompanyUsersOwnerOnly1750000000023';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "company_users" WHERE "role" <> 'owner'`);

    await queryRunner.query(`
      ALTER TABLE "company_users"
        DROP CONSTRAINT IF EXISTS "ck_company_users_role"
    `);
    await queryRunner.query(`
      ALTER TABLE "company_users"
        ADD CONSTRAINT "ck_company_users_role" CHECK ("role" = 'owner')
    `);

    await queryRunner.query(`
      ALTER TABLE "company_users"
        DROP COLUMN IF EXISTS "rating_avg",
        DROP COLUMN IF EXISTS "rating_count",
        DROP COLUMN IF EXISTS "completed_orders_count"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_users"
        ADD COLUMN IF NOT EXISTS "rating_avg"             NUMERIC(3,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "rating_count"           INTEGER      NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "completed_orders_count" INTEGER      NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "company_users"
        DROP CONSTRAINT IF EXISTS "ck_company_users_role"
    `);
    await queryRunner.query(`
      ALTER TABLE "company_users"
        ADD CONSTRAINT "ck_company_users_role" CHECK ("role" IN ('owner', 'staff'))
    `);
  }
}
