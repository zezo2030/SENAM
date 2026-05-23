import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';
import type { Settlement } from './admin-settlements.api';

type ListResponse<T> = T[] | { data: T[]; total?: number };

export function useProviderSettlements(params?: { page?: number; limit?: number }) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.provider.settlements(queryParams),
    queryFn: () => {
      const usp = new URLSearchParams();
      if (params?.page) usp.set('page', String(params.page));
      if (params?.limit) usp.set('limit', String(params.limit));
      const qs = usp.toString() ? `?${usp.toString()}` : '';
      return api.get<ListResponse<Settlement>>(`${EP.provider.settlements}${qs}`);
    },
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}
