import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface Banner {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

type RawBanner = {
  id: string;
  title_ar?: string;
  titleAr?: string;
  title_en?: string | null;
  titleEn?: string | null;
  subtitle_ar?: string | null;
  subtitleAr?: string | null;
  subtitle_en?: string | null;
  subtitleEn?: string | null;
  image_url?: string;
  imageUrl?: string;
  link_url?: string | null;
  linkUrl?: string | null;
  target_type?: string | null;
  targetType?: string | null;
  target_id?: string | null;
  targetId?: string | null;
  sort_order?: number;
  sortOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
  starts_at?: string | null;
  startsAt?: string | null;
  ends_at?: string | null;
  endsAt?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

function normalize(raw: RawBanner): Banner {
  return {
    id: raw.id,
    titleAr: raw.titleAr ?? raw.title_ar ?? '',
    titleEn: raw.titleEn ?? raw.title_en ?? null,
    subtitleAr: raw.subtitleAr ?? raw.subtitle_ar ?? null,
    subtitleEn: raw.subtitleEn ?? raw.subtitle_en ?? null,
    imageUrl: raw.imageUrl ?? raw.image_url ?? '',
    linkUrl: raw.linkUrl ?? raw.link_url ?? null,
    targetType: raw.targetType ?? raw.target_type ?? null,
    targetId: raw.targetId ?? raw.target_id ?? null,
    sortOrder: raw.sortOrder ?? raw.sort_order ?? 0,
    isActive: raw.isActive ?? raw.is_active ?? true,
    startsAt: raw.startsAt ?? raw.starts_at ?? null,
    endsAt: raw.endsAt ?? raw.ends_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function useBanners() {
  return useQuery({
    queryKey: QK.admin.banners,
    queryFn: async () => {
      const data = await api.get<RawBanner[]>(EP.admin.banners);
      return (data ?? []).map(normalize);
    },
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Banner>) =>
      api.post<RawBanner>(EP.admin.banners, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.admin.banners });
    },
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Banner> & { id: string }) =>
      api.patch<RawBanner>(EP.admin.banner(id), patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.admin.banners });
    },
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(EP.admin.banner(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.admin.banners });
    },
  });
}
