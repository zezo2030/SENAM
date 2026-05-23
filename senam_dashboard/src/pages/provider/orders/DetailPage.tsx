import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, Radio, ArrowRight, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useAssignStaff,
  useProviderOrder,
  useTransitionStatus,
  nextStatus,
} from '@/api/provider-orders.api';
import { useProviderStaff } from '@/api/provider-staff.api';
import { useOrderRealtime } from '@/hooks/useSocket';
import { useRoles } from '@/hooks/useRoles';
import { OrderTimeline } from '@/components/shared/OrderTimeline';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUiStore } from '@/store/ui.store';
import { formatDateTimeQatar, formatMoneyMinor } from '@/lib/formatters';
import type { OrderStatus } from '@/types/domain';

const UNASSIGNED = '__unassigned__';

export default function ProviderOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['orders', 'provider']);
  const lang = useUiStore((s) => s.lang);
  const { has } = useRoles();
  const isOwner = has('provider_owner');

  useOrderRealtime(id);
  const { data: order, isPending, isError } = useProviderOrder(id);
  const { data: staff = [] } = useProviderStaff();
  const transition = useTransitionStatus(id);
  const assign = useAssignStaff(id);

  const [staffPick, setStaffPick] = useState<string>(UNASSIGNED);
  useEffect(() => {
    if (order?.assignedStaffId) setStaffPick(order.assignedStaffId);
    else setStaffPick(UNASSIGNED);
  }, [order?.assignedStaffId]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-semibold">{t('detail.notFound')}</h1>
        <Link to="/provider/orders" className="text-primary underline">
          ← {t('provider:orders.title')}
        </Link>
      </div>
    );
  }

  const s = String(order.status);
  const sLabel = t(`status.${s}`, { defaultValue: s });
  const target = nextStatus(s);

  async function onTransition() {
    if (!target) return;
    try {
      await transition.mutateAsync({ to: target as OrderStatus });
      toast.success(t('provider:orders.transition.success'));
    } catch {
      toast.error(t('provider:orders.transition.fail'));
    }
  }

  async function onAssign(staffId: string) {
    setStaffPick(staffId);
    if (staffId === UNASSIGNED) return;
    await assign.mutateAsync({ staffId });
    toast.success(t('provider:orders.assign.success'));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/provider/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="me-1 inline h-4 w-4" />
          {t('provider:orders.title')}
        </Link>
        <h1 className="text-2xl font-semibold">
          {t('detail.title', { id: order.id.slice(0, 8) })}
        </h1>
        <StatusBadge kind="order" value={s} label={sLabel} />
        <div className="ms-auto flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-emerald-500" />
            {t('detail.realtime')}
          </div>
          {target ? (
            <Button onClick={() => void onTransition()} disabled={transition.isPending}>
              {transition.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="me-2 h-4 w-4" />
              )}
              {t(`status.${target}`, { defaultValue: target })}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('detail.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline history={order.history} currentStatus={s} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detail.customer')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>
                {order.customerName ?? order.customerEmail ?? order.customerId ?? '—'}
              </div>
              {order.addressLine ? (
                <div className="text-muted-foreground">{order.addressLine}</div>
              ) : null}
            </CardContent>
          </Card>

          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('provider:orders.assign')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={staffPick}
                  onValueChange={(v) => void onAssign(v)}
                  disabled={assign.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('provider:orders.assign.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED} disabled>
                      {t('provider:orders.assign.placeholder')}
                    </SelectItem>
                    {staff.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.displayName ?? m.email ?? m.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : order.assignedStaffId ? (
            <Card>
              <CardContent className="pt-4 text-sm">
                <div className="text-xs text-muted-foreground">
                  Staff: {order.assignedStaffId}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detail.paymentMethod')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="uppercase">{order.paymentMethod ?? '—'}</div>
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>{t('detail.subtotal')}</span>
                <span>{formatMoneyMinor(order.subtotalMinor ?? null, 'QAR', lang)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('detail.discount')}</span>
                <span>{formatMoneyMinor(order.discountMinor ?? null, 'QAR', lang)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t('detail.total')}</span>
                <span>{formatMoneyMinor(order.totalMinor ?? null, 'QAR', lang)}</span>
              </div>
            </CardContent>
          </Card>

          {order.scheduledAt ? (
            <Card>
              <CardContent className="pt-4 text-sm text-muted-foreground">
                {formatDateTimeQatar(order.scheduledAt, 'PPpp', lang)}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
