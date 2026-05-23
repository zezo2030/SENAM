import { MigrationInterface, QueryRunner } from 'typeorm';

export class Companies0004 implements MigrationInterface {
  name = 'Companies0004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
        "email"        CITEXT      NOT NULL,
        "display_name" TEXT        NULL,
        "status"       TEXT        NOT NULL DEFAULT 'active',
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_admin_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_admin_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id"                  UUID           NOT NULL DEFAULT gen_random_uuid(),
        "legal_name"          TEXT           NOT NULL,
        "display_name"        TEXT           NOT NULL,
        "slug"                CITEXT         NULL,
        "description"         TEXT           NULL,
        "logo_object_key"     TEXT           NULL,
        "phone"               TEXT           NULL,
        "status"              TEXT           NOT NULL DEFAULT 'pending',
        "kyc_approved_by"     UUID           NULL,
        "kyc_approved_at"     TIMESTAMPTZ    NULL,
        "commission_bps"      INTEGER        NOT NULL DEFAULT 1500,
        "rating_avg"          NUMERIC(3, 2)  NOT NULL DEFAULT 0,
        "rating_count"        INTEGER        NOT NULL DEFAULT 0,
        "rejection_rate_pct"  NUMERIC(5, 2)  NOT NULL DEFAULT 0,
        "created_at"          TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMPTZ    NOT NULL DEFAULT now(),
        CONSTRAINT "pk_companies" PRIMARY KEY ("id"),
        CONSTRAINT "uq_companies_slug" UNIQUE ("slug"),
        CONSTRAINT "ck_companies_status" CHECK (status IN ('pending', 'active', 'suspended')),
        CONSTRAINT "ck_companies_commission" CHECK (commission_bps BETWEEN 1000 AND 2500),
        CONSTRAINT "fk_companies_kyc_approved_by" FOREIGN KEY ("kyc_approved_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "company_users" (
        "id"                    UUID           NOT NULL DEFAULT gen_random_uuid(),
        "company_id"            UUID           NOT NULL,
        "email"                 CITEXT         NOT NULL,
        "display_name"          TEXT           NULL,
        "role"                  TEXT           NOT NULL,
        "rating_avg"            NUMERIC(3, 2)  NOT NULL DEFAULT 0,
        "rating_count"          INTEGER        NOT NULL DEFAULT 0,
        "completed_orders_count" INTEGER       NOT NULL DEFAULT 0,
        "status"                TEXT           NOT NULL DEFAULT 'active',
        "created_at"            TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMPTZ    NOT NULL DEFAULT now(),
        CONSTRAINT "pk_company_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_company_users_email" UNIQUE ("email"),
        CONSTRAINT "ck_company_users_role" CHECK (role IN ('owner', 'staff')),
        CONSTRAINT "ck_company_users_status" CHECK (status IN ('active', 'suspended')),
        CONSTRAINT "fk_company_users_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "company_documents" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "company_id"  UUID        NOT NULL,
        "kind"        TEXT        NOT NULL,
        "object_key"  TEXT        NOT NULL,
        "verified_by" UUID        NULL,
        "verified_at" TIMESTAMPTZ NULL,
        CONSTRAINT "pk_company_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_company_documents_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_company_documents_admin" FOREIGN KEY ("verified_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "company_service_areas" (
        "company_id" UUID        NOT NULL,
        "area"       GEOGRAPHY(MultiPolygon, 4326) NOT NULL,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_company_service_areas" PRIMARY KEY ("company_id"),
        CONSTRAINT "fk_company_service_areas_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "company_service_areas_area_gist" ON "company_service_areas" USING GIST("area")`);

    await queryRunner.query(`
      CREATE TABLE "company_services" (
        "id"               UUID    NOT NULL DEFAULT gen_random_uuid(),
        "company_id"       UUID    NOT NULL,
        "service_id"       UUID    NOT NULL,
        "price"            BIGINT  NOT NULL,
        "duration_minutes" INTEGER NOT NULL,
        "is_active"        BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "pk_company_services" PRIMARY KEY ("id"),
        CONSTRAINT "uq_company_services" UNIQUE ("company_id", "service_id"),
        CONSTRAINT "fk_company_services_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_company_services_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "favorites"
        ADD CONSTRAINT "fk_favorites_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "fk_favorites_company"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_services"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "company_service_areas_area_gist"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_service_areas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_users"`);
  }
}
