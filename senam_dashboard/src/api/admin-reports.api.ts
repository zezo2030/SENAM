import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface SalesBucket {
  date: string;
  grossMinor?: number | string;
  orderCount?: number;
  commissionMinor?: number | string;
}

export interface SalesReport {
  gmvMinor?: number | string;
  orderCount?: number;
  commissionMinor?: number | string;
  avgOrderMinor?: number | string;
  buckets?: SalesBucket[];
  [key: string]: unknown;
}

export interface SalesParams {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
  categoryId?: string;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export function useSalesReport(params?: SalesParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.reportsSales(queryParams),
    queryFn: () =>
      api.get<SalesReport>(`${EP.admin.reportsSales}${buildQuery(queryParams)}`),
  });
}
