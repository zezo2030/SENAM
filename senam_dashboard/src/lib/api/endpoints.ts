export const EP = {
  auth: {
    login: '/v1/auth/login',
    otpRequest: '/v1/auth/otp/request',
    otpVerify: '/v1/auth/otp/verify',
    refresh: '/v1/auth/refresh',
    logout: '/v1/auth/logout',
  },
  uploads: {
    presign: '/v1/uploads/presign',
  },
  admin: {
    companies: '/v1/admin/companies',
    companyDetail: (id: string) => `/v1/admin/companies/${id}/detail`,
    companyApprove: (id: string) => `/v1/admin/companies/${id}/approve`,
    companySuspend: (id: string) => `/v1/admin/companies/${id}/suspend`,
    companyCommission: (id: string) => `/v1/admin/companies/${id}/commission`,
    companyResetPassword: (id: string) =>
      `/v1/admin/companies/${id}/reset-password`,
    categories: '/v1/admin/catalog/categories',
    category: (id: string) => `/v1/admin/catalog/categories/${id}`,
    services: '/v1/admin/catalog/services',
    service: (id: string) => `/v1/admin/catalog/services/${id}`,
    banners: '/v1/admin/banners',
    banner: (id: string) => `/v1/admin/banners/${id}`,
    reportsDirectory: '/v1/admin/reports/directory',
    audit: '/v1/admin/audit',
    users: '/v1/admin/users',
    user: (id: string) => `/v1/admin/users/${id}`,
    userStatus: (id: string) => `/v1/admin/users/${id}/status`,
  },
  provider: {
    company: '/v1/provider/me/company',
    services: '/v1/provider/me/company/services',
    logo: '/v1/provider/me/company/logo',
    cover: '/v1/provider/me/company/cover',
    galleryCategories: '/v1/provider/me/company/gallery/categories',
    galleryCategory: (id: string) =>
      `/v1/provider/me/company/gallery/categories/${id}`,
    galleryPhotos: '/v1/provider/me/company/gallery/photos',
    galleryPhoto: (id: string) =>
      `/v1/provider/me/company/gallery/photos/${id}`,
    galleryPhotosReorder: '/v1/provider/me/company/gallery/photos/reorder',
  },
} as const;
