import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface Financials {
  grossMinor?: number | string;
  commissionMinor?: number | string;
  payoutMinor?: number | string;
  orderCount?: number;
  accruals?: Array<{
    date: string;
    grossMinor?: number | string;
    commissionMinor?: number | string;
    payoutMinor?: number | string;
    orderCount?: number;
  }>;
  [key: string]: unknown;
}

export interface FinancialsParams {
  from?: string;
  to?: string;
}

export function useFinancials(params?: FinancialsParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.provider.financials(queryParams),
    queryFn: () => {
      const usp = new URLSearchParams();
      if (params?.from) usp.set('from', params.from);
      if (params?.to) usp.set('to', params.to);
      const qs = usp.toString() ? `?${usp.toString()}` : '';
      return api.get<Financials>(`${EP.provider.financials}${qs}`);
    },
  });
}
