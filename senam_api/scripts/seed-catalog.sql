-- SENAM catalog seed (categories + services)
-- Generated from the current database on 2026-05-31.
-- Idempotent: safe to run multiple times. Run with:
--   psql "$DATABASE_URL" -f scripts/seed-catalog.sql
-- Note: icon_key / image_key are intentionally left untouched so dashboard-uploaded logos are preserved.

BEGIN;

-- Categories
INSERT INTO categories (id, slug, name_ar, name_en, sort_order, is_active) VALUES
  ('52cbefaf-5a63-4987-9af9-8b65676d6cff', 'work-home', 'المشاريع المنزليه', 'Home Projects', 0, true),
  ('42587df5-5639-4004-a80e-29db88d53c1a', 'finishing-decor', 'التشطيب والديكور', 'Finishing & Decor', 10, true),
  ('df9c7dcd-2058-4d16-99da-7db83af3a6f5', 'kitchens-furniture', 'المطابخ والأثاث', 'Kitchens & Furniture', 20, true),
  ('b4255447-57c4-40da-9e79-4a1da819447f', 'maintenance', 'الصيانة', 'Maintenance', 30, true),
  ('1fb982a8-5ecc-49d6-809e-fef2cd2c5f5a', 'cleaning', 'التنظيف', 'Cleaning', 40, true),
  ('f4c52029-ea80-4f89-b414-41260f872207', 'outdoor-gardens', 'الخارجية والحدائق', 'Outdoor & Gardens', 50, true),
  ('3debed0e-d6f3-46d8-8ddd-092f6c05df6a', 'construction-renovation', 'البناء والترميم', 'Construction & Renovation', 60, true),
  ('dc9bd8cb-e80c-4c47-8b83-87dc811dcebd', 'cars-quick-services', 'السيارات والخدمات السريعة', 'Cars & Quick Services', 70, true)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Services
INSERT INTO services (id, category_id, slug, name_ar, name_en, description_ar, is_active) VALUES
  -- المشاريع المنزليه
  ('75d2a9dc-c6a5-472b-aed5-a7a4cdea02b6', '52cbefaf-5a63-4987-9af9-8b65676d6cff', 'project-management', 'إدارة مشاريع', 'Project Management', NULL, true),
  ('097b403c-f2f3-4060-b7d5-90889c937dc9', '52cbefaf-5a63-4987-9af9-8b65676d6cff', 'home-renovation', 'تجديد منزل', 'Home Renovation', NULL, true),
  ('92cdc0ee-7cfe-44cf-b0bf-e5702a942fc0', '52cbefaf-5a63-4987-9af9-8b65676d6cff', 'full-restoration', 'ترميم شامل', 'Full Restoration', NULL, true),
  ('c5fe853e-4076-42ec-b943-2b70a69d673f', '52cbefaf-5a63-4987-9af9-8b65676d6cff', 'full-finishing', 'تشطيب كامل', 'Full Finishing', NULL, true),
  ('cfa5a0fd-1903-472d-9517-267c7d12010b', '52cbefaf-5a63-4987-9af9-8b65676d6cff', 'design-build', 'تصميم وتنفيذ', 'Design & Build', NULL, true),
  -- التشطيب والديكور
  ('1fc6e391-2630-41c8-b35e-a829c64320ef', '42587df5-5639-4004-a80e-29db88d53c1a', 'lighting', 'إضاءة', 'Lighting', '', true),
  ('8253eb52-99ae-4d36-a928-99d7feb8af9c', '42587df5-5639-4004-a80e-29db88d53c1a', 'marble-alternative', 'بديل رخام', 'Marble Alternative', NULL, true),
  ('cdccfbe3-8619-4837-ad22-a99cb8c44f89', '42587df5-5639-4004-a80e-29db88d53c1a', 'gypsum-board', 'جبس بورد', 'Gypsum Board', NULL, true),
  ('2149c993-fc6f-415d-a047-3b8fe029a1c2', '42587df5-5639-4004-a80e-29db88d53c1a', 'interior-decor', 'ديكور داخلي', 'Interior Decor', NULL, true),
  ('312d547a-87a9-4ee6-aaa5-2127fd385afc', '42587df5-5639-4004-a80e-29db88d53c1a', 'painting', 'صبغ', 'Painting', NULL, true),
  ('0e1fddcb-1df2-4ef0-8dba-bb9e364c7f37', '42587df5-5639-4004-a80e-29db88d53c1a', 'wallpaper', 'ورق جدران', 'Wallpaper', NULL, true),
  -- المطابخ والأثاث
  ('cb843bed-2999-444c-84af-552808b6f7fd', 'df9c7dcd-2058-4d16-99da-7db83af3a6f5', 'custom-furniture', 'تفصيل أثاث', 'Custom Furniture', NULL, true),
  ('5aa1eca9-b324-40dc-9a5a-a90c4d0fbe67', 'df9c7dcd-2058-4d16-99da-7db83af3a6f5', 'wardrobes', 'خزائن', 'Wardrobes', NULL, true),
  ('30a080c0-e9f0-49a2-9783-8a5cb1d2942a', 'df9c7dcd-2058-4d16-99da-7db83af3a6f5', 'tables', 'طاولات', 'Tables', NULL, true),
  ('6715f07f-94a8-4bcf-85d8-e86d303fce8f', 'df9c7dcd-2058-4d16-99da-7db83af3a6f5', 'bedrooms', 'غرف نوم', 'Bedrooms', NULL, true),
  ('bd3986c8-9ab5-4adb-842c-1f47d2c6ba7e', 'df9c7dcd-2058-4d16-99da-7db83af3a6f5', 'kitchens', 'مطابخ', 'Kitchens', NULL, true),
  -- الصيانة
  ('ff5483ad-5716-4289-9f49-9700a28dcf42', 'b4255447-57c4-40da-9e79-4a1da819447f', 'ac', 'تكييف', 'AC', NULL, true),
  ('9c86e18a-35b2-4d24-9e47-8d2f5f2eab6e', 'b4255447-57c4-40da-9e79-4a1da819447f', 'plumber', 'سباك', 'Plumber', NULL, true),
  ('65737884-aba3-415c-862d-b9182f7f7459', 'b4255447-57c4-40da-9e79-4a1da819447f', 'appliance-repair', 'صيانة أجهزة', 'Appliance Repair', NULL, true),
  ('12dece39-faa7-4761-887f-a91fe2ee5479', 'b4255447-57c4-40da-9e79-4a1da819447f', 'general-maintenance', 'صيانة عامة', 'General Maintenance', NULL, true),
  ('ea5111d4-3a78-49ce-9792-adb7c663c371', 'b4255447-57c4-40da-9e79-4a1da819447f', 'electrician', 'كهربائي', 'Electrician', NULL, true),
  -- التنظيف
  ('b4c360c9-e002-49d3-a72d-5a0c26f8857d', '1fb982a8-5ecc-49d6-809e-fef2cd2c5f5a', 'tank-cleaning', 'تنظيف خزانات', 'Tank Cleaning', NULL, true),
  ('5ccf8ec8-a403-4a2e-80bd-dd4f1aa706a4', '1fb982a8-5ecc-49d6-809e-fef2cd2c5f5a', 'carpet-cleaning', 'تنظيف سجاد', 'Carpet Cleaning', NULL, true),
  ('448ae602-caea-4f54-a1c6-0de7f3fa7cc2', '1fb982a8-5ecc-49d6-809e-fef2cd2c5f5a', 'sofa-cleaning', 'تنظيف كنب', 'Sofa Cleaning', NULL, true),
  ('5ca7d8ef-aea5-4eac-82b4-1908ad215168', '1fb982a8-5ecc-49d6-809e-fef2cd2c5f5a', 'home-cleaning', 'تنظيف منازل', 'Home Cleaning', NULL, true),
  ('86b441c6-625f-4155-8a01-d7df258cd963', '1fb982a8-5ecc-49d6-809e-fef2cd2c5f5a', 'pest-control', 'مكافحة حشرات', 'Pest Control', NULL, true),
  -- الخارجية والحدائق
  ('5dc0ffd4-2d6a-4707-9368-4f3d1c0f24ee', 'f4c52029-ea80-4f89-b414-41260f872207', 'landscaping', 'تنسيق حدائق', 'Landscaping', NULL, true),
  ('89155ba3-29bc-4400-bac6-b7771bb59187', 'f4c52029-ea80-4f89-b414-41260f872207', 'outdoor-seating', 'جلسات خارجية', 'Outdoor Seating', NULL, true),
  ('7255a51b-ceea-4c08-985e-c726e188aeb2', 'f4c52029-ea80-4f89-b414-41260f872207', 'fences', 'سواتر', 'Fences', NULL, true),
  ('e1106ad9-5a68-490a-a20c-e0b655f3b4ea', 'f4c52029-ea80-4f89-b414-41260f872207', 'waterfalls-fountains', 'شلالات ونوافير', 'Waterfalls & Fountains', NULL, true),
  ('5a1c0880-d399-4ad0-a67f-2535cb2fb1b7', 'f4c52029-ea80-4f89-b414-41260f872207', 'awnings', 'مظلات', 'Awnings', NULL, true),
  -- البناء والترميم
  ('88f8ce17-2d1f-4f74-97cf-0638b85186fe', '3debed0e-d6f3-46d8-8ddd-092f6c05df6a', 'tile-installation', 'تركيب بلاط', 'Tile Installation', NULL, true),
  ('7552c30b-dbc3-45bd-9f66-21ffe5253f2a', '3debed0e-d6f3-46d8-8ddd-092f6c05df6a', 'renovation', 'ترميم', 'Renovation', NULL, true),
  ('04c4b8f0-2847-4360-a2b4-2786bdfaedd1', '3debed0e-d6f3-46d8-8ddd-092f6c05df6a', 'demolition', 'تكسير', 'Demolition', NULL, true),
  ('487761a2-3840-4925-87b5-a4bc75eead4a', '3debed0e-d6f3-46d8-8ddd-092f6c05df6a', 'insulation', 'عزل', 'Insulation', NULL, true),
  ('b4bfc383-ffff-4c0d-82d8-36d2d6bb5f3f', '3debed0e-d6f3-46d8-8ddd-092f6c05df6a', 'facades', 'واجهات', 'Facades', NULL, true),
  -- السيارات والخدمات السريعة
  ('4443e33c-8fd9-40c4-8386-22f4c8baf23b', 'dc9bd8cb-e80c-4c47-8b83-87dc811dcebd', 'polish', 'بوليش', 'Polish', NULL, true),
  ('e37edd08-8965-4092-b020-57fff24b1908', 'dc9bd8cb-e80c-4c47-8b83-87dc811dcebd', 'buffing', 'تلميع', 'Buffing', NULL, true),
  ('07444be6-20dc-46be-b048-58f35a05675b', 'dc9bd8cb-e80c-4c47-8b83-87dc811dcebd', 'mobile-cleaning', 'تنظيف متنقل', 'Mobile Cleaning', NULL, true),
  ('2489a900-713b-4bdc-ade3-58e5a35944ff', 'dc9bd8cb-e80c-4c47-8b83-87dc811dcebd', 'car-wash', 'غسيل سيارات', 'Car Wash', NULL, true)
ON CONFLICT (category_id, slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  is_active = EXCLUDED.is_active;

COMMIT;
