import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';
import type { SettlementStatus } from '@/types/domain';

export interface Settlement {
  id: string;
  companyId: string;
  companyName?: string;
  windowStart?: string;
  windowEnd?: string;
  periodStart?: string;
  periodEnd?: string;
  grossOnlineMinor?: number | string | null;
  grossMinor?: number | string | null;
  commissionOnlineMinor?: number | string | null;
  commissionMinor?: number | string | null;
  netAmountMinor?: number | string | null;
  payoutMinor?: number | string | null;
  status: SettlementStatus | string;
  payoutReference?: string | null;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface SettlementsParams {
  status?: SettlementStatus | 'all';
  companyId?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export function useSettlements(params?: SettlementsParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.settlements(queryParams),
    queryFn: () =>
      api.get<PaginatedResponse<Settlement> | Settlement[]>(
        `${EP.admin.settlements}${buildQuery(queryParams)}`,
      ),
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}

export function useApproveSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payoutReference }: { id: string; payoutReference?: string }) =>
      api.post<Settlement>(EP.admin.settlementApprove(id), { payoutReference }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'settlements'] });
    },
  });
}

export function useVoidSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Settlement>(EP.admin.settlementVoid(id), {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'settlements'] });
    },
  });
}
