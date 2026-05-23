import { useAuthStore } from '@/store/auth.store';
import { ADMIN_ROLES, PROVIDER_ROLES, type Role } from '@/types/domain';

export function useRoles() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const principal = user?.principal;

  return {
    roles,
    principal,
    has: (role: Role) => roles.includes(role),
    hasAny: (rs: Role[]) => rs.some((r) => roles.includes(r)),
    isAdmin:
      principal === 'admin' ||
      roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r)),
    isProvider:
      principal === 'provider' ||
      roles.some((r) => (PROVIDER_ROLES as readonly string[]).includes(r)),
  };
}
