import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ar, enUS } from 'date-fns/locale';

const DEFAULT_TZ = import.meta.env.VITE_DEFAULT_TZ ?? 'Asia/Qatar';

export function formatMoneyMinor(
  amountMinor: bigint | string | number | null | undefined,
  currency = 'QAR',
  locale?: string,
): string {
  if (amountMinor === null || amountMinor === undefined) return '—';
  const asNumber =
    typeof amountMinor === 'bigint'
      ? Number(amountMinor)
      : typeof amountMinor === 'string'
        ? Number(amountMinor)
        : amountMinor;
  const major = asNumber / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(major);
}

export function formatBps(bps: number | string | null | undefined): string {
  if (bps === null || bps === undefined || bps === '') return '—';
  const n = typeof bps === 'string' ? Number(bps) : bps;
  return `${(n / 100).toFixed(2)}%`;
}

export function formatDateTimeQatar(
  iso: string | Date | null | undefined,
  fmt = 'PPp',
  lang: 'en' | 'ar' = 'en',
): string {
  if (!iso) return '—';
  return formatInTimeZone(iso, DEFAULT_TZ, fmt, {
    locale: lang === 'ar' ? ar : enUS,
  });
}

export function formatDate(
  iso: string | Date | null | undefined,
  fmt = 'PP',
  lang: 'en' | 'ar' = 'en',
): string {
  if (!iso) return '—';
  return format(typeof iso === 'string' ? new Date(iso) : iso, fmt, {
    locale: lang === 'ar' ? ar : enUS,
  });
}
