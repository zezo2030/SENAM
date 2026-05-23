import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authChannel, clearRefresh, saveRefresh } from '@/lib/auth/token-storage';
import { decodeJwt } from '@/lib/auth/jwt';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { loadRefresh } from '@/lib/auth/token-storage';
import type { AuthTokens } from '@/types/domain';

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  const login = useCallback(
    (tokens: AuthTokens) => {
      saveRefresh(tokens.refreshToken);
      const payload = decodeJwt(tokens.accessToken);
      if (!payload) throw new Error('Invalid token received');
      setSession(tokens.accessToken, payload);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = loadRefresh();
    try {
      if (refreshToken) {
        await api.post(EP.auth.logout, { refreshToken }, { skipAuthRetry: true });
      }
    } catch {
      /* ignore */
    } finally {
      clearRefresh();
      clear();
      authChannel()?.postMessage('logout');
    }
  }, [clear]);

  return { accessToken, user, isAuthenticated: !!accessToken, login, logout };
}
