import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface Category {
  id: string;
  nameAr?: string;
  name_ar?: string;
  nameEn?: string;
  name_en?: string;
  slug?: string;
  iconKey?: string;
  icon_key?: string;
  iconUrl?: string;
  sortOrder?: number;
  sort_order?: number;
  active?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface Service {
  id: string;
  categoryId?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  iconKey?: string;
  imageKey?: string;
  active?: boolean;
  isActive?: boolean;
  descriptionAr?: string;
  descriptionEn?: string;
  [key: string]: unknown;
}

type ListResponse<T> = T[] | { data: T[]; total?: number };

function unwrap<T>(resp: ListResponse<T>): T[] {
  return Array.isArray(resp) ? resp : (resp.data ?? []);
}

/* ---------- Categories ---------- */

export function useCategories() {
  return useQuery({
    queryKey: QK.admin.categories,
    queryFn: () =>
      api.get<ListResponse<Category>>(EP.admin.categories).then(unwrap),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Category>) =>
      api.post<Category>(EP.admin.categories, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.admin.categories });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Category> & { id: string }) =>
      api.patch<Category>(EP.admin.category(id), patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.admin.categories });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(EP.admin.category(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.admin.categories });
    },
  });
}

/* ---------- Services ---------- */

export function useServices(categoryId?: string) {
  return useQuery({
    queryKey: QK.admin.services(categoryId),
    queryFn: () => {
      const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
      return api.get<ListResponse<Service>>(`${EP.admin.services}${qs}`).then(unwrap);
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Service>) =>
      api.post<Service>(EP.admin.services, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Service> & { id: string }) =>
      api.patch<Service>(EP.admin.service(id), patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(EP.admin.service(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
  });
}
