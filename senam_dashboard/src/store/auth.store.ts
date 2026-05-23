import { create } from 'zustand';
import type { JwtPayload, Role } from '@/types/domain';

interface AuthState {
  accessToken: string | null;
  user: JwtPayload | null;
  setSession: (accessToken: string, user: JwtPayload) => void;
  clear: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
  hasRole: (role) => !!get().user?.roles?.includes(role),
  hasAnyRole: (roles) => {
    const have = get().user?.roles ?? [];
    return roles.some((r) => have.includes(r));
  },
}));
