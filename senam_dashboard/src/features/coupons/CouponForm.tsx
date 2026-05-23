import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUiStore } from '@/store/ui.store';

import {
  useCreateCoupon,
  useUpdateCoupon,
  type Coupon,
  type CouponScope,
} from '@/api/admin-coupons.api';
import type { CouponKind } from '@/types/domain';

const schema = z.object({
  code: z.string().min(1).transform((s) => s.toUpperCase()),
  kind: z.enum(['percent', 'fixed']),
  amount: z.coerce.number().min(0),
  minOrderQar: z.coerce.number().min(0).default(0),
  scope: z.enum(['all', 'category', 'company', 'service']).default('all'),
  scopeId: z.string().optional(),
  maxUses: z.coerce.number().int().min(0).optional(),
  maxUsesPerUser: z.coerce.number().int().min(0).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  active: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  coupon: Coupon | null;
  onCancel: () => void;
}

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
function toIso(d?: string): string | undefined {
  if (!d) return undefined;
  return new Date(`${d}T00:00:00.000Z`).toISOString();
}

export function CouponForm({ coupon, onCancel }: Props) {
  const { t } = useTranslation('coupons');
  const lang = useUiStore((s) => s.lang);
  const isEdit = !!coupon;
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const pending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      kind: 'percent',
      amount: 10,
      minOrderQar: 0,
      scope: 'all',
      scopeId: '',
      maxUses: 0,
      maxUsesPerUser: 0,
      validFrom: '',
      validTo: '',
      active: true,
    },
  });

  useEffect(() => {
    const kind = (coupon?.kind ?? 'percent') as CouponKind;
    const amount =
      coupon?.value === undefined
        ? kind === 'percent'
          ? 10
          : 0
        : kind === 'percent'
          ? Number(coupon.value) / 100
          : Number(coupon.value) / 100;
    const scopeId =
      coupon?.scopeCategoryId ??
      coupon?.scopeCompanyId ??
      coupon?.scopeServiceId ??
      '';
    form.reset({
      code: coupon?.code ?? '',
      kind,
      amount,
      minOrderQar:
        coupon?.minOrderMinor === undefined || coupon?.minOrderMinor === null
          ? 0
          : Number(coupon.minOrderMinor) / 100,
      scope: (coupon?.scope ?? 'all') as CouponScope,
      scopeId,
      maxUses: coupon?.maxUses ?? 0,
      maxUsesPerUser: coupon?.maxUsesPerUser ?? 0,
      validFrom: toDateInput(coupon?.validFrom),
      validTo: toDateInput(coupon?.validTo),
      active: coupon?.active ?? true,
    });
  }, [coupon, form]);

  const kind = form.watch('kind');
  const scope = form.watch('scope');

  const onSubmit = form.handleSubmit(async (values) => {
    const value =
      values.kind === 'percent'
        ? Math.round(values.amount * 100) // % → bps
        : Math.round(values.amount * 100); // QAR → minor units
    const payload: Partial<Coupon> = {
      code: values.code,
      kind: values.kind,
      value,
      minOrderMinor: Math.round((values.minOrderQar ?? 0) * 100),
      scope: values.scope,
      scopeCategoryId: values.scope === 'category' ? values.scopeId : null,
      scopeCompanyId: values.scope === 'company' ? values.scopeId : null,
      scopeServiceId: values.scope === 'service' ? values.scopeId : null,
      maxUses: values.maxUses ? values.maxUses : null,
      maxUsesPerUser: values.maxUsesPerUser ? values.maxUsesPerUser : null,
      validFrom: toIso(values.validFrom),
      validTo: toIso(values.validTo),
      active: values.active,
    };
    
    try {
      if (isEdit && coupon) {
        await update.mutateAsync({ id: coupon.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(t('saved'));
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving coupon');
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4 border-border/40">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl border-border/60 hover:bg-muted hover:text-foreground transition-colors"
            onClick={onCancel}
            disabled={pending}
          >
            {lang === 'ar' ? (
              <ArrowRight className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {isEdit ? t('edit') : t('new')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'أنشئ خصومات وعروضاً ترويجية جديدة للعملاء والمستخدمين.'
                : 'Create new promotional discount campaigns and coupons for users.'}
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Coupon Layout Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Column 1: Financial & Core Settings */}
          <Card className="glass-panel border-white/10 shadow-xl rounded-2xl glow-hover p-6 space-y-4">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b pb-2 border-border/20">
              {lang === 'ar' ? 'تفاصيل الخصم والقيمة' : 'Discount Value & Setup'}
            </h2>

            {/* Coupon Code Input */}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('form.code')}
              </Label>
              <Input
                id="code"
                dir="ltr"
                className="uppercase rounded-xl border-border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 h-10 transition-all font-bold tracking-widest text-base"
                placeholder="PROMO50"
                {...form.register('code')}
              />
            </div>

            {/* Kind & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('form.kind')}
                </Label>
                <Select
                  value={kind}
                  onValueChange={(v) => form.setValue('kind', v as CouponKind, { shouldDirty: true })}
                >
                  <SelectTrigger className="rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-primary/20 h-10 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="percent">{t('kind.percent')}</SelectItem>
                    <SelectItem value="fixed">{t('kind.fixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Field
                id="amount"
                label={kind === 'percent' ? t('form.valuePercent') : t('form.valueQar')}
                type="number"
                step="0.01"
                min={0}
                register={form.register('amount')}
              />
            </div>

            {/* Minimum Order Limit */}
            <Field
              id="minOrderQar"
              label={t('form.minOrderQar')}
              type="number"
              step="0.01"
              min={0}
              register={form.register('minOrderQar')}
            />

            {/* Status Switch Toggle */}
            <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20 border-border/40 transition-all pt-3">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="coupon-active" className="font-bold text-sm">
                  {t('form.active')}
                </Label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {lang === 'ar'
                    ? 'سيتمكن العملاء من استخدام هذا الكوبون فور تنشيطه.'
                    : 'The coupon will be redeemable by clients immediately upon activation.'}
                </span>
              </div>
              <Switch
                id="coupon-active"
                checked={form.watch('active')}
                onCheckedChange={(v) => form.setValue('active', v, { shouldDirty: true })}
              />
            </div>
          </Card>

          {/* Column 2: Scope & Limits */}
          <Card className="glass-panel border-white/10 shadow-xl rounded-2xl glow-hover p-6 space-y-4">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b pb-2 border-border/20">
              {lang === 'ar' ? 'حدود الاستخدام والنطاق' : 'Scope & Usage Constraints'}
            </h2>

            {/* Scope Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('form.scope')}
                </Label>
                <Select
                  value={scope}
                  onValueChange={(v) =>
                    form.setValue('scope', v as CouponScope, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-primary/20 h-10 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{t('scope.all')}</SelectItem>
                    <SelectItem value="category">{t('scope.category')}</SelectItem>
                    <SelectItem value="company">{t('scope.company')}</SelectItem>
                    <SelectItem value="service">{t('scope.service')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Field
                id="scopeId"
                label={t('form.scopeId')}
                dir="ltr"
                disabled={scope === 'all'}
                register={form.register('scopeId')}
              />
            </div>

            {/* Usage Caps */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="maxUses"
                label={t('form.maxUses')}
                type="number"
                min={0}
                register={form.register('maxUses')}
              />
              <Field
                id="maxUsesPerUser"
                label={t('form.maxUsesPerUser')}
                type="number"
                min={0}
                register={form.register('maxUsesPerUser')}
              />
            </div>

            {/* Scheduling validity dates */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="validFrom"
                label={t('form.validFrom')}
                type="date"
                register={form.register('validFrom')}
              />
              <Field
                id="validTo"
                label={t('form.validTo')}
                type="date"
                register={form.register('validTo')}
              />
            </div>
          </Card>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-4 border-border/40">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-border/60 hover:bg-muted font-bold transition-colors h-11 px-6"
            onClick={onCancel}
            disabled={pending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98] h-11 px-8 flex items-center justify-center gap-2"
            disabled={pending}
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>{isEdit ? t('form.save') : t('form.create')}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  dir?: 'ltr' | 'rtl';
  error?: string;
  disabled?: boolean;
  step?: string;
  min?: number;
  register: UseFormRegisterReturn;
}

function Field({ id, label, type = 'text', dir, error, disabled, step, min, register }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        dir={dir}
        disabled={disabled}
        step={step}
        min={min}
        className="rounded-xl border-border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 h-10 transition-all font-medium disabled:opacity-50"
        {...register}
      />
      {error ? <p className="text-xs text-destructive font-semibold mt-1">{error}</p> : null}
    </div>
  );
}
