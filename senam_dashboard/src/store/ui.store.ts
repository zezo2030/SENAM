import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Lang = 'en' | 'ar';

interface UiState {
  theme: Theme;
  lang: Lang;
  sidebarCollapsed: boolean;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      lang: (import.meta.env.VITE_DEFAULT_LOCALE ?? 'en') as Lang,
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'senam.ui' },
  ),
);
