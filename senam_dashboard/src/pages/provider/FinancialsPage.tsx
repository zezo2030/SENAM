import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useFinancials, type FinancialsParams } from '@/api/provider-financials.api';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { useUiStore } from '@/store/ui.store';
import { formatDate, formatMoneyMinor } from '@/lib/formatters';

function defaultRange(): DateRange {
  const now = new Date();
  const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: past.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function ProviderFinancialsPage() {
  const { t } = useTranslation(['provider', 'common']);
  const lang = useUiStore((s) => s.lang);
  const [range, setRange] = useState<DateRange>(defaultRange());
  const [applied, setApplied] = useState<FinancialsParams>(defaultRange());

  const { data, isPending } = useFinancials(applied);

  const chartData = useMemo(() => {
    return (data?.accruals ?? []).map((a) => ({
      date: formatDate(a.date, 'MMM d', lang),
      gross: Number(a.grossMinor ?? 0) / 100,
      orders: Number(a.orderCount ?? 0),
    }));
  }, [data, lang]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('financials.title')}</h1>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <DateRangeFilter value={range} onChange={setRange} />
          <div className="ms-auto">
            <Button onClick={() => setApplied({ from: range.from, to: range.to })}>
              {t('actions.refresh', { ns: 'common' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t('financials.gross')}
          value={formatMoneyMinor(data?.grossMinor ?? null, 'QAR', lang)}
          loading={isPending}
        />
        <Kpi
          label={t('financials.commission')}
          value={formatMoneyMinor(data?.commissionMinor ?? null, 'QAR', lang)}
          loading={isPending}
        />
        <Kpi
          label={t('financials.payout')}
          value={formatMoneyMinor(data?.payoutMinor ?? null, 'QAR', lang)}
          loading={isPending}
        />
        <Kpi
          label={t('financials.orders')}
          value={data?.orderCount?.toLocaleString(lang) ?? '—'}
          loading={isPending}
        />
      </div>

      <Card>
        <CardContent className="h-[320px] p-4">
          {isPending ? (
            <Skeleton className="h-full w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t('financials.empty')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis yAxisId="left" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} />
                <Tooltip />
                <Bar
                  yAxisId="left"
                  dataKey="gross"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <div className="text-3xl font-semibold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
