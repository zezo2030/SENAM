import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCompanyServicePriceDuration0024 implements MigrationInterface {
  name = 'DropCompanyServicePriceDuration0024';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_services"
        DROP COLUMN IF EXISTS "price",
        DROP COLUMN IF EXISTS "duration_minutes"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_services"
        ADD COLUMN IF NOT EXISTS "price" BIGINT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "duration_minutes" INTEGER NOT NULL DEFAULT 60
    `);
  }
}
