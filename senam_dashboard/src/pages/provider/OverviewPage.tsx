import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Banknote,
  Star,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { useProviderOrders } from '@/api/provider-orders.api';
import { useFinancials } from '@/api/provider-financials.api';
import { useProviderCompany } from '@/api/provider-profile.api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUiStore } from '@/store/ui.store';
import { formatDateTimeQatar, formatMoneyMinor } from '@/lib/formatters';

function pastNDaysIso(n: number) {
  const now = new Date();
  const past = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return {
    from: past.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function ProviderOverviewPage() {
  const { t } = useTranslation('provider');
  const lang = useUiStore((s) => s.lang);

  const week = useMemo(() => pastNDaysIso(7), []);
  const openOrders = useProviderOrders({
    status: ['accepted', 'on_the_way', 'arrived', 'in_progress'] as never,
  });
  const recent = useProviderOrders({ limit: 5 });
  const financials = useFinancials(week);
  const company = useProviderCompany();

  const recentList = recent.data?.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('overview.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' 
              ? 'مرحباً بك مجدداً. إليك تفاصيل الطلبات الحالية، التقييمات، والبيانات المالية لهذا الأسبوع.' 
              : 'Welcome back to your provider area. Here is a summary of your active orders, feedback, and financial metrics.'}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t('overview.openOrders')}
          value={openOrders.data?.total?.toLocaleString(lang) ?? '—'}
          loading={openOrders.isPending}
          icon={ShoppingBag}
          color="indigo"
          subtitle={lang === 'ar' ? 'طلبات نشطة وقيد التنفيذ' : 'Active orders in progress'}
        />
        <Kpi
          label={t('overview.weekAccrual')}
          value={formatMoneyMinor(financials.data?.payoutMinor ?? null, 'QAR', lang)}
          loading={financials.isPending}
          icon={Banknote}
          color="emerald"
          subtitle={lang === 'ar' ? 'مستحقات الأسبوع الحالي' : 'Payout accrued (7d)'}
        />
        <Kpi
          label={t('overview.rating')}
          value={
            company.data?.ratingAvg !== null && company.data?.ratingAvg !== undefined
              ? Number(company.data.ratingAvg).toFixed(2)
              : '—'
          }
          loading={company.isPending}
          icon={Star}
          color="amber"
          subtitle={lang === 'ar' ? 'متوسط تقييم العملاء' : 'Customer rating score'}
        />
        <Kpi
          label={t('overview.completed')}
          value={financials.data?.orderCount?.toLocaleString(lang) ?? '—'}
          loading={financials.isPending}
          icon={CheckCircle2}
          color="violet"
          subtitle={lang === 'ar' ? 'إجمالي الطلبات المكتملة' : 'Successfully completed'}
        />
      </div>

      {/* Recent Orders Glass Table Card */}
      <Card className="glass-panel border-white/10 shadow-xl overflow-hidden rounded-2xl glow-hover">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{t('overview.recentOrders')}</span>
            </CardTitle>
            <div className="rounded-full px-3 py-1 bg-primary/10 text-primary text-xs font-semibold">
              {lang === 'ar' ? 'أحدث المعاملات' : 'Recent activity'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="font-bold py-3.5 ps-6">#</TableHead>
                  <TableHead className="font-bold py-3.5">{t('orders.title')}</TableHead>
                  <TableHead className="font-bold py-3.5">{lang === 'ar' ? 'السعر' : 'Price'}</TableHead>
                  <TableHead className="font-bold py-3.5 pe-6">{lang === 'ar' ? 'تاريخ الجدولة' : 'Scheduled Date'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.isPending ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/20">
                      <TableCell colSpan={4} className="py-4 ps-6 pe-6">
                        <Skeleton className="h-6 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : recentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground text-sm font-medium">
                      {lang === 'ar' ? 'لا توجد طلبات حديثة' : 'No recent orders found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentList.map((o) => {
                    const s = String(o.status);
                    return (
                      <TableRow key={o.id} className="hover:bg-muted/40 transition-colors border-b border-border/20 group">
                        <TableCell className="font-mono text-xs font-bold py-4 ps-6">
                          <Link
                            to={`/provider/orders/${o.id}`}
                            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 group-hover:underline decoration-primary/45"
                          >
                            <span>{o.id.slice(0, 8)}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge kind="order" value={s} />
                        </TableCell>
                        <TableCell className="font-semibold py-4">
                          {formatMoneyMinor(o.totalMinor ?? null, 'QAR', lang)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-4 pe-6 font-medium">
                          {formatDateTimeQatar(o.scheduledAt ?? o.createdAt ?? null, 'PPp', lang)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Redesigned KPI component matching premium glassmorphism spec
function Kpi({
  label,
  value,
  loading,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  loading?: boolean;
  icon: typeof Star;
  color: 'indigo' | 'violet' | 'emerald' | 'amber';
  subtitle?: string;
}) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <Card className="glass-panel border-white/10 shadow-md relative overflow-hidden rounded-2xl glow-hover transition-all duration-300">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </CardTitle>
        <div className={`p-2.5 rounded-xl border ${colorMap[color]} shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-32 rounded-lg mt-1" />
        ) : (
          <div className="flex flex-col">
            <div className="text-3xl font-black tracking-tight">{value}</div>
            {subtitle && (
              <span className="text-[10px] font-semibold text-muted-foreground/80 mt-1.5 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-primary" />
                <span>{subtitle}</span>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
