import { Navigate, Outlet } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import type { Role } from '@/types/domain';

export function RoleGuard({ allow }: { allow: readonly Role[] }) {
  const { hasAny } = useRoles();
  if (!hasAny([...allow])) return <Navigate to="/403" replace />;
  return <Outlet />;
}
