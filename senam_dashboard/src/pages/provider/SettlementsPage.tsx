import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

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

import { useProviderSettlements } from '@/api/provider-settlements.api';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUiStore } from '@/store/ui.store';
import { formatDate, formatMoneyMinor } from '@/lib/formatters';
import type { Settlement } from '@/api/admin-settlements.api';

export default function ProviderSettlementsPage() {
  const { t } = useTranslation(['provider', 'settlements']);
  const lang = useUiStore((s) => s.lang);
  const { data, isPending } = useProviderSettlements();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const settlements = data?.data ?? [];

  async function downloadPdf(s: Settlement) {
    setDownloadingId(s.id);
    try {
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
      toast.error(t('settlements.pdfFailed'));
    } finally {
      setDownloadingId(null);
    }
  }

  function periodLabel(s: Settlement) {
    const from = s.windowStart ?? s.periodStart ?? null;
    const to = s.windowEnd ?? s.periodEnd ?? null;
    if (!from && !to) return '—';
    return `${formatDate(from, 'PP', lang)} → ${formatDate(to, 'PP', lang)}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('settlements.title')}</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settlements:table.period')}</TableHead>
                <TableHead>{t('settlements:table.gross')}</TableHead>
                <TableHead>{t('settlements:table.commission')}</TableHead>
                <TableHead>{t('settlements:table.payout')}</TableHead>
                <TableHead>{t('settlements:table.status')}</TableHead>
                <TableHead className="text-end">{t('settlements:table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t('settlements.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((s) => {
                  const statusVal = String(s.status);
                  const isDownloading = downloadingId === s.id;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {periodLabel(s)}
                      </TableCell>
                      <TableCell>
                        {formatMoneyMinor(
                          s.grossOnlineMinor ?? s.grossMinor ?? null,
                          'QAR',
                          lang,
                        )}
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
                          label={t(`settlements:status.${statusVal}`, { defaultValue: statusVal })}
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void downloadPdf(s)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="me-2 h-4 w-4" />
                          )}
                          {t('settlements.pdf')}
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
    </div>
  );
}
