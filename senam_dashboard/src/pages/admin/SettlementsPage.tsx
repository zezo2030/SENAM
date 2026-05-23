import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Ban, FileText, MoreHorizontal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  useSettlements,
  useVoidSettlement,
  type Settlement,
  type SettlementsParams,
} from '@/api/admin-settlements.api';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ApproveSettlementDialog } from '@/features/settlements/ApproveSettlementDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useUiStore } from '@/store/ui.store';
import { formatDate, formatMoneyMinor } from '@/lib/formatters';

type StatusFilter = SettlementsParams['status'];

const FILTERS: { value: StatusFilter; key: string }[] = [
  { value: 'all', key: 'filter.all' },
  { value: 'due', key: 'filter.due' },
  { value: 'paid', key: 'filter.paid' },
  { value: 'provider_owes', key: 'filter.provider_owes' },
  { value: 'void', key: 'filter.void' },
];

export default function AdminSettlementsPage() {
  const { t } = useTranslation('settlements');
  const lang = useUiStore((s) => s.lang);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [companyId, setCompanyId] = useState('');
  const [approving, setApproving] = useState<Settlement | null>(null);
  const [voiding, setVoiding] = useState<Settlement | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const { data, isPending } = useSettlements({
    status,
    companyId: companyId.trim() || undefined,
  });
  const voidMut = useVoidSettlement();

  const settlements = data?.data ?? [];

  async function downloadPdf(s: Settlement) {
    setPdfLoadingId(s.id);
    try {
      // Admin reuses the provider statement endpoint for the PDF stream.
      const blob = await api.get<Blob>(EP.provider.settlementPdf(s.id), {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlement-${s.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('pdf.failed'));
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function onConfirmVoid() {
    if (!voiding) return;
    await voidMut.mutateAsync(voiding.id);
    toast.success(t('void.success'));
    setVoiding(null);
  }

  function periodLabel(s: Settlement): string {
    const from = s.windowStart ?? s.periodStart ?? null;
    const to = s.windowEnd ?? s.periodEnd ?? null;
    if (!from && !to) return '—';
    return `${formatDate(from, 'PP', lang)} → ${formatDate(to, 'PP', lang)}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Tabs value={String(status)} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <TabsList>
              {FILTERS.map((f) => (
                <TabsTrigger key={String(f.value)} value={String(f.value)}>
                  {t(f.key)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="space-y-1">
            <Label htmlFor="settlement-company" className="text-xs text-muted-foreground">
              {t('filter.companyId')}
            </Label>
            <Input
              id="settlement-company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-[260px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.company')}</TableHead>
                <TableHead>{t('table.period')}</TableHead>
                <TableHead>{t('table.gross')}</TableHead>
                <TableHead>{t('table.commission')}</TableHead>
                <TableHead>{t('table.payout')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead className="text-end">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((s) => {
                  const statusVal = String(s.status);
                  const isPdfLoading = pdfLoadingId === s.id;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.companyName ?? s.companyId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {periodLabel(s)}
                      </TableCell>
                      <TableCell>
                        {formatMoneyMinor(s.grossOnlineMinor ?? s.grossMinor ?? null, 'QAR', lang)}
                      </TableCell>
                      <TableCell>
                        {formatMoneyMinor(
                          s.commissionOnlineMinor ?? s.commissionMinor ?? null,
                          'QAR',
                          lang,
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoneyMinor(s.netAmountMinor ?? s.payoutMinor ?? null, 'QAR', lang)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="settlement"
                          value={statusVal}
                          label={t(`status.${statusVal}`, { defaultValue: statusVal })}
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={statusVal !== 'due' && statusVal !== 'provider_owes'}
                              onClick={() => setApproving(s)}
                            >
                              <Check className="me-2 h-4 w-4" />
                              {t('actions.approve')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={statusVal === 'void'}
                              onClick={() => setVoiding(s)}
                            >
                              <Ban className="me-2 h-4 w-4" />
                              {t('actions.void')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => void downloadPdf(s)}
                              disabled={isPdfLoading}
                            >
                              {isPdfLoading ? (
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="me-2 h-4 w-4" />
                              )}
                              {t('actions.pdf')}
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
        </CardContent>
      </Card>

      <ApproveSettlementDialog
        settlement={approving}
        open={!!approving}
        onOpenChange={(o) => !o && setApproving(null)}
      />
      <DeleteConfirmDialog
        open={!!voiding}
        onOpenChange={(o) => !o && setVoiding(null)}
        title={t('void.title')}
        body={t('void.body')}
        confirmLabel={t('void.confirm')}
        loading={voidMut.isPending}
        onConfirm={() => void onConfirmVoid()}
      />
    </div>
  );
}
