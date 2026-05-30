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

    // Categories — main service types shown in the "Join as Company" wizard.
    await queryRunner.query(`
      INSERT INTO categories (id, slug, name_ar, name_en, sort_order, is_active)
      VALUES
        ('10000000-0000-0000-0000-000000000001', 'car-wash',            'غسيل سيارات',       'Car Wash',            1,  true),
        ('10000000-0000-0000-0000-000000000002', 'detailing',           'تلميع وتشطيب',      'Detailing',           2,  true),
        ('10000000-0000-0000-0000-000000000003', 'cleaning',            'تنظيف',             'Cleaning',            3,  true),
        ('10000000-0000-0000-0000-000000000004', 'painting',            'صبغ ودهانات',       'Painting',            4,  true),
        ('10000000-0000-0000-0000-000000000005', 'general-maintenance', 'صيانة عامة',        'General Maintenance', 5,  true),
        ('10000000-0000-0000-0000-000000000006', 'electrical',          'كهرباء',            'Electrical',          6,  true),
        ('10000000-0000-0000-0000-000000000007', 'plumbing',            'سباكة',             'Plumbing',            7,  true),
        ('10000000-0000-0000-0000-000000000008', 'carpentry',           'نجارة وأعمال خشبية','Carpentry & Wood',    8,  true),
        ('10000000-0000-0000-0000-000000000009', 'kitchens-furniture',  'مطابخ وأثاث',       'Kitchens & Furniture',9,  true),
        ('10000000-0000-0000-0000-00000000000a', 'car-rental',          'تأجير سيارات',      'Car Rental',          10, true)
      ON CONFLICT (slug) DO NOTHING
    `);

    // Services — at least a few per category so Step 2 (multi-select) has options.
    await queryRunner.query(`
      INSERT INTO services (id, category_id, slug, name_ar, name_en, description_ar, is_active)
      VALUES
        -- Car wash
        ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'external-wash',      'غسيل خارجي',           'External Wash',          'غسيل الجزء الخارجي للسيارة', true),
        ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'full-wash',          'غسيل شامل',            'Full Wash',              'غسيل داخلي وخارجي',          true),
        ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'steam-wash',         'غسيل بالبخار',         'Steam Wash',             'غسيل بالبخار الساخن',        true),
        -- Detailing
        ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'interior-detailing', 'تنظيف داخلي عميق',     'Interior Detailing',     'تنظيف وتلميع المقصورة',      true),
        ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'full-detailing',     'تشطيب كامل',           'Full Detailing',         'تشطيب شامل داخلي وخارجي',    true),
        -- Cleaning
        ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'home-cleaning',      'تنظيف منازل',          'Home Cleaning',          NULL, true),
        ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'office-cleaning',    'تنظيف مكاتب',          'Office Cleaning',        NULL, true),
        ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'deep-cleaning',      'تنظيف عميق',           'Deep Cleaning',          NULL, true),
        -- Painting
        ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', 'interior-painting',  'دهان داخلي',           'Interior Painting',      NULL, true),
        ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000004', 'exterior-painting',  'دهان خارجي',           'Exterior Painting',      NULL, true),
        -- General maintenance
        ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000005', 'ac-maintenance',     'صيانة تكييف',          'AC Maintenance',         NULL, true),
        ('20000000-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000005', 'general-repair',     'إصلاحات عامة',         'General Repair',         NULL, true),
        -- Electrical
        ('20000000-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000006', 'electric-repair',    'إصلاح كهرباء',         'Electric Repair',        NULL, true),
        ('20000000-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000006', 'electric-install',   'تركيب كهربائي',        'Electric Installation',  NULL, true),
        -- Plumbing
        ('20000000-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000007', 'leak-fix',           'إصلاح تسريبات',        'Leak Repair',            NULL, true),
        ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000007', 'pipe-install',       'تمديد مواسير',         'Pipe Installation',      NULL, true),
        -- Carpentry
        ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000008', 'wood-repair',        'إصلاح أعمال خشبية',    'Wood Repair',            NULL, true),
        ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000008', 'wood-install',       'تركيب أعمال خشبية',    'Wood Installation',      NULL, true),
        -- Kitchens & furniture
        ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000009', 'kitchen-install',    'تركيب مطابخ',          'Kitchen Installation',   NULL, true),
        ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000009', 'furniture-assembly', 'تركيب أثاث',           'Furniture Assembly',     NULL, true),
        -- Car rental
        ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-00000000000a', 'daily-rental',       'تأجير يومي',           'Daily Rental',           NULL, true),
        ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-00000000000a', 'monthly-rental',     'تأجير شهري',           'Monthly Rental',         NULL, true)
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
