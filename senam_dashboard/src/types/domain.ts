export type Principal = 'customer' | 'provider' | 'admin';

export const ADMIN_ROLES = [
  'super_admin',
  'ops_admin',
  'finance_admin',
  'support_admin',
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PROVIDER_ROLES = ['provider_owner'] as const;
export type ProviderRole = (typeof PROVIDER_ROLES)[number];

export type Role = AdminRole | ProviderRole;

export type CompanyStatus = 'pending' | 'active' | 'suspended';

export interface JwtPayload {
  sub: string;
  principal: Principal;
  roles: Role[];
  companyId?: string;
  name?: string;
  email?: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorEnvelope {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}
