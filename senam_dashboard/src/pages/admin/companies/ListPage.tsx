import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Check, Ban, Building2, Eye } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAdminCompanies, type AdminCompany } from '@/api/admin-companies.api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUiStore } from '@/store/ui.store';
import { formatDate } from '@/lib/formatters';
import { resolveMediaUrl } from '@/lib/media-url';
import { ApproveDialog } from '@/features/companies/ApproveDialog';
import { SuspendDialog } from '@/features/companies/SuspendDialog';
import type { CompanyStatus } from '@/types/domain';

type StatusFilter = CompanyStatus | 'all';

const FILTERS: { value: StatusFilter; key: string }[] = [
  { value: 'all', key: 'companies.filter.all' },
  { value: 'pending', key: 'companies.filter.pending' },
  { value: 'active', key: 'companies.filter.active' },
  { value: 'suspended', key: 'companies.filter.suspended' },
];

export default function AdminCompaniesListPage() {
  const { t } = useTranslation('admin');
  const lang = useUiStore((s) => s.lang);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<AdminCompany | null>(null);
  const [dialog, setDialog] = useState<'approve' | 'suspend' | null>(null);

  const { data, isPending } = useAdminCompanies({ status: filter });
  const companies = useMemo(() => data?.data ?? [], [data]);

  function open(action: 'approve' | 'suspend', company: AdminCompany) {
    setSelected(company);
    setDialog(action);
  }

  return (
    <div className="space-y-6">
      {/* ── Premium Page Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, hsl(220,80%,56%), hsl(262,83%,58%))' }}
        >
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ background: 'linear-gradient(135deg, hsl(220,80%,66%), hsl(262,83%,68%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {t('companies.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('companies.subtitle', 'إدارة مزودي الخدمة')}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'hsl(var(--card)/0.6)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border)/0.5)' }}
      >
        <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <TabsList className="bg-background/50">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {t(f.key)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Table ── */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ background: 'hsl(var(--card)/0.6)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--border)/0.5)' }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'hsl(var(--border)/0.4)', background: 'hsl(var(--muted)/0.3)' }}>
              <TableHead className="font-semibold text-foreground/80">{t('companies.name')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('companies.status')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('companies.rating')}</TableHead>
              <TableHead className="font-semibold text-foreground/80">{t('companies.createdAt')}</TableHead>
              <TableHead className="text-end font-semibold text-foreground/80">{t('companies.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} style={{ borderColor: 'hsl(var(--border)/0.3)' }}>
                  <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-10 w-10 opacity-30" />
                    <p>{t('companies.empty')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((c) => {
                const status = String(c.status);
                const displayName = c.displayName ?? c.legalName ?? c.id;
                const logoUrl = c.logoObjectKey
                  ? resolveMediaUrl(c.logoObjectKey)
                  : '';
                return (
                  <TableRow key={c.id} className="transition-colors" style={{ borderColor: 'hsl(var(--border)/0.3)' }}>
                    <TableCell>
                      <Link to={`/admin/companies/${c.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="h-8 w-8 shrink-0 rounded-lg border border-border/40">
                          {logoUrl ? (
                            <AvatarImage
                              src={logoUrl}
                              alt={displayName}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback
                            className="rounded-lg text-xs font-bold text-white"
                            style={{
                              background:
                                'linear-gradient(135deg, hsl(220,80%,56%), hsl(262,83%,58%))',
                            }}
                          >
                            {(displayName[0] ?? '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{displayName}</div>
                          {c.slug && <div className="text-xs text-muted-foreground">{c.slug}</div>}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="company" value={status} label={t(`companies.status.${status}`, status)} />
                    </TableCell>
                    <TableCell>
                      {c.ratingAvg ? (
                        <span className="flex items-center gap-1 font-medium">
                          ⭐ {Number(c.ratingAvg).toFixed(2)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.createdAt ?? null, 'PP', lang)}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/companies/${c.id}`}>
                              <Eye className="me-2 h-4 w-4 text-sky-500" />
                              عرض التفاصيل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={status === 'active'}
                            onClick={() => open('approve', c)}
                          >
                            <Check className="me-2 h-4 w-4 text-emerald-500" />
                            {t('companies.approve.confirm')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={status === 'suspended'}
                            onClick={() => open('suspend', c)}
                          >
                            <Ban className="me-2 h-4 w-4 text-amber-500" />
                            {t('companies.suspend.confirm')}
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

      <ApproveDialog
        company={selected}
        open={dialog === 'approve'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <SuspendDialog
        company={selected}
        open={dialog === 'suspend'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
    </div>
  );
}
