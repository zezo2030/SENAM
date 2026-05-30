import type { Category, Service } from '@/api/admin-catalog.api';
import type { Lang } from '@/store/ui.store';

function readNameAr(row: { nameAr?: string; name_ar?: string }): string | undefined {
  return row.nameAr ?? row.name_ar;
}

function readNameEn(row: { nameEn?: string; name_en?: string }): string | undefined {
  return row.nameEn ?? row.name_en;
}

export function localizedName(
  row: { nameAr?: string; name_ar?: string; nameEn?: string; name_en?: string },
  lang: Lang,
): string | undefined {
  const ar = readNameAr(row);
  const en = readNameEn(row);
  return lang === 'ar' ? (ar ?? en) : (en ?? ar);
}

export function buildCategoryMap(categories: Category[]): Map<string, Category> {
  const map = new Map<string, Category>();
  for (const c of categories) {
    if (c.id) map.set(String(c.id).toLowerCase(), c);
  }
  return map;
}

export function categoryLabel(
  id: string | undefined,
  categoryById: Map<string, Category>,
  lang: Lang,
): string {
  if (!id) return '—';
  const c = categoryById.get(id.toLowerCase());
  if (!c) return '—';
  return localizedName(c, lang) ?? '—';
}

export function serviceCategoryLabel(
  service: Service,
  categoryById: Map<string, Category>,
  lang: Lang,
): string {
  const joined = {
    nameAr:
      (service.categoryNameAr as string | undefined) ??
      (service.category_name_ar as string | undefined),
    nameEn:
      (service.categoryNameEn as string | undefined) ??
      (service.category_name_en as string | undefined),
  };
  const fromJoin = localizedName(joined, lang);
  if (fromJoin) return fromJoin;

  const categoryId =
    (service.categoryId as string | undefined) ??
    (service.category_id as string | undefined);
  return categoryLabel(categoryId, categoryById, lang);
}
