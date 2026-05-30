import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';
import type { CompanyStatus } from '@/types/domain';

export interface AdminCompany {
  id: string;
  legalName?: string;
  displayName?: string;
  slug?: string;
  status: CompanyStatus | string;
  commissionBps?: number;
  ratingAvg?: number | string | null;
  ratingCount?: number;
  createdAt?: string;
  logoObjectKey?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  region?: string | null;
  city?: string | null;
  categoryId?: string | null;
  hasCommercialRegistration?: boolean;
  commercialRegistrationNo?: string | null;
  subscriptionPlan?: 'basic' | 'pro' | 'vip' | null;
  subscriptionPeriod?: 'monthly' | 'annual' | 'promo' | null;
  subscriptionPrice?: number | null;
  [key: string]: unknown;
}

export interface AdminCompanyDetail extends AdminCompany {
  description?: string | null;
  coverObjectKey?: string | null;
  features?: Array<{ ar: string; en: string; icon?: string }>;
  landline?: string | null;
  whatsappLink?: string | null;
  customServiceText?: string | null;
  additionalNotes?: string | null;
  submittedAt?: string;
  approvedAt?: string | null;
  services?: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn?: string | null;
    categoryId: string;
  }>;
  documents?: Array<{ kind: string; objectKey: string }>;
  portfolioPhotos?: Array<{ objectKey: string; sortOrder: number }>;
  owners?: Array<{
    id: string;
    email: string;
    displayName: string | null;
    role: 'owner' | 'staff';
    status: 'active' | 'suspended';
  }>;
}

export interface ListCompaniesParams {
  status?: CompanyStatus | 'all';
  page?: number;
  limit?: number;
  q?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

type CompaniesResponse = PaginatedResponse<AdminCompany> | AdminCompany[];

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

export function useAdminCompanyDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'companies', 'detail', id],
    enabled: Boolean(id),
    queryFn: () => api.get<AdminCompanyDetail>(EP.admin.companyDetail(id!)),
  });
}

export function useAdminCompanies(params?: ListCompaniesParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.companies(queryParams),
    queryFn: () =>
      api.get<CompaniesResponse>(`${EP.admin.companies}${buildQuery(queryParams)}`),
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}

export function useApproveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<AdminCompany>(EP.admin.companyApprove(id), {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}

export function useSuspendCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<AdminCompany>(EP.admin.companySuspend(id), { reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}

export function useUpdateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commissionBps }: { id: string; commissionBps: number }) =>
      api.patch<AdminCompany>(EP.admin.companyCommission(id), { commissionBps }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}

export interface ResetCompanyPasswordResponse {
  updatedCount: number;
  emails: string[];
}

export function useResetCompanyPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.post<ResetCompanyPasswordResponse>(
        EP.admin.companyResetPassword(id),
        { newPassword },
      ),
  });
}
