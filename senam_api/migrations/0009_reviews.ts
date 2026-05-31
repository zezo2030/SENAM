import { MigrationInterface, QueryRunner } from 'typeorm';

export class Reviews1750000000009 implements MigrationInterface {
  name = 'Reviews1750000000009';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
        "order_id"         UUID        NOT NULL,
        "customer_id"      UUID        NOT NULL,
        "company_id"       UUID        NOT NULL,
        "staff_id"         UUID        NULL,
        "rating_company"   SMALLINT    NOT NULL,
        "rating_staff"     SMALLINT    NULL,
        "rating_speed"     SMALLINT    NULL,
        "rating_quality"   SMALLINT    NULL,
        "comment"          TEXT        NULL,
        "photo_object_keys" TEXT[]     NULL,
        "locked_at"        TIMESTAMPTZ NOT NULL,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "uq_reviews_order" UNIQUE ("order_id"),
        CONSTRAINT "ck_reviews_rating_company" CHECK (rating_company BETWEEN 1 AND 5),
        CONSTRAINT "ck_reviews_rating_staff" CHECK (rating_staff IS NULL OR rating_staff BETWEEN 1 AND 5),
        CONSTRAINT "ck_reviews_rating_speed" CHECK (rating_speed IS NULL OR rating_speed BETWEEN 1 AND 5),
        CONSTRAINT "ck_reviews_rating_quality" CHECK (rating_quality IS NULL OR rating_quality BETWEEN 1 AND 5),
        CONSTRAINT "fk_reviews_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_reviews_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_reviews_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_reviews_staff" FOREIGN KEY ("staff_id") REFERENCES "company_users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "review_replies" (
        "review_id"       UUID        NOT NULL,
        "company_user_id" UUID        NOT NULL,
        "body"            TEXT        NOT NULL,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_review_replies" PRIMARY KEY ("review_id"),
        CONSTRAINT "fk_review_replies_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_review_replies_company_user" FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "review_replies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
  }
}
