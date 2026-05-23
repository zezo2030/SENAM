import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extends the "Join as a Company" application with the full set of fields
 * captured by the 4-step onboarding wizard:
 *   1. Company information (logo, legal/display name, slug, main service type,
 *      commercial registration, contact channels, region/city).
 *   2. Services offered (many-to-many with the catalog) + free-form
 *      "other service" text.
 *   3. Portfolio photos + extra contact channels + notes.
 *   4. Subscription plan + billing period.
 *
 * Implemented as additive ALTERs so existing companies keep working.
 */
export class ProviderApplicationExtensions0016 implements MigrationInterface {
  name = 'ProviderApplicationExtensions0016';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── companies: extra columns ─────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD COLUMN IF NOT EXISTS "category_id"                  UUID    NULL,
        ADD COLUMN IF NOT EXISTS "has_commercial_registration"  BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "commercial_registration_no"   TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "email"                        CITEXT  NULL,
        ADD COLUMN IF NOT EXISTS "website"                      TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "instagram"                    TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "landline"                     TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "whatsapp_link"                TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "region"                       TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "city"                         TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "custom_service_text"          TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "additional_notes"             TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "subscription_plan"            TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "subscription_period"          TEXT    NULL,
        ADD COLUMN IF NOT EXISTS "subscription_price"           BIGINT  NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP CONSTRAINT IF EXISTS "ck_companies_subscription_plan"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD CONSTRAINT "ck_companies_subscription_plan"
        CHECK (subscription_plan IS NULL OR subscription_plan IN ('basic','pro','vip'))
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP CONSTRAINT IF EXISTS "ck_companies_subscription_period"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD CONSTRAINT "ck_companies_subscription_period"
        CHECK (subscription_period IS NULL OR subscription_period IN ('monthly','annual','promo'))
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP CONSTRAINT IF EXISTS "fk_companies_category"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD CONSTRAINT "fk_companies_category"
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    // ── Portfolio photos (Step 3) ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_portfolio_photos" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "company_id"  UUID         NOT NULL,
        "object_key"  TEXT         NOT NULL,
        "sort_order"  INTEGER      NOT NULL DEFAULT 0,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_company_portfolio_photos" PRIMARY KEY ("id"),
        CONSTRAINT "fk_company_portfolio_photos_company"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_company_portfolio_photos_company"
        ON "company_portfolio_photos" ("company_id", "sort_order")
    `);

    // ── Application-time services (Step 2) ───────────────────────────────
    // company_services already exists, but it requires a price + duration
    // (only set once the company is active). For services chosen at
    // application time we use a lightweight pivot table.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_application_services" (
        "company_id"  UUID NOT NULL,
        "service_id"  UUID NOT NULL,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_company_application_services"
          PRIMARY KEY ("company_id", "service_id"),
        CONSTRAINT "fk_company_application_services_company"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_company_application_services_service"
          FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "company_application_services"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "ix_company_portfolio_photos_company"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_portfolio_photos"`);

    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "fk_companies_category"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "ck_companies_subscription_period"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "ck_companies_subscription_plan"`);

    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP COLUMN IF EXISTS "subscription_price",
        DROP COLUMN IF EXISTS "subscription_period",
        DROP COLUMN IF EXISTS "subscription_plan",
        DROP COLUMN IF EXISTS "additional_notes",
        DROP COLUMN IF EXISTS "custom_service_text",
        DROP COLUMN IF EXISTS "city",
        DROP COLUMN IF EXISTS "region",
        DROP COLUMN IF EXISTS "whatsapp_link",
        DROP COLUMN IF EXISTS "landline",
        DROP COLUMN IF EXISTS "instagram",
        DROP COLUMN IF EXISTS "website",
        DROP COLUMN IF EXISTS "email",
        DROP COLUMN IF EXISTS "commercial_registration_no",
        DROP COLUMN IF EXISTS "has_commercial_registration",
        DROP COLUMN IF EXISTS "category_id"
    `);
  }
}
