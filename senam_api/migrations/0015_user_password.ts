import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPassword1750000000015 implements MigrationInterface {
  name = 'UserPassword1750000000015';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_hash" TEXT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`);
  }
}
