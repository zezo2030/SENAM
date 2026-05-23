import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n, applyDirection } from '@/lib/i18n';
import { useUiStore } from '@/store/ui.store';

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useUiStore((s) => s.lang);

  useEffect(() => {
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
    applyDirection(lang);
  }, [lang]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
