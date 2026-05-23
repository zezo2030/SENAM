import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useSalesReport, type SalesParams } from '@/api/admin-reports.api';
import { useCategories } from '@/api/admin-catalog.api';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { useUiStore } from '@/store/ui.store';
import { formatMoneyMinor, formatDate } from '@/lib/formatters';

const ALL = '__all__';

function defaultRange(): DateRange {
  const now = new Date();
  const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return {
    from: past.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function AdminReportsPage() {
  const { t } = useTranslation('reports');
  const lang = useUiStore((s) => s.lang);

  const [range, setRange] = useState<DateRange>(defaultRange());
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [applied, setApplied] = useState<SalesParams>(() => ({
    from: defaultRange().from,
    to: defaultRange().to,
    granularity: 'day',
  }));

  const { data: categories = [] } = useCategories();
  const { data, isPending } = useSalesReport(applied);

  const apply = () => {
    setApplied({
      from: range.from,
      to: range.to,
      granularity: 'day',
      categoryId: categoryId === ALL ? undefined : categoryId,
    });
  };

  const chartData = useMemo(() => {
    return (data?.buckets ?? []).map((b) => ({
      date: formatDate(b.date, 'MMM d', lang),
      gmv: Number(b.grossMinor ?? 0) / 100,
      orders: Number(b.orderCount ?? 0),
    }));
  }, [data, lang]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <DateRangeFilter value={range} onChange={setRange} />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('filter.category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('filter.allCategories')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameEn ?? c.nameAr ?? c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ms-auto">
            <Button onClick={apply}>{t('filter.apply')}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('kpi.gmv')}
          value={formatMoneyMinor(data?.gmvMinor ?? null, 'QAR', lang)}
          loading={isPending}
        />
        <KpiCard
          label={t('kpi.orders')}
          value={data?.orderCount?.toLocaleString(lang) ?? '—'}
          loading={isPending}
        />
        <KpiCard
          label={t('kpi.commission')}
          value={formatMoneyMinor(data?.commissionMinor ?? null, 'QAR', lang)}
          loading={isPending}
        />
        <KpiCard
          label={t('kpi.avgOrder')}
          value={formatMoneyMinor(data?.avgOrderMinor ?? null, 'QAR', lang)}
          loading={isPending}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('chart.title')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          {isPending ? (
            <Skeleton className="h-full w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t('empty')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="gmv"
                  name={t('chart.gmv')}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name={t('chart.orders')}
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

function KpiCard({
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
