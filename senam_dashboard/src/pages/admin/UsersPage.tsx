import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Ban, Check, Trash2, Search, Users } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  useAdminUsers,
  type AdminUser,
  type AdminUserStatus,
} from '@/api/admin-users.api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUiStore } from '@/store/ui.store';
import { formatDate } from '@/lib/formatters';
import { BanUserDialog } from '@/features/users/BanDialog';
import { ReactivateUserDialog } from '@/features/users/ReactivateDialog';
import { DeleteUserDialog } from '@/features/users/DeleteDialog';

type StatusFilter = AdminUserStatus | 'all';

const FILTERS: { value: StatusFilter; key: string }[] = [
  { value: 'all', key: 'users.filter.all' },
  { value: 'active', key: 'users.filter.active' },
  { value: 'banned', key: 'users.filter.banned' },
  { value: 'deleted', key: 'users.filter.deleted' },
];

export default function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const lang = useUiStore((s) => s.lang);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [dialog, setDialog] = useState<'ban' | 'reactivate' | 'delete' | null>(null);

  const { data, isPending } = useAdminUsers({
    status: filter,
    q: committedSearch || undefined,
  });
  const users = useMemo(() => data?.data ?? [], [data]);

  function open(action: 'ban' | 'reactivate' | 'delete', user: AdminUser) {
    setSelected(user);
    setDialog(action);
  }

  return (
    <div className="space-y-6">
      {/* ── Premium Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, hsl(262,83%,58%), hsl(290,70%,50%))' }}
          >
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ background: 'linear-gradient(135deg, hsl(262,83%,68%), hsl(290,70%,60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('users.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('users.subtitle', 'إدارة حسابات المستخدمين')}</p>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'hsl(var(--card)/0.6)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border)/0.5)' }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <TabsList className="bg-background/50">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {t(f.key)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCommittedSearch(search.trim());
            }}
          >
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('users.searchPlaceholder')}
                className="w-64 ps-9"
                style={{ background: 'hsl(var(--background)/0.8)' }}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              style={{ background: 'linear-gradient(135deg, hsl(262,83%,58%), hsl(290,70%,50%))' }}
              className="text-white border-0 shadow-md"
            >
              {t('users.search', 'بحث')}
            </Button>
          </form>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ background: 'hsl(var(--card)/0.6)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border)/0.5)' }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'hsl(var(--border)/0.4)', background: 'hsl(var(--muted)/0.3)' }}>
              <TableHead className="font-semibold text-foreground/80">{t('users.name')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('users.email')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('users.phone')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('users.status')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('users.createdAt')}</TableHead>
              <TableHead className="text-end font-semibold text-foreground/80">{t('users.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} style={{ borderColor: 'hsl(var(--border)/0.3)' }}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-30" />
                    <p>{t('users.empty')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const status = String(u.status);
                const isDeleted = status === 'deleted';
                return (
                  <TableRow
                    key={u.id}
                    className="transition-colors"
                    style={{ borderColor: 'hsl(var(--border)/0.3)' }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, hsl(262,83%,58%), hsl(290,70%,50%))' }}
                        >
                          {(u.displayName ?? u.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.displayName ?? '—'}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{u.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{u.phone ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge
                        kind="user"
                        value={status}
                        label={t(`users.status.${status}`, status)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.createdAt ?? null, 'PP', lang)}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDeleted}
                            className="h-8 w-8 rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          {status === 'banned' ? (
                            <DropdownMenuItem onClick={() => open('reactivate', u)}>
                              <Check className="me-2 h-4 w-4 text-emerald-500" />
                              {t('users.reactivate.confirm')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => open('ban', u)}>
                              <Ban className="me-2 h-4 w-4 text-amber-500" />
                              {t('users.ban.confirm')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => open('delete', u)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {t('users.delete.confirm')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <BanUserDialog
        user={selected}
        open={dialog === 'ban'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <ReactivateUserDialog
        user={selected}
        open={dialog === 'reactivate'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <DeleteUserDialog
        user={selected}
        open={dialog === 'delete'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
    </div>
  );
}
