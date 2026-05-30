// Seeds the main categories and their sub-services for SENAM.
// Idempotent: re-running updates names/sort order but never touches icon_key
// (so logos uploaded from the dashboard are preserved) or is_active.
//
// Run with: node scripts/seed-categories.mjs
// Requires DATABASE_URL in env (same as other scripts).

import 'dotenv/config';
import { DataSource } from 'typeorm';

const CATEGORIES = [
  {
    slug: 'finishing-decor',
    nameAr: 'التشطيب والديكور',
    nameEn: 'Finishing & Decor',
    services: [
      { slug: 'painting',            nameAr: 'صبغ',          nameEn: 'Painting' },
      { slug: 'gypsum-board',        nameAr: 'جبس بورد',     nameEn: 'Gypsum Board' },
      { slug: 'wallpaper',           nameAr: 'ورق جدران',    nameEn: 'Wallpaper' },
      { slug: 'marble-alternative',  nameAr: 'بديل رخام',    nameEn: 'Marble Alternative' },
      { slug: 'interior-decor',      nameAr: 'ديكور داخلي',  nameEn: 'Interior Decor' },
      { slug: 'lighting',            nameAr: 'إضاءة',        nameEn: 'Lighting' },
    ],
  },
  {
    slug: 'kitchens-furniture',
    nameAr: 'المطابخ والأثاث',
    nameEn: 'Kitchens & Furniture',
    services: [
      { slug: 'kitchens',          nameAr: 'مطابخ',        nameEn: 'Kitchens' },
      { slug: 'wardrobes',         nameAr: 'خزائن',        nameEn: 'Wardrobes' },
      { slug: 'custom-furniture',  nameAr: 'تفصيل أثاث',   nameEn: 'Custom Furniture' },
      { slug: 'tables',            nameAr: 'طاولات',       nameEn: 'Tables' },
      { slug: 'bedrooms',          nameAr: 'غرف نوم',      nameEn: 'Bedrooms' },
    ],
  },
  {
    slug: 'maintenance',
    nameAr: 'الصيانة',
    nameEn: 'Maintenance',
    services: [
      { slug: 'electrician',         nameAr: 'كهربائي',       nameEn: 'Electrician' },
      { slug: 'plumber',             nameAr: 'سباك',          nameEn: 'Plumber' },
      { slug: 'ac',                  nameAr: 'تكييف',         nameEn: 'AC' },
      { slug: 'general-maintenance', nameAr: 'صيانة عامة',    nameEn: 'General Maintenance' },
      { slug: 'appliance-repair',    nameAr: 'صيانة أجهزة',   nameEn: 'Appliance Repair' },
    ],
  },
  {
    slug: 'cleaning',
    nameAr: 'التنظيف',
    nameEn: 'Cleaning',
    services: [
      { slug: 'home-cleaning',   nameAr: 'تنظيف منازل',  nameEn: 'Home Cleaning' },
      { slug: 'sofa-cleaning',   nameAr: 'تنظيف كنب',    nameEn: 'Sofa Cleaning' },
      { slug: 'carpet-cleaning', nameAr: 'تنظيف سجاد',   nameEn: 'Carpet Cleaning' },
      { slug: 'tank-cleaning',   nameAr: 'تنظيف خزانات', nameEn: 'Tank Cleaning' },
      { slug: 'pest-control',    nameAr: 'مكافحة حشرات', nameEn: 'Pest Control' },
    ],
  },
  {
    slug: 'outdoor-gardens',
    nameAr: 'الخارجية والحدائق',
    nameEn: 'Outdoor & Gardens',
    services: [
      { slug: 'landscaping',         nameAr: 'تنسيق حدائق',   nameEn: 'Landscaping' },
      { slug: 'awnings',             nameAr: 'مظلات',         nameEn: 'Awnings' },
      { slug: 'fences',              nameAr: 'سواتر',         nameEn: 'Fences' },
      { slug: 'outdoor-seating',     nameAr: 'جلسات خارجية',  nameEn: 'Outdoor Seating' },
      { slug: 'waterfalls-fountains', nameAr: 'شلالات ونوافير', nameEn: 'Waterfalls & Fountains' },
    ],
  },
  {
    slug: 'construction-renovation',
    nameAr: 'البناء والترميم',
    nameEn: 'Construction & Renovation',
    services: [
      { slug: 'renovation',        nameAr: 'ترميم',        nameEn: 'Renovation' },
      { slug: 'demolition',        nameAr: 'تكسير',        nameEn: 'Demolition' },
      { slug: 'tile-installation', nameAr: 'تركيب بلاط',   nameEn: 'Tile Installation' },
      { slug: 'insulation',        nameAr: 'عزل',          nameEn: 'Insulation' },
      { slug: 'facades',           nameAr: 'واجهات',       nameEn: 'Facades' },
    ],
  },
  {
    slug: 'cars-quick-services',
    nameAr: 'السيارات والخدمات السريعة',
    nameEn: 'Cars & Quick Services',
    services: [
      { slug: 'car-wash',        nameAr: 'غسيل سيارات',  nameEn: 'Car Wash' },
      { slug: 'polish',          nameAr: 'بوليش',        nameEn: 'Polish' },
      { slug: 'buffing',         nameAr: 'تلميع',        nameEn: 'Buffing' },
      { slug: 'mobile-cleaning', nameAr: 'تنظيف متنقل',  nameEn: 'Mobile Cleaning' },
    ],
  },
];

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
});

await dataSource.initialize();
const qr = dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();

try {
  let categoryIndex = 0;
  for (const cat of CATEGORIES) {
    categoryIndex += 1;
    const sortOrder = categoryIndex * 10;

    const [{ id: categoryId }] = await qr.query(
      `INSERT INTO categories (slug, name_ar, name_en, sort_order, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (slug) DO UPDATE
         SET name_ar = EXCLUDED.name_ar,
             name_en = EXCLUDED.name_en,
             sort_order = EXCLUDED.sort_order
       RETURNING id`,
      [cat.slug, cat.nameAr, cat.nameEn, sortOrder],
    );

    console.log(`Category: ${cat.nameAr} (${cat.slug}) -> ${categoryId}`);

    for (const svc of cat.services) {
      await qr.query(
        `INSERT INTO services (category_id, slug, name_ar, name_en, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (category_id, slug) DO UPDATE
           SET name_ar = EXCLUDED.name_ar,
               name_en = EXCLUDED.name_en`,
        [categoryId, svc.slug, svc.nameAr, svc.nameEn],
      );
      console.log(`   - ${svc.nameAr} (${svc.slug})`);
    }
  }

  await qr.commitTransaction();
  console.log('\nCategories & services seeded successfully.');
} catch (err) {
  await qr.rollbackTransaction();
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await qr.release();
  await dataSource.destroy();
}
