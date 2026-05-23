import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';
import type { CouponKind } from '@/types/domain';

export type CouponScope = 'all' | 'category' | 'company' | 'service';

export interface Coupon {
  id: string;
  code: string;
  kind: CouponKind;
  /** For `percent`: BPS (10% = 1000). For `fixed`: minor units. */
  value: number;
  minOrderMinor?: number | string | null;
  scope?: CouponScope;
  scopeCategoryId?: string | null;
  scopeCompanyId?: string | null;
  scopeServiceId?: string | null;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  usedCount?: number;
  validFrom?: string | null;
  validTo?: string | null;
  active?: boolean;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

type CouponsResponse = PaginatedResponse<Coupon> | Coupon[];

export interface CouponsParams {
  page?: number;
  limit?: number;
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

export function useCoupons(params?: CouponsParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.coupons(queryParams),
    queryFn: () =>
      api.get<CouponsResponse>(`${EP.admin.coupons}${buildQuery(queryParams)}`),
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Coupon>) =>
      api.post<Coupon>(EP.admin.coupons, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Coupon> & { id: string }) =>
      api.patch<Coupon>(EP.admin.coupon(id), patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(EP.admin.coupon(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}
