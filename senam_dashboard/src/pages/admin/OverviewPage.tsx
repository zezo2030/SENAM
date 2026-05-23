import { useMemo } from 'react';
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
import {
  Building2,
  ShoppingBag,
  Wallet,
  Banknote,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminCompanies } from '@/api/admin-companies.api';
import { useAdminOrders } from '@/api/admin-orders.api';
import { useSettlements } from '@/api/admin-settlements.api';
import { useSalesReport } from '@/api/admin-reports.api';
import { useUiStore } from '@/store/ui.store';
import { formatDate, formatMoneyMinor } from '@/lib/formatters';

function todayRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  return { from: `${day}T00:00:00.000Z`, to: `${day}T23:59:59.999Z` };
}

function pastNDaysRange(n: number): { from: string; to: string } {
  const now = new Date();
  const past = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return {
    from: past.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function AdminOverviewPage() {
  const { t } = useTranslation('admin');
  const lang = useUiStore((s) => s.lang);

  const today = useMemo(todayRange, []);
  const past14 = useMemo(() => pastNDaysRange(14), []);
  const past7 = useMemo(() => pastNDaysRange(7), []);

  const pending = useAdminCompanies({ status: 'pending' });
  const orders = useAdminOrders({ from: today.from, to: today.to });
  const settlements = useSettlements({ status: 'due' });
  const sales7d = useSalesReport({ from: past7.from, to: past7.to, granularity: 'day' });
  const sales14d = useSalesReport({ from: past14.from, to: past14.to, granularity: 'day' });

  const chartData = useMemo(
    () =>
      (sales14d.data?.buckets ?? []).map((b) => ({
        date: formatDate(b.date, 'MMM d', lang),
        gmv: Number(b.grossMinor ?? 0) / 100,
        orders: Number(b.orderCount ?? 0),
      })),
    [sales14d.data, lang],
  );

  return (
    <div className="space-y-6">
      {/* Dynamic Welcoming Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('overview.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' 
              ? 'مرحباً بك مجدداً في لوحة التحكم. إليك نظرة شاملة على أداء اليوم.' 
              : 'Welcome back to your administration dashboard. Here is today\'s overall metrics summary.'}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t('overview.pendingCompanies')}
          value={pending.data?.total?.toLocaleString(lang) ?? '—'}
          loading={pending.isPending}
          icon={Building2}
          color="indigo"
          subtitle={lang === 'ar' ? 'شركات بانتظار الموافقة' : 'Awaiting confirmation'}
        />
        <Kpi
          label={t('overview.ordersToday')}
          value={orders.data?.total?.toLocaleString(lang) ?? '—'}
          loading={orders.isPending}
          icon={ShoppingBag}
          color="violet"
          subtitle={lang === 'ar' ? 'طلبات جديدة اليوم' : 'Fresh orders processed'}
        />
        <Kpi
          label={t('overview.gmv7d')}
          value={formatMoneyMinor(sales7d.data?.gmvMinor ?? null, 'QAR', lang)}
          loading={sales7d.isPending}
          icon={Wallet}
          color="emerald"
          subtitle={lang === 'ar' ? 'إجمالي حجم المبيعات أسبوعياً' : 'Total gross volume (7d)'}
        />
        <Kpi
          label={t('overview.settlementsDue')}
          value={settlements.data?.total?.toLocaleString(lang) ?? '—'}
          loading={settlements.isPending}
          icon={Banknote}
          color="amber"
          subtitle={lang === 'ar' ? 'تسويات مستحقة الدفع' : 'Payout settlements pending'}
        />
      </div>

      {/* Main 14d Chart Card */}
      <Card className="glass-panel border-white/10 shadow-xl overflow-hidden rounded-2xl glow-hover">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>{t('overview.title')} · 14d</span>
            </CardTitle>
            <div className="rounded-full px-3 py-1 bg-primary/10 text-primary text-xs font-semibold">
              {lang === 'ar' ? 'محدث تلقائياً' : 'Live updates'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="h-[320px] pt-6 px-6">
          {sales14d.isPending ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm font-semibold">
              {lang === 'ar' ? 'لا توجد بيانات متاحة' : 'No report data available'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Premium Gradients for Recharts fill */}
                  <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                
                <XAxis 
                  dataKey="date" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                  stroke="currentColor" 
                  className="text-muted-foreground font-semibold"
                />
                <YAxis 
                  yAxisId="left" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-5} 
                  stroke="currentColor" 
                  className="text-muted-foreground font-semibold"
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={5} 
                  stroke="currentColor" 
                  className="text-muted-foreground font-semibold"
                />
                
                {/* Premium Floating Glass Tooltip */}
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel border-white/10 shadow-lg p-3 rounded-xl text-xs space-y-1.5 min-w-[120px]">
                          <p className="font-bold text-foreground border-b pb-1 mb-1 border-border/40">{label}</p>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground font-semibold">{t('overview.gmv7d')}:</span>
                            <span className="font-bold text-primary">{payload[0].value} QAR</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground font-semibold">{t('overview.ordersToday')}:</span>
                            <span className="font-bold text-destructive">{payload[1].value}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Bar
                  yAxisId="left"
                  dataKey="gmv"
                  fill="url(#gmvGradient)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1}
                  radius={[6, 6, 0, 0]}
                />
                
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
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
  icon: typeof Building2;
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
