const REFRESH_KEY = 'senam.rt';

export function loadRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function saveRefresh(token: string): void {
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearRefresh(): void {
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

let channel: BroadcastChannel | null = null;
export function authChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel('senam-auth');
  return channel;
}
