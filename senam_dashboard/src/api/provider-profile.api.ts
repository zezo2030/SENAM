import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface ProviderCompany {
  id: string;
  legalName?: string;
  displayName?: string;
  displayNameAr?: string;
  displayNameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  contactEmail?: string;
  phone?: string;
  logoUrl?: string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number;
  status?: 'pending' | 'active' | 'suspended' | string;
  commissionBps?: number;
  [key: string]: unknown;
}

export function useProviderCompany() {
  return useQuery({
    queryKey: QK.provider.company,
    queryFn: () => api.get<ProviderCompany>(EP.provider.company),
  });
}

export function useUpdateProviderCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ProviderCompany>) =>
      api.patch<ProviderCompany>(EP.provider.company, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}
