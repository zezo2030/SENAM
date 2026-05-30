import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Building2, CheckCircle2, Clock, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDirectoryReport } from '@/api/admin-reports.api';

function pastNDaysRange(n: number): { from: string; to: string } {
  const now = new Date();
  const past = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return { from: past.toISOString(), to: now.toISOString() };
}

export default function AdminOverviewPage() {
  const { t } = useTranslation('admin');
  const range = useMemo(() => pastNDaysRange(30), []);
  const { data, isPending } = useDirectoryReport(range);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('overview.title', { defaultValue: 'Overview' })}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Building2 className="h-5 w-5" />}
          label={t('overview.totalCompanies', { defaultValue: 'Total companies' })}
          value={data?.totalCompanies}
          loading={isPending}
        />
        <Kpi
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label={t('overview.activeCompanies', { defaultValue: 'Active companies' })}
          value={data?.activeCompanies}
          loading={isPending}
        />
        <Kpi
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label={t('overview.pendingCompanies', { defaultValue: 'Pending approval' })}
          value={data?.pendingCompanies}
          loading={isPending}
        />
        <Kpi
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          label={t('overview.totalReviews', { defaultValue: 'Total reviews' })}
          value={data?.totalReviews}
          loading={isPending}
        />
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        {icon}
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-semibold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
