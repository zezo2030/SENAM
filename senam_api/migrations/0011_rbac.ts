import { MigrationInterface, QueryRunner } from 'typeorm';

export class Rbac0011 implements MigrationInterface {
  name = 'Rbac0011';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"   UUID  NOT NULL DEFAULT gen_random_uuid(),
        "slug" CITEXT NOT NULL,
        "name" TEXT  NOT NULL,
        CONSTRAINT "pk_roles" PRIMARY KEY ("id"),
        CONSTRAINT "uq_roles_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"          UUID  NOT NULL DEFAULT gen_random_uuid(),
        "slug"        CITEXT NOT NULL,
        "description" TEXT  NULL,
        CONSTRAINT "pk_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_permissions_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id"       UUID NOT NULL,
        "permission_id" UUID NOT NULL,
        CONSTRAINT "pk_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "admin_user_id" UUID NOT NULL,
        "role_id"       UUID NOT NULL,
        CONSTRAINT "pk_user_roles" PRIMARY KEY ("admin_user_id", "role_id"),
        CONSTRAINT "fk_user_roles_admin_user" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "roles" ("slug", "name") VALUES
        ('super_admin',    'Super Admin'),
        ('ops_admin',      'Operations Admin'),
        ('finance_admin',  'Finance Admin'),
        ('support_admin',  'Support Admin')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}
