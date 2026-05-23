import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const dataSource = app.get(DataSource);

  console.log('Running seed...');

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Admin users
    await queryRunner.query(`
      INSERT INTO admin_users (id, email, display_name, status, password_hash)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'superadmin@senam.qa', 'Super Admin', 'active', $1),
        ('00000000-0000-0000-0000-000000000002', 'opsadmin@senam.qa', 'Ops Admin', 'active', $1)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [defaultPasswordHash]);

    // Assign roles
    const roles = await queryRunner.query(`SELECT id, slug FROM roles WHERE slug IN ('super_admin', 'ops_admin')`);
    const superAdminRole = roles.find((r: { slug: string }) => r.slug === 'super_admin');
    const opsAdminRole = roles.find((r: { slug: string }) => r.slug === 'ops_admin');

    if (superAdminRole) {
      await queryRunner.query(`
        INSERT INTO user_roles (admin_user_id, role_id) VALUES
          ('00000000-0000-0000-0000-000000000001', '${superAdminRole.id}')
        ON CONFLICT DO NOTHING
      `);
    }
    if (opsAdminRole) {
      await queryRunner.query(`
        INSERT INTO user_roles (admin_user_id, role_id) VALUES
          ('00000000-0000-0000-0000-000000000002', '${opsAdminRole.id}')
        ON CONFLICT DO NOTHING
      `);
    }

    // Categories
    await queryRunner.query(`
      INSERT INTO categories (id, slug, name_ar, name_en, sort_order, is_active)
      VALUES
        ('10000000-0000-0000-0000-000000000001', 'car-wash', 'غسيل السيارات', 'Car Wash', 1, true),
        ('10000000-0000-0000-0000-000000000002', 'detailing', 'التلميع والتشطيب', 'Detailing', 2, true)
      ON CONFLICT (slug) DO NOTHING
    `);

    // Services
    await queryRunner.query(`
      INSERT INTO services (id, category_id, slug, name_ar, name_en, description_ar, base_duration_minutes, is_active)
      VALUES
        ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'external-wash', 'غسيل خارجي', 'External Wash', 'غسيل الجزء الخارجي للسيارة', 60, true),
        ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'full-wash', 'غسيل شامل', 'Full Wash', 'غسيل داخلي وخارجي', 90, true),
        ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'steam-wash', 'غسيل بالبخار', 'Steam Wash', 'غسيل بالبخار الساخن', 60, true),
        ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'interior-detailing', 'تنظيف داخلي عميق', 'Interior Detailing', 'تنظيف وتلميع المقصورة', 120, true),
        ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'full-detailing', 'تشطيب كامل', 'Full Detailing', 'تشطيب شامل داخلي وخارجي', 180, true)
      ON CONFLICT (category_id, slug) DO NOTHING
    `);

    // Companies
    await queryRunner.query(`
      INSERT INTO companies (id, legal_name, display_name, slug, status, commission_bps)
      VALUES
        ('30000000-0000-0000-0000-000000000001', 'نظيف للغسيل المتنقل', 'نظيف', 'nadhif', 'active', 1500),
        ('30000000-0000-0000-0000-000000000002', 'برق لغسيل السيارات', 'برق', 'barq', 'pending', 1500),
        ('30000000-0000-0000-0000-000000000003', 'لمعة لتشطيب السيارات', 'لمعة', 'lumaa', 'suspended', 2000)
      ON CONFLICT (slug) DO NOTHING
    `);

    // Provider owner user for active company
    await queryRunner.query(`
      INSERT INTO company_users (id, company_id, email, display_name, role, status, password_hash)
      VALUES
        ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'owner@nadhif.qa', 'مالك نظيف', 'owner', 'active', $1)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [defaultPasswordHash]);

    // Slot template for active company
    await queryRunner.query(`
      INSERT INTO slot_templates (id, company_id, slot_duration_minutes, capacity_per_slot, weekday_mask, open_time, close_time, effective_from)
      VALUES
        ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 60, 2, 125, '08:00', '22:00', CURRENT_DATE)
      ON CONFLICT DO NOTHING
    `);

    // Customers
    await queryRunner.query(`
      INSERT INTO users (id, email, display_name, locale, status)
      VALUES
        ('60000000-0000-0000-0000-000000000001', 'customer1@test.com', 'Ahmed Al-Doha', 'ar', 'active'),
        ('60000000-0000-0000-0000-000000000002', 'customer2@test.com', 'Sara Al-Doha', 'ar', 'active'),
        ('60000000-0000-0000-0000-000000000003', 'customer3@test.com', 'Mohammed Inside', 'ar', 'active'),
        ('60000000-0000-0000-0000-000000000004', 'customer4@test.com', 'Khalid Test', 'ar', 'active'),
        ('60000000-0000-0000-0000-000000000005', 'outside@test.com', 'Outside Area Customer', 'ar', 'active')
      ON CONFLICT (email) DO NOTHING
    `);

    // Coupons
    await queryRunner.query(`
      INSERT INTO coupons (id, code, kind, value_bps_or_amount, min_order_amount, total_cap, per_user_cap, valid_from, valid_until, is_active)
      VALUES
        ('70000000-0000-0000-0000-000000000001', 'WELCOME10', 'percent', 1000, 5000, 100, 1, now() - interval '1 day', now() + interval '30 days', true),
        ('70000000-0000-0000-0000-000000000002', 'EXPIRED', 'fixed', 2000, 0, NULL, NULL, now() - interval '60 days', now() - interval '30 days', false)
      ON CONFLICT (code) DO NOTHING
    `);

    await queryRunner.commitTransaction();
    console.log('Seed completed successfully.');
    console.log('Dashboard login (dev): password is 123456 for seeded admin/provider accounts.');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Seed failed:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
