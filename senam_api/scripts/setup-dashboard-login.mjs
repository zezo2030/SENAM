import pg from 'pg';
import bcrypt from 'bcrypt';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:203050@127.0.0.1:5432/senam',
});

await client.connect();

await client.query(`
  ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS password_hash TEXT NULL
`);
await client.query(`
  ALTER TABLE company_users
    ADD COLUMN IF NOT EXISTS password_hash TEXT NULL
`);

const hash = await bcrypt.hash('123456', 10);

await client.query(
  `UPDATE admin_users SET password_hash = $1 WHERE email IN ('superadmin@senam.qa', 'opsadmin@senam.qa')`,
  [hash],
);
await client.query(
  `UPDATE company_users SET password_hash = $1 WHERE email = 'owner@nadhif.qa'`,
  [hash],
);

console.log('Dashboard login ready (password: 123456 for seeded accounts)');
await client.end();
