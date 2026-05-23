import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProviderOrders } from '@/api/provider-orders.api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUiStore } from '@/store/ui.store';
import { formatDateTimeQatar, formatMoneyMinor } from '@/lib/formatters';
import type { OrderStatus } from '@/types/domain';

const FILTERS: { value: OrderStatus | 'all'; key: string }[] = [
  { value: 'all', key: 'filter.all' },
  { value: 'pending', key: 'filter.pending' },
  { value: 'in_progress', key: 'filter.active' },
  { value: 'completed', key: 'filter.completed' },
  { value: 'cancelled', key: 'filter.cancelled' },
];

export default function ProviderOrdersListPage() {
  const { t } = useTranslation(['orders', 'provider']);
  const lang = useUiStore((s) => s.lang);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');

  const { data, isPending } = useProviderOrders({ status });
  const orders = data?.data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('provider:orders.title')}</h1>

      <Card>
        <CardContent className="p-4">
          <Tabs
            value={String(status)}
            onValueChange={(v) => setStatus(v as OrderStatus | 'all')}
          >
            <TabsList>
              {FILTERS.map((f) => (
                <TabsTrigger key={String(f.value)} value={String(f.value)}>
                  {t(f.key)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.id')}</TableHead>
                <TableHead>{t('table.customer')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.total')}</TableHead>
                <TableHead>{t('table.scheduled')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const s = String(o.status);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          to={`/provider/orders/${o.id}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {o.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {o.customerName ?? o.customerEmail ?? o.customerId ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="order"
                          value={s}
                          label={t(`status.${s}`, { defaultValue: s })}
                        />
                      </TableCell>
                      <TableCell>{formatMoneyMinor(o.totalMinor ?? null, 'QAR', lang)}</TableCell>
                      <TableCell>
                        {formatDateTimeQatar(o.scheduledAt ?? null, 'PPp', lang)}
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
