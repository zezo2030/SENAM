export const QK = {
  me: ['me'] as const,
  admin: {
    companies: (params?: Record<string, unknown>) => ['admin', 'companies', params] as const,
    company: (id: string) => ['admin', 'company', id] as const,
    orders: (params?: Record<string, unknown>) => ['admin', 'orders', params] as const,
    order: (id: string) => ['admin', 'order', id] as const,
    categories: ['admin', 'categories'] as const,
    services: (categoryId?: string) => ['admin', 'services', categoryId] as const,
    coupons: (params?: Record<string, unknown>) => ['admin', 'coupons', params] as const,
    banners: ['admin', 'banners'] as const,
    settlements: (params?: Record<string, unknown>) =>
      ['admin', 'settlements', params] as const,
    reportsSales: (params?: Record<string, unknown>) =>
      ['admin', 'reports', 'sales', params] as const,
    audit: (params?: Record<string, unknown>) => ['admin', 'audit', params] as const,
    users: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
    user: (id: string) => ['admin', 'user', id] as const,
  },
  provider: {
    company: ['provider', 'company'] as const,
    financials: (params?: Record<string, unknown>) =>
      ['provider', 'financials', params] as const,
    staff: ['provider', 'staff'] as const,
    orders: (params?: Record<string, unknown>) => ['provider', 'orders', params] as const,
    settlements: (params?: Record<string, unknown>) =>
      ['provider', 'settlements', params] as const,
  },
} as const;
