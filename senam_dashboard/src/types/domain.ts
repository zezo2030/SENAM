export type Principal = 'customer' | 'provider' | 'admin';

export const ADMIN_ROLES = [
  'super_admin',
  'ops_admin',
  'finance_admin',
  'support_admin',
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PROVIDER_ROLES = ['provider_owner', 'provider_staff'] as const;
export type ProviderRole = (typeof PROVIDER_ROLES)[number];

export type Role = AdminRole | ProviderRole;

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'unassignable';

export type SettlementStatus = 'due' | 'provider_owes' | 'paid' | 'void';

export type CompanyStatus = 'pending' | 'active' | 'suspended';

export type PaymentMethod = 'card' | 'applepay' | 'googlepay' | 'cod';

export type CouponKind = 'percent' | 'fixed';

export interface JwtPayload {
  sub: string;
  principal: Principal;
  roles: Role[];
  companyId?: string;
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
