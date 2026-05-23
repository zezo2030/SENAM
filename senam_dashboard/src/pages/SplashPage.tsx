import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export default function SplashPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.principal === 'provider') return <Navigate to="/provider/overview" replace />;
  if (user) return <Navigate to="/admin/overview" replace />;
  return <Navigate to="/login" replace />;
}
