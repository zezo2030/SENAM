import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useCoupons, useDeleteCoupon, type Coupon } from '@/api/admin-coupons.api';
import { CouponForm } from '@/features/coupons/CouponForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useUiStore } from '@/store/ui.store';
import { formatBps, formatDate, formatMoneyMinor } from '@/lib/formatters';

function formatValue(coupon: Coupon, lang: 'en' | 'ar') {
  if (coupon.kind === 'percent') return formatBps(coupon.value);
  return formatMoneyMinor(coupon.value, 'QAR', lang);
}

function formatValidity(coupon: Coupon, lang: 'en' | 'ar') {
  const f = coupon.validFrom ? formatDate(coupon.validFrom, 'PP', lang) : '∞';
  const t = coupon.validTo ? formatDate(coupon.validTo, 'PP', lang) : '∞';
  return `${f} → ${t}`;
}

export default function AdminCouponsPage() {
  const { t } = useTranslation('coupons');
  const lang = useUiStore((s) => s.lang);
  const { data, isPending } = useCoupons();
  const del = useDeleteCoupon();

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);

  const coupons = data?.data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(c: Coupon) {
    setEditing(c);
    setFormOpen(true);
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;
    await del.mutateAsync(pendingDelete.id);
    toast.success(t('deleted'));
    setPendingDelete(null);
  }

  if (formOpen) {
    return (
      <CouponForm
        coupon={editing}
        onCancel={() => setFormOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button 
          onClick={openCreate}
          className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98] h-10 px-5"
        >
          <Plus className="me-2 h-4 w-4" />
          {t('new')}
        </Button>
      </div>

      <Card className="glass-panel border-white/10 shadow-xl overflow-hidden rounded-2xl glow-hover">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.code')}</TableHead>
                <TableHead>{t('table.kind')}</TableHead>
                <TableHead>{t('table.value')}</TableHead>
                <TableHead>{t('table.scope')}</TableHead>
                <TableHead>{t('table.validity')}</TableHead>
                <TableHead className="w-[180px]">{t('table.usage')}</TableHead>
                <TableHead>{t('table.active')}</TableHead>
                <TableHead className="text-end">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((c) => {
                  const used = c.usedCount ?? 0;
                  const cap = c.maxUses ?? 0;
                  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
                  const scopeLabel = t(`scope.${c.scope ?? 'all'}`, {
                    defaultValue: c.scope ?? 'all',
                  });
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/40 transition-colors border-b border-border/20">
                      <TableCell className="font-mono font-bold text-primary">{c.code}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border-primary/20 font-semibold">{t(`kind.${c.kind}`)}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">{formatValue(c, lang)}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{scopeLabel}</div>
                        {c.scope && c.scope !== 'all' ? (
                          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                            {c.scopeCategoryId ?? c.scopeCompanyId ?? c.scopeServiceId ?? ''}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {formatValidity(c, lang)}
                      </TableCell>
                      <TableCell className="py-4">
                        {cap > 0 ? (
                          <div className="space-y-1">
                            <Progress value={pct} className="h-1.5 bg-muted/65" />
                            <div className="text-xs text-muted-foreground font-semibold">
                              {used} / {cap}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-semibold">{used} / ∞</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.active ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                          <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/45" />
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="icon" className="rounded-lg hover:bg-muted" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg hover:bg-muted"
                          onClick={() => setPendingDelete(c)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={t('delete.title')}
        body={t('delete.body')}
        confirmLabel={t('delete.confirm')}
        loading={del.isPending}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}
