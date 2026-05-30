import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface DirectoryByDay {
  date: string;
  registrations: number;
  reviews: number;
}

export interface DirectoryReport {
  from: string;
  to: string;
  totalCompanies: number;
  activeCompanies: number;
  pendingCompanies: number;
  totalReviews: number;
  byDay: DirectoryByDay[];
}

export interface DirectoryParams {
  from?: string;
  to?: string;
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

export function useDirectoryReport(params?: DirectoryParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.reportsDirectory(queryParams),
    queryFn: () =>
      api.get<DirectoryReport>(
        `${EP.admin.reportsDirectory}${buildQuery(queryParams)}`,
      ),
  });
}
