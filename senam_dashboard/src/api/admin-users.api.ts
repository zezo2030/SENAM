import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export type AdminUserStatus = 'active' | 'banned' | 'deleted';

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string | null;
  phone?: string | null;
  locale?: string;
  status: AdminUserStatus | string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  // Raw snake_case fallbacks (the backend returns raw rows)
  display_name?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  [key: string]: unknown;
}

export interface ListUsersParams {
  status?: AdminUserStatus | 'all';
  q?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

type UsersResponse = PaginatedResponse<AdminUser> | AdminUser[];

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

function normalise(u: AdminUser): AdminUser {
  return {
    ...u,
    displayName: u.displayName ?? u.display_name ?? null,
    emailVerifiedAt: u.emailVerifiedAt ?? u.email_verified_at ?? null,
    createdAt: u.createdAt ?? u.created_at,
    updatedAt: u.updatedAt ?? u.updated_at,
    deletedAt: u.deletedAt ?? u.deleted_at ?? null,
  };
}

export function useAdminUsers(params?: ListUsersParams) {
  const queryParams = params as Record<string, unknown> | undefined;
  return useQuery({
    queryKey: QK.admin.users(queryParams),
    queryFn: () =>
      api.get<UsersResponse>(`${EP.admin.users}${buildQuery(queryParams)}`),
    select: (resp) => {
      const list = Array.isArray(resp) ? resp : resp.data ?? [];
      const total = Array.isArray(resp)
        ? resp.length
        : resp.total ?? resp.data?.length ?? 0;
      return { data: list.map(normalise), total };
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'active' | 'banned';
      reason?: string;
    }) =>
      api.patch<AdminUser>(EP.admin.userStatus(id), {
        status,
        ...(reason ? { reason } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(EP.admin.user(id), { responseType: 'void' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
