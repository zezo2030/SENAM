import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { ExtensionsAndUsers0001 } from '../migrations/0001_extensions_and_users.ts';
import { AddressesFavorites0002 } from '../migrations/0002_addresses_favorites.ts';
import { Catalog0003 } from '../migrations/0003_catalog.ts';
import { Companies0004 } from '../migrations/0004_companies.ts';
import { Slots0005 } from '../migrations/0005_slots.ts';
import { Orders0006 } from '../migrations/0006_orders.ts';
import { Payments0007 } from '../migrations/0007_payments.ts';
import { CouponUsages0008 } from '../migrations/0008_coupons.ts';
import { Reviews0009 } from '../migrations/0009_reviews.ts';
import { Notifications0010 } from '../migrations/0010_notifications.ts';
import { Rbac0011 } from '../migrations/0011_rbac.ts';
import { AuditSettlements0012 } from '../migrations/0012_audit_settlements.ts';
import { DashboardPasswords0013 } from '../migrations/0013_dashboard_passwords.ts';

config();

async function main() {
const migrations = [
  new ExtensionsAndUsers0001(),
  new AddressesFavorites0002(),
  new Catalog0003(),
  new Companies0004(),
  new Slots0005(),
  new Orders0006(),
  new Payments0007(),
  new CouponUsages0008(),
  new Reviews0009(),
  new Notifications0010(),
  new Rbac0011(),
  new AuditSettlements0012(),
  new DashboardPasswords0013(),
];

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL']!,
  synchronize: false,
  logging: true,
});

await dataSource.initialize();
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();

for (const migration of migrations) {
  console.log(`Running ${migration.name}...`);
  await migration.up(queryRunner);
  const existing = await queryRunner.query(
    `SELECT 1 FROM migrations WHERE name = $1 LIMIT 1`,
    [migration.name],
  );
  if (!existing.length) {
    await queryRunner.query(
      `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
      [0, migration.name],
    );
  }
}

const passwordHash = await bcrypt.hash('123456', 10);

await queryRunner.query(`
  INSERT INTO admin_users (id, email, display_name, status, password_hash)
  VALUES
    ('00000000-0000-0000-0000-000000000001', 'superadmin@senam.qa', 'Super Admin', 'active', $1),
    ('00000000-0000-0000-0000-000000000002', 'opsadmin@senam.qa', 'Ops Admin', 'active', $1)
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
`, [passwordHash]);

const roles = await queryRunner.query(
  `SELECT id, slug FROM roles WHERE slug IN ('super_admin', 'ops_admin')`,
) as Array<{ id: string; slug: string }>;

for (const role of roles) {
  const adminId =
    role.slug === 'super_admin'
      ? '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000002';
  await queryRunner.query(
    `INSERT INTO user_roles (admin_user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [adminId, role.id],
  );
}

await queryRunner.query(`
  INSERT INTO companies (id, legal_name, display_name, slug, status, commission_bps)
  VALUES ('30000000-0000-0000-0000-000000000001', 'Nadhif Mobile Wash', 'Nadhif', 'nadhif', 'active', 1500)
  ON CONFLICT (slug) DO NOTHING
`);

await queryRunner.query(`
  INSERT INTO company_users (id, company_id, email, display_name, role, status, password_hash)
  VALUES ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'owner@nadhif.qa', 'Nadhif Owner', 'owner', 'active', $1)
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
`, [passwordHash]);

await queryRunner.release();
await dataSource.destroy();

console.log('Database bootstrapped. Dashboard login password: 123456');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
