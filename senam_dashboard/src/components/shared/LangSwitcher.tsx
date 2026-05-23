import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUiStore, type Lang } from '@/store/ui.store';

const LANGS: { value: Lang; key: string }[] = [
  { value: 'en', key: 'lang.en' },
  { value: 'ar', key: 'lang.ar' },
];

export function LangSwitcher() {
  const { t } = useTranslation();
  const lang = useUiStore((s) => s.lang);
  const setLang = useUiStore((s) => s.setLang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="language">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuCheckboxItem
            key={l.value}
            checked={lang === l.value}
            onCheckedChange={() => setLang(l.value)}
          >
            {t(l.key)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
