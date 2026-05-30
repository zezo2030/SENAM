import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { clearRefresh, loadRefresh, saveRefresh } from '@/lib/auth/token-storage';
import { decodeJwt } from '@/lib/auth/jwt';
import { EP } from './endpoints';
import type { ApiErrorEnvelope, AuthTokens } from '@/types/domain';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(envelope: ApiErrorEnvelope) {
    super(envelope.message);
    this.name = 'ApiError';
    this.status = envelope.status;
    this.code = envelope.code;
    this.details = envelope.details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  responseType?: 'json' | 'blob' | 'void';
  /** Skip 401 refresh handling. Used by refresh() itself to avoid recursion. */
  skipAuthRetry?: boolean;
}

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refresh(): Promise<AuthTokens | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = loadRefresh();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${EP.auth.refresh}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const tokens = (await res.json()) as AuthTokens;
      saveRefresh(tokens.refreshToken);
      const payload = decodeJwt(tokens.accessToken);
      if (payload) useAuthStore.getState().setSession(tokens.accessToken, payload);
      return tokens;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(extra?: HeadersInit, isJsonBody = false): Headers {
  const headers = new Headers(extra);
  const token = useAuthStore.getState().accessToken;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', useUiStore.getState().lang);
  }
  if (isJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, responseType = 'json', skipAuthRetry, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    headers: buildHeaders(headers, body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  const url = `${BASE_URL}${path}`;
  let res = await fetch(url, init);

  if (res.status === 401 && !skipAuthRetry) {
    const tokens = await refresh();
    if (tokens) {
      init.headers = buildHeaders(headers, body !== undefined);
      res = await fetch(url, init);
    } else {
      useAuthStore.getState().clear();
      clearRefresh();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
  }

  if (!res.ok) {
    let envelope: ApiErrorEnvelope = { status: res.status, message: res.statusText };
    try {
      const parsed = (await res.json()) as Partial<ApiErrorEnvelope> & {
        error?: { code?: string; message?: string; details?: unknown };
        detail?: unknown;
      };
      envelope = {
        status: res.status,
        code: parsed.code ?? parsed.error?.code,
        message:
          parsed.message ??
          parsed.error?.message ??
          (typeof parsed.detail === 'string' ? parsed.detail : undefined) ??
          envelope.message,
        details: parsed.details ?? parsed.error?.details,
      };
    } catch {
      /* keep default envelope */
    }
    throw new ApiError(envelope);
  }

  if (responseType === 'void' || res.status === 204) return undefined as T;
  if (responseType === 'blob') return (await res.blob()) as T;
  // Some endpoints return 200 with an empty body (e.g. handlers typed `void`).
  // Reading as text first avoids `res.json()` throwing on an empty payload.
  const text = await res.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T = void>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
