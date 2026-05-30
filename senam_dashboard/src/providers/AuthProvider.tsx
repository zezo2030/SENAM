import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authChannel, clearRefresh, loadRefresh, saveRefresh } from '@/lib/auth/token-storage';
import { decodeJwt } from '@/lib/auth/jwt';
import { EP } from '@/lib/api/endpoints';
import type { AuthTokens } from '@/types/domain';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
let bootstrapRefreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (bootstrapRefreshPromise) return bootstrapRefreshPromise;
  const refreshToken = loadRefresh();
  if (!refreshToken) return false;

  bootstrapRefreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${EP.auth.refresh}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        useAuthStore.getState().clear();
        clearRefresh();
        return false;
      }
      const tokens = (await res.json()) as AuthTokens;
      saveRefresh(tokens.refreshToken);
      const payload = decodeJwt(tokens.accessToken);
      if (!payload) {
        useAuthStore.getState().clear();
        clearRefresh();
        return false;
      }
      useAuthStore.getState().setSession(tokens.accessToken, payload);
      return true;
    } catch {
      useAuthStore.getState().clear();
      clearRefresh();
      return false;
    } finally {
      bootstrapRefreshPromise = null;
    }
  })();

  return bootstrapRefreshPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      await tryRefresh();
      setReady(true);
    })();

    const ch = authChannel();
    if (!ch) return;
    const onMessage = (ev: MessageEvent) => {
      if (ev.data === 'logout') useAuthStore.getState().clear();
    };
    ch.addEventListener('message', onMessage);
    return () => ch.removeEventListener('message', onMessage);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-muted-foreground">
        …
      </div>
    );
  }
  return <>{children}</>;
}
