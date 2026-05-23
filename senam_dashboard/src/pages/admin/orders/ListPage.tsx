import { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  useAdminOrders,
  type ListOrdersParams,
} from '@/api/admin-orders.api';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatMoneyMinor, formatDateTimeQatar } from '@/lib/formatters';
import { useUiStore } from '@/store/ui.store';

type StatusFilter = ListOrdersParams['status'];

const FILTERS: { value: StatusFilter; key: string }[] = [
  { value: 'all', key: 'filter.all' },
  { value: 'pending', key: 'filter.pending' },
  { value: 'in_progress', key: 'filter.active' },
  { value: 'completed', key: 'filter.completed' },
  { value: 'cancelled', key: 'filter.cancelled' },
];

function toIsoStart(date?: string) {
  if (!date) return undefined;
  return `${date}T00:00:00.000Z`;
}
function toIsoEnd(date?: string) {
  if (!date) return undefined;
  return `${date}T23:59:59.999Z`;
}

export default function AdminOrdersListPage() {
  const { t } = useTranslation('orders');
  const lang = useUiStore((s) => s.lang);

  const [status, setStatus] = useState<StatusFilter>('all');
  const [companyId, setCompanyId] = useState('');
  const [range, setRange] = useState<DateRange>({});

  const params: ListOrdersParams = useMemo(
    () => ({
      status,
      companyId: companyId.trim() || undefined,
      from: toIsoStart(range.from),
      to: toIsoEnd(range.to),
    }),
    [status, companyId, range],
  );

  const { data, isPending } = useAdminOrders(params);
  const orders = data?.data ?? [];

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
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="company-id" className="text-xs text-muted-foreground">
                {t('filter.companyId')}
              </Label>
              <Input
                id="company-id"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-[200px]"
              />
            </div>
            <DateRangeFilter value={range} onChange={setRange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.id')}</TableHead>
                <TableHead>{t('table.customer')}</TableHead>
                <TableHead>{t('table.company')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.total')}</TableHead>
                <TableHead>{t('table.scheduled')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const statusValue = String(o.status);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {o.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {o.customerName ?? o.customerEmail ?? o.customerId ?? '—'}
                      </TableCell>
                      <TableCell>{o.companyName ?? o.companyId ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="order"
                          value={statusValue}
                          label={t(`status.${statusValue}`, { defaultValue: statusValue })}
                        />
                      </TableCell>
                      <TableCell>
                        {formatMoneyMinor(o.totalMinor ?? null, 'QAR', lang)}
                      </TableCell>
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
