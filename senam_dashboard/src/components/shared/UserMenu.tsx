import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProviderCompany } from '@/api/provider-profile.api';
import type { Role } from '@/types/domain';

function initials(value: string | undefined) {
  if (!value) return '?';
  const parts = value.split(/[@\s.]/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

function formatRoles(roles: Role[], t: (key: string, opts?: { defaultValue?: string }) => string) {
  if (!roles.length) return null;
  return roles
    .map((role) => t(`roles.${role}`, { defaultValue: role }))
    .join(' · ');
}

export function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const isProvider = user?.principal === 'provider';
  const { data: company } = useProviderCompany(isProvider);

  const displayName =
    (isProvider ? company?.displayName?.trim() : undefined) ||
    user?.name?.trim() ||
    user?.email ||
    '—';

  const subtitle =
    user?.email && user.email !== displayName
      ? user.email
      : formatRoles(user?.roles ?? [], t);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-sm font-medium">{displayName}</span>
          {subtitle ? (
            <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()}>
          <LogOut className="me-2 h-4 w-4" />
          {t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
