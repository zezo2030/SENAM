import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export type ProviderStaffRole = 'provider_owner' | 'provider_staff';

export interface ProviderStaff {
  id: string;
  displayName?: string;
  email?: string;
  phone?: string | null;
  role?: ProviderStaffRole | 'owner' | 'staff';
  ratingAvg?: number | string | null;
  ratingCount?: number;
  completedOrdersCount?: number;
  active?: boolean;
  status?: 'active' | 'suspended';
  [key: string]: unknown;
}

type ListResponse<T> = T[] | { data: T[]; total?: number };

function unwrap<T>(resp: ListResponse<T>): T[] {
  return Array.isArray(resp) ? resp : (resp.data ?? []);
}

export function useProviderStaff() {
  return useQuery({
    queryKey: QK.provider.staff,
    queryFn: () => api.get<ListResponse<ProviderStaff>>(EP.provider.staff).then(unwrap),
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProviderStaff>) =>
      api.post<ProviderStaff>(EP.provider.staff, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.staff });
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<ProviderStaff> & { id: string }) =>
      api.patch<ProviderStaff>(EP.provider.staffOne(id), patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.staff });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(EP.provider.staffOne(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.staff });
    },
  });
}
