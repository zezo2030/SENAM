export const QK = {
  me: ['me'] as const,
  admin: {
    companies: (params?: Record<string, unknown>) => ['admin', 'companies', params] as const,
    company: (id: string) => ['admin', 'company', id] as const,
    categories: ['admin', 'categories'] as const,
    services: (categoryId?: string) => ['admin', 'services', categoryId] as const,
    banners: ['admin', 'banners'] as const,
    reportsDirectory: (params?: Record<string, unknown>) =>
      ['admin', 'reports', 'directory', params] as const,
    audit: (params?: Record<string, unknown>) => ['admin', 'audit', params] as const,
    users: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
    user: (id: string) => ['admin', 'user', id] as const,
  },
  provider: {
    company: ['provider', 'company'] as const,
    services: ['provider', 'services'] as const,
    galleryCategories: ['provider', 'gallery', 'categories'] as const,
    galleryPhotos: (categoryId?: string | null) =>
      ['provider', 'gallery', 'photos', categoryId ?? '__all'] as const,
  },
} as const;
