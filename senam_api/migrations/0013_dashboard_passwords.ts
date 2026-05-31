import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardPasswords1750000000013 implements MigrationInterface {
  name = 'DashboardPasswords1750000000013';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admin_users"
        ADD COLUMN "password_hash" TEXT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "company_users"
        ADD COLUMN "password_hash" TEXT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company_users" DROP COLUMN IF EXISTS "password_hash"`);
    await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "password_hash"`);
  }
}
