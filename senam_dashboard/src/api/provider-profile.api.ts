import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { QK } from '@/lib/query-keys';

export interface LocalizedLabel {
  ar: string;
  en: string;
  icon?: string;
}

export interface GalleryCategory {
  id: string;
  ar: string;
  en: string;
  sortOrder: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  captionAr: string | null;
  captionEn: string | null;
  sortOrder: number;
}

export interface CompanyDetail {
  id: string;
  displayName: string;
  legalName: string;
  slug: string;
  description: string | null;
  status: 'pending' | 'active' | 'suspended';
  categoryId: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  contacts: {
    whatsappLink: string | null;
    phone: string | null;
    landline: string | null;
    instagram: string | null;
    email: string | null;
    website: string | null;
  };
  location: {
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    mapUrl: string | null;
  };
  features: LocalizedLabel[];
  galleryCategories: GalleryCategory[];
  gallery: Array<{ categoryId: string | null; photos: GalleryPhoto[] }>;
}

export interface ProviderCatalogService {
  id: string;
  categoryId: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  iconKey: string | null;
  imageKey: string | null;
  selected: boolean;
}

export interface ProviderCatalogCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  services: ProviderCatalogService[];
}

export interface ProviderServiceSelection {
  selectedServiceIds: string[];
  categories: ProviderCatalogCategory[];
}

export interface UpdateCompanyPatch {
  displayName?: string;
  description?: string;
  phone?: string;
  landline?: string;
  whatsappLink?: string;
  instagram?: string;
  website?: string;
  email?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  features?: LocalizedLabel[];
}

// ── Company detail ─────────────────────────────────────────────────────

export function useProviderCompany(enabled = true) {
  return useQuery({
    queryKey: QK.provider.company,
    queryFn: () => api.get<CompanyDetail>(EP.provider.company),
    enabled,
  });
}

export function useUpdateProviderCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateCompanyPatch) =>
      api.patch<CompanyDetail>(EP.provider.company, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

// ── Logo / Cover ───────────────────────────────────────────────────────

export function useProviderServices() {
  return useQuery({
    queryKey: QK.provider.services,
    queryFn: () => api.get<ProviderServiceSelection>(EP.provider.services),
  });
}

export function useUpdateProviderServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceIds: string[]) =>
      api.patch<ProviderServiceSelection>(EP.provider.services, { serviceIds }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.services });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

export function useSetLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (objectKey: string) =>
      api.patch<CompanyDetail>(EP.provider.logo, { objectKey }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

export function useSetCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (objectKey: string) =>
      api.patch<CompanyDetail>(EP.provider.cover, { objectKey }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

// ── Gallery categories ─────────────────────────────────────────────────

export function useGalleryCategories() {
  return useQuery({
    queryKey: QK.provider.galleryCategories,
    queryFn: () => api.get<GalleryCategory[]>(EP.provider.galleryCategories),
  });
}

export function useCreateGalleryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ar: string; en: string; sortOrder?: number }) =>
      api.post<GalleryCategory>(EP.provider.galleryCategories, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.galleryCategories });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

export function useUpdateGalleryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      ar: string;
      en: string;
      sortOrder?: number;
    }) => api.patch<GalleryCategory>(EP.provider.galleryCategory(id), input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.galleryCategories });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

export function useDeleteGalleryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ ok: true }>(EP.provider.galleryCategory(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.provider.galleryCategories });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

// ── Gallery photos ─────────────────────────────────────────────────────

export interface GalleryPhotoRow {
  id: string;
  companyId: string;
  categoryId: string | null;
  objectKey: string;
  captionAr: string | null;
  captionEn: string | null;
  sortOrder: number;
  createdAt: string;
}

export function useGalleryPhotos(categoryId?: string | null) {
  const qs =
    categoryId === undefined
      ? ''
      : `?categoryId=${categoryId === null ? 'null' : categoryId}`;
  return useQuery({
    queryKey: QK.provider.galleryPhotos(categoryId),
    queryFn: () =>
      api.get<GalleryPhotoRow[]>(`${EP.provider.galleryPhotos}${qs}`),
  });
}

export function useCreateGalleryPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      objectKey: string;
      categoryId?: string;
      captionAr?: string;
      captionEn?: string;
      sortOrder?: number;
    }) => api.post<GalleryPhotoRow>(EP.provider.galleryPhotos, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider', 'gallery'] });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

export function useUpdateGalleryPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      categoryId?: string | null;
      captionAr?: string;
      captionEn?: string;
      sortOrder?: number;
    }) => api.patch<GalleryPhotoRow>(EP.provider.galleryPhoto(id), input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider', 'gallery'] });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}

export function useDeleteGalleryPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ ok: true }>(EP.provider.galleryPhoto(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['provider', 'gallery'] });
      void qc.invalidateQueries({ queryKey: QK.provider.company });
    },
  });
}
