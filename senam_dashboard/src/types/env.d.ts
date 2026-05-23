/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_DEFAULT_LOCALE: 'en' | 'ar';
  readonly VITE_DEFAULT_TZ: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
