import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import arCommon from '@/locales/ar/common.json';
import enAuth from '@/locales/en/auth.json';
import arAuth from '@/locales/ar/auth.json';
import enAdmin from '@/locales/en/admin.json';
import arAdmin from '@/locales/ar/admin.json';
import enOrders from '@/locales/en/orders.json';
import arOrders from '@/locales/ar/orders.json';
import enAudit from '@/locales/en/audit.json';
import arAudit from '@/locales/ar/audit.json';
import enCatalog from '@/locales/en/catalog.json';
import arCatalog from '@/locales/ar/catalog.json';
import enCoupons from '@/locales/en/coupons.json';
import arCoupons from '@/locales/ar/coupons.json';
import enSettlements from '@/locales/en/settlements.json';
import arSettlements from '@/locales/ar/settlements.json';
import enReports from '@/locales/en/reports.json';
import arReports from '@/locales/ar/reports.json';
import enProvider from '@/locales/en/provider.json';
import arProvider from '@/locales/ar/provider.json';
import enBanners from '@/locales/en/banners.json';
import arBanners from '@/locales/ar/banners.json';

const DEFAULT_LANG = (import.meta.env.VITE_DEFAULT_LOCALE ?? 'en') as 'en' | 'ar';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: DEFAULT_LANG,
    supportedLngs: ['en', 'ar'],
    ns: ['common', 'auth', 'admin', 'orders', 'audit', 'catalog', 'coupons', 'settlements', 'reports', 'provider', 'banners'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'senam.lang',
    },
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        admin: enAdmin,
        orders: enOrders,
        audit: enAudit,
        catalog: enCatalog,
        coupons: enCoupons,
        settlements: enSettlements,
        reports: enReports,
        provider: enProvider,
        banners: enBanners,
      },
      ar: {
        common: arCommon,
        auth: arAuth,
        admin: arAdmin,
        orders: arOrders,
        audit: arAudit,
        catalog: arCatalog,
        coupons: arCoupons,
        settlements: arSettlements,
        reports: arReports,
        provider: arProvider,
        banners: arBanners,
      },
    },
    react: { useSuspense: false },
  });

export function applyDirection(lang: string): void {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}

i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

export { i18n };
