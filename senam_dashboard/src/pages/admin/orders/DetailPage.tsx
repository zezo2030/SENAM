import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Radio, AlertOctagon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { useAdminOrder } from '@/api/admin-orders.api';
import { useOrderRealtime } from '@/hooks/useSocket';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderTimeline } from '@/components/shared/OrderTimeline';
import { InterveneDialog } from '@/features/orders/InterveneDialog';
import { useUiStore } from '@/store/ui.store';
import { formatDateTimeQatar, formatMoneyMinor } from '@/lib/formatters';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('orders');
  const lang = useUiStore((s) => s.lang);
  const [interveneOpen, setInterveneOpen] = useState(false);

  useOrderRealtime(id);
  const { data: order, isPending, isError } = useAdminOrder(id);

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
        <Link to="/admin/orders" className="text-primary underline">
          ← {t('title')}
        </Link>
      </div>
    );
  }

  const statusValue = String(order.status);
  const statusLabel = t(`status.${statusValue}`, { defaultValue: statusValue });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="me-1 inline h-4 w-4" />
          {t('title')}
        </Link>
        <h1 className="text-2xl font-semibold">{t('detail.title', { id: order.id.slice(0, 8) })}</h1>
        <StatusBadge kind="order" value={statusValue} label={statusLabel} />
        <div className="ms-auto flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-emerald-500" />
            {t('detail.realtime')}
          </div>
          <Button variant="destructive" onClick={() => setInterveneOpen(true)}>
            <AlertOctagon className="me-2 h-4 w-4" />
            {t('detail.intervene')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('detail.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline history={order.history} currentStatus={statusValue} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detail.customer')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>{order.customerName ?? order.customerEmail ?? order.customerId ?? '—'}</div>
              {order.addressLine ? (
                <div className="text-muted-foreground">{order.addressLine}</div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detail.company')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>{order.companyName ?? order.companyId ?? '—'}</div>
              {order.assignedStaffId ? (
                <div className="text-xs text-muted-foreground">Staff: {order.assignedStaffId}</div>
              ) : null}
            </CardContent>
          </Card>

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
              <div className="flex justify-between text-muted-foreground">
                <span>{t('detail.commission')}</span>
                <span>{formatMoneyMinor(order.commissionMinor ?? null, 'QAR', lang)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t('detail.total')}</span>
                <span>{formatMoneyMinor(order.totalMinor ?? null, 'QAR', lang)}</span>
              </div>
            </CardContent>
          </Card>

          {order.scheduledAt ? (
            <Card>
              <CardContent className="pt-4 text-sm">
                <div className="text-muted-foreground">
                  {formatDateTimeQatar(order.scheduledAt, 'PPpp', lang)}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <InterveneDialog
        orderId={order.id}
        open={interveneOpen}
        onOpenChange={setInterveneOpen}
      />
    </div>
  );
}
