import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useDirectoryReport, type DirectoryParams } from '@/api/admin-reports.api';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { useUiStore } from '@/store/ui.store';
import { formatDate } from '@/lib/formatters';

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
  const initialRange = useMemo(() => defaultRange(), []);

  const [range, setRange] = useState<DateRange>(initialRange);
  const [applied, setApplied] = useState<DirectoryParams>(initialRange);

  const { data, isPending } = useDirectoryReport(applied);

  const apply = () => {
    setApplied({ from: range.from, to: range.to });
  };

  const chartData = useMemo(
    () =>
      (data?.byDay ?? []).map((b) => ({
        date: formatDate(b.date, 'MMM d', lang),
        registrations: b.registrations,
        reviews: b.reviews,
      })),
    [data, lang],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <DateRangeFilter value={range} onChange={setRange} />
          <div className="ms-auto">
            <Button onClick={apply}>{t('filter.apply')}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('kpi.totalCompanies')}
          value={data?.totalCompanies?.toLocaleString(lang) ?? '—'}
          loading={isPending}
        />
        <KpiCard
          label={t('kpi.activeCompanies')}
          value={data?.activeCompanies?.toLocaleString(lang) ?? '—'}
          loading={isPending}
        />
        <KpiCard
          label={t('kpi.pendingCompanies')}
          value={data?.pendingCompanies?.toLocaleString(lang) ?? '—'}
          loading={isPending}
        />
        <KpiCard
          label={t('kpi.totalReviews')}
          value={data?.totalReviews?.toLocaleString(lang) ?? '—'}
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  name={t('chart.registrations')}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="reviews"
                  name={t('chart.reviews')}
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
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
