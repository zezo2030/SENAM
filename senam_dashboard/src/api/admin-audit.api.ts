import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface AuditEntry {
  id: string;
  at: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetKind?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  details?: unknown;
  [key: string]: unknown;
}

export interface AuditQuery {
  actorId?: string;
  targetType?: string;
  targetKind?: string;
  targetId?: string;
  action?: string;
  from?: string;
  to?: string;
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
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export function useAuditLogs(params?: AuditQuery) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.audit(queryParams),
    queryFn: () =>
      api.get<PaginatedResponse<AuditEntry> | AuditEntry[]>(
        `${EP.admin.audit}${buildQuery(queryParams)}`,
      ),
    select: (resp) => {
      if (Array.isArray(resp)) return { data: resp, total: resp.length };
      return { data: resp.data ?? [], total: resp.total ?? resp.data?.length ?? 0 };
    },
  });
}
