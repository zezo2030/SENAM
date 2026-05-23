// Apply the 0015_user_password migration directly.
// We bypass the TypeORM CLI because v1.0 rejects the existing project's
// migration naming convention (it requires a JS timestamp suffix while this
// repo uses 0001..0014 sequential suffixes). The schema is what matters; we
// also append a row to the `migrations` table to keep tracking consistent.
require('dotenv').config();
const { Client } = require('pg');

const MIGRATION_NAME = 'UserPassword0015';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query(
      `SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'`,
    );
    if (exists.rowCount === 0) {
      console.log('Adding users.password_hash ...');
      await client.query(`ALTER TABLE "users" ADD COLUMN "password_hash" TEXT NULL`);
    } else {
      console.log('users.password_hash already exists — skipping ALTER.');
    }

    // Try to record the migration in TypeORM's table so future
    // migration:show commands see it. Schema: id serial, timestamp bigint, name varchar.
    try {
      const recorded = await client.query(
        `SELECT 1 FROM "migrations" WHERE "name" = $1`,
        [MIGRATION_NAME],
      );
      if (recorded.rowCount === 0) {
        await client.query(
          `INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`,
          [Date.now(), MIGRATION_NAME],
        );
        console.log('Recorded migration row in "migrations" table.');
      } else {
        console.log('Migration row already present.');
      }
    } catch (e) {
      console.warn(
        'Could not record migration row (table missing or schema differs):',
        e.message,
      );
    }

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
