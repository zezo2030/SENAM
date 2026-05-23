import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';
import type { AdminOrder } from './admin-orders.api';
import type { OrderStatus } from '@/types/domain';

export type ProviderOrder = AdminOrder;

export interface ProviderOrdersParams {
  status?: OrderStatus | OrderStatus[] | 'all';
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue;
    if (Array.isArray(v)) usp.set(k, v.join(','));
    else usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export function useProviderOrders(params?: ProviderOrdersParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.provider.orders(queryParams),
    queryFn: () =>
      api.get<PaginatedResponse<ProviderOrder> | ProviderOrder[]>(
        `${EP.provider.orders}${buildQuery(queryParams)}`,
      ),
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}

export function useProviderOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['provider', 'order', id ?? ''],
    queryFn: () => api.get<ProviderOrder>(EP.bookings.one(id ?? '')),
    enabled: !!id,
  });
}

/* ---------- Status transitions (provider acts on bookings) ---------- */

const NEXT_STATUS: Record<string, OrderStatus | null> = {
  pending: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'arrived',
  arrived: 'in_progress',
  in_progress: 'completed',
  completed: null,
  cancelled: null,
  unassignable: null,
};

export function nextStatus(s: string): OrderStatus | null {
  return NEXT_STATUS[s] ?? null;
}

export function useTransitionStatus(orderId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ to }: { to: OrderStatus }) => {
      if (!orderId) throw new Error('orderId required');
      return api.post<ProviderOrder>(EP.bookings.status(orderId), { to });
    },
    // Optimistic: bump local cache to the new status, roll back on error.
    onMutate: async ({ to }) => {
      if (!orderId) return undefined;
      const key = ['provider', 'order', orderId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ProviderOrder>(key);
      if (prev) qc.setQueryData<ProviderOrder>(key, { ...prev, status: to });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (orderId && ctx?.prev) qc.setQueryData(['provider', 'order', orderId], ctx.prev);
    },
    onSettled: () => {
      if (orderId) void qc.invalidateQueries({ queryKey: ['provider', 'order', orderId] });
      void qc.invalidateQueries({ queryKey: ['provider', 'orders'] });
    },
  });
}

/* ---------- Assign staff (provider-owner endpoint) ---------- */

export function useAssignStaff(orderId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId }: { staffId: string }) => {
      if (!orderId) throw new Error('orderId required');
      return api.post<ProviderOrder>(EP.provider.orderAssign(orderId), { staffId });
    },
    onSuccess: () => {
      if (orderId) void qc.invalidateQueries({ queryKey: ['provider', 'order', orderId] });
      void qc.invalidateQueries({ queryKey: ['provider', 'orders'] });
    },
  });
}

export type ProviderApiError = ApiError;
