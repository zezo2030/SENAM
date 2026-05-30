import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  Check,
  Ban,
  Globe,
  Phone,
  Mail,
  AtSign,
  MapPin,
  Image as ImageIcon,
  FileText,
  Tag,
  Crown,
  Sparkles,
  KeyRound,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAdminCompanyDetail } from '@/api/admin-companies.api';
import { ApproveDialog } from '@/features/companies/ApproveDialog';
import { SuspendDialog } from '@/features/companies/SuspendDialog';
import { ResetPasswordDialog } from '@/features/companies/ResetPasswordDialog';
import { formatDate } from '@/lib/formatters';
import { resolveMediaUrl } from '@/lib/media-url';
import { getFeatureIcon } from '@/lib/feature-icons';
import { useUiStore } from '@/store/ui.store';

/** Render a value, falling back to an em-dash for null/undefined/blank. */
function orDash(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '—';
  const s = String(value).trim();
  return s.length ? s : '—';
}

const PLAN_LABEL: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  vip: 'VIP',
};

const PERIOD_LABEL: Record<string, string> = {
  monthly: 'شهري',
  annual: 'سنوي',
  promo: 'الأشهر',
};

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('admin');
  const lang = useUiStore((s) => s.lang);
  const [dialog, setDialog] = useState<
    'approve' | 'suspend' | 'resetPassword' | null
  >(null);

  const { data, isPending } = useAdminCompanyDetail(id);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border p-10 text-center text-muted-foreground">
        لم يتم العثور على الشركة.
      </div>
    );
  }

  const status = String(data.status);
  const photos = data.portfolioPhotos ?? [];
  const services = data.services ?? [];
  const docs = data.documents ?? [];
  const owners = data.owners ?? [];
  const features = data.features ?? [];
  const logoUrl = data.logoObjectKey ? resolveMediaUrl(data.logoObjectKey) : '';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link to="/admin/companies">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={data.displayName ?? data.legalName ?? ''}
              className="h-12 w-12 rounded-2xl border object-cover"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background:
                  'linear-gradient(135deg, hsl(220,80%,56%), hsl(262,83%,58%))',
              }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {data.displayName ?? data.legalName ?? data.id}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{data.legalName}</span>
              {data.slug && <span>· {data.slug}</span>}
              {data.createdAt && (
                <span>· {formatDate(data.createdAt, 'PP', lang)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            kind="company"
            value={status}
            label={t(`companies.status.${status}`, status)}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={status === 'active'}
            onClick={() => setDialog('approve')}
          >
            <Check className="me-2 h-4 w-4 text-emerald-500" />
            {t('companies.approve.confirm')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={status === 'suspended'}
            onClick={() => setDialog('suspend')}
          >
            <Ban className="me-2 h-4 w-4 text-amber-500" />
            {t('companies.suspend.confirm')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={owners.filter((o) => o.role === 'owner').length === 0}
            onClick={() => setDialog('resetPassword')}
          >
            <KeyRound className="me-2 h-4 w-4 text-violet-500" />
            تعيين كلمة المرور
          </Button>
        </div>
      </div>

      {/* ── Plan + Subscription highlight ── */}
      {data.subscriptionPlan && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  الباقة المختارة
                </div>
                <div className="text-xl font-bold">
                  {PLAN_LABEL[data.subscriptionPlan] ?? data.subscriptionPlan}
                  {data.subscriptionPeriod && (
                    <span className="ms-2 text-sm font-medium text-muted-foreground">
                      ({PERIOD_LABEL[data.subscriptionPeriod] ?? data.subscriptionPeriod})
                    </span>
                  )}
                </div>
              </div>
            </div>
            {data.subscriptionPrice != null && (
              <div className="text-end">
                <div className="text-xs text-muted-foreground">السعر</div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {(data.subscriptionPrice / 100).toFixed(2)} ر.ق
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Company info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="السجل التجاري">
              {data.hasCommercialRegistration === false
                ? 'لا يوجد'
                : data.commercialRegistrationNo ?? '—'}
            </InfoRow>
            <InfoRow label="الوصف">
              <span className="whitespace-pre-line text-muted-foreground">
                {orDash(data.description)}
              </span>
            </InfoRow>
            <InfoRow label="المنطقة / المدينة" icon={<MapPin className="h-4 w-4" />}>
              {[data.region, data.city].filter(Boolean).join(' — ') || '—'}
            </InfoRow>
            <InfoRow label="ملاحظات">
              <span className="whitespace-pre-line text-muted-foreground">
                {orDash(data.additionalNotes)}
              </span>
            </InfoRow>
          </CardContent>
        </Card>

        {/* ── Contact info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">معلومات التواصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="الجوال / واتساب" icon={<Phone className="h-4 w-4" />}>
              {orDash(data.phone)}
            </InfoRow>
            <InfoRow label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />}>
              {orDash(data.email)}
            </InfoRow>
            <InfoRow label="الهاتف الثابت" icon={<Phone className="h-4 w-4" />}>
              {orDash(data.landline)}
            </InfoRow>
            <InfoRow label="رابط واتساب">
              {data.whatsappLink ? (
                <a
                  href={data.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {data.whatsappLink}
                </a>
              ) : (
                '—'
              )}
            </InfoRow>
            <InfoRow label="الموقع" icon={<Globe className="h-4 w-4" />}>
              {data.website ? (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {data.website}
                </a>
              ) : (
                '—'
              )}
            </InfoRow>
            <InfoRow label="إنستغرام" icon={<AtSign className="h-4 w-4" />}>
              {orDash(data.instagram)}
            </InfoRow>
          </CardContent>
        </Card>

        {/* ── Services offered ── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" /> الخدمات التي تقدمها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 && !data.customServiceText ? (
              <div className="text-sm text-muted-foreground">لم تُحدد خدمات.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <Badge key={s.id} variant="secondary">
                    {s.nameAr}
                  </Badge>
                ))}
                {data.customServiceText && (
                  <Badge variant="outline" className="border-amber-500/50">
                    <Sparkles className="me-1 h-3 w-3" />
                    {data.customServiceText}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Features / highlights ── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> المميزات
              <span className="ms-1 text-xs text-muted-foreground">
                ({features.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {features.length === 0 ? (
              <div className="text-sm text-muted-foreground">لم تُحدد مميزات.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {features.map((f, i) => {
                  const icon = getFeatureIcon(f.icon);
                  const Icon = icon?.Icon;
                  return (
                    <Badge key={`${f.ar}-${i}`} variant="secondary" className="gap-1">
                      {Icon && <Icon className="h-3 w-3" />}
                      {f.ar || f.en}
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Owner login accounts ── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> بيانات دخول لوحة الشركة
              <span className="ms-1 text-xs text-muted-foreground">
                ({owners.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {owners.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                لم يتم إنشاء حساب مالك بعد.
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {owners.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{o.email}</span>
                      <Badge variant={o.role === 'owner' ? 'default' : 'secondary'}>
                        {o.role === 'owner' ? 'مالك' : 'موظف'}
                      </Badge>
                      <Badge
                        variant={o.status === 'active' ? 'outline' : 'destructive'}
                      >
                        {o.status === 'active' ? 'نشط' : 'موقوف'}
                      </Badge>
                    </div>
                    {o.displayName && (
                      <span className="text-xs text-muted-foreground">
                        {o.displayName}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Portfolio photos ── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" /> أعمال سابقة
              <span className="ms-1 text-xs text-muted-foreground">({photos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-sm text-muted-foreground">لم يتم رفع صور.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {photos.map((p) => (
                  <a
                    key={p.objectKey}
                    href={resolveMediaUrl(p.objectKey)}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square overflow-hidden rounded-xl border bg-muted/30"
                  >
                    <img
                      src={resolveMediaUrl(p.objectKey)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── KYC documents ── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> وثائق التحقق (KYC)
              <span className="ms-1 text-xs text-muted-foreground">({docs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docs.length === 0 ? (
              <div className="text-sm text-muted-foreground">لم يتم رفع وثائق.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {docs.map((d, i) => (
                  <li
                    key={`${d.kind}-${i}`}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <span className="font-medium">{d.kind}</span>
                    <code className="text-xs text-muted-foreground">{d.objectKey}</code>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ApproveDialog
        company={data}
        open={dialog === 'approve'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <SuspendDialog
        company={data}
        open={dialog === 'suspend'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <ResetPasswordDialog
        company={data}
        open={dialog === 'resetPassword'}
        onOpenChange={(o) => !o && setDialog(null)}
      />
    </div>
  );
}

function InfoRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-end font-medium">{children}</div>
    </div>
  );
}
