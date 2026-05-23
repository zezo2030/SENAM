import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';
import type { OrderStatus, PaymentMethod } from '@/types/domain';

export interface OrderHistoryEntry {
  status: OrderStatus | string;
  at: string;
  actor?: string;
  reason?: string;
}

export interface AdminOrder {
  id: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  companyId?: string;
  companyName?: string;
  assignedStaffId?: string | null;
  slotId?: string | null;
  scheduledAt?: string | null;
  addressId?: string | null;
  addressLine?: string | null;
  subtotalMinor?: number | string | null;
  discountMinor?: number | string | null;
  totalMinor?: number | string | null;
  commissionMinor?: number | string | null;
  paymentMethod?: PaymentMethod | string;
  status: OrderStatus | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  history?: OrderHistoryEntry[];
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ListOrdersParams {
  status?: OrderStatus | 'all';
  companyId?: string;
  from?: string;
  to?: string;
  q?: string;
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

type OrdersResponse = PaginatedResponse<AdminOrder> | AdminOrder[];

export function useAdminOrders(params?: ListOrdersParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.orders(queryParams),
    queryFn: () => api.get<OrdersResponse>(`${EP.admin.orders}${buildQuery(queryParams)}`),
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: QK.admin.order(id ?? ''),
    queryFn: () => api.get<AdminOrder>(`${EP.admin.orders}/${id}`),
    enabled: !!id,
  });
}

export type InterveneAction = 'cancel' | 'refund' | 'reassign';

export interface IntervenePayload {
  action: InterveneAction;
  reason?: string;
  refundAmountMinor?: number;
  staffId?: string;
}

export function useIntervene(orderId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IntervenePayload) => {
      if (!orderId) throw new Error('orderId required');
      return api.post<AdminOrder>(EP.admin.orderIntervene(orderId), payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (orderId) void qc.invalidateQueries({ queryKey: QK.admin.order(orderId) });
    },
  });
}
