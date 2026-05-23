import type { JwtPayload } from '@/types/domain';

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload, skewSeconds = 30): boolean {
  return payload.exp * 1000 < Date.now() + skewSeconds * 1000;
}
