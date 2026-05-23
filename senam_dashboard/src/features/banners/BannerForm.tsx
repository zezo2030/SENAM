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
import { ImageUpload } from '@/components/shared/ImageUpload';
import { useUiStore } from '@/store/ui.store';

import {
  useCreateBanner,
  useUpdateBanner,
  type Banner,
} from '@/api/admin-banners.api';

const schema = z.object({
  titleAr: z.string().min(1),
  titleEn: z.string().optional(),
  subtitleAr: z.string().optional(),
  subtitleEn: z.string().optional(),
  imageUrl: z.string().min(1),
  linkUrl: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  banner: Banner | null;
  onCancel: () => void;
}

const TARGET_TYPES = ['none', 'category', 'service', 'company', 'external'];

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(local?: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function BannerForm({ banner, onCancel }: Props) {
  const { t } = useTranslation('banners');
  const lang = useUiStore((s) => s.lang);
  const isEdit = !!banner;
  const create = useCreateBanner();
  const update = useUpdateBanner();
  const pending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titleAr: '',
      titleEn: '',
      subtitleAr: '',
      subtitleEn: '',
      imageUrl: '',
      linkUrl: '',
      targetType: 'none',
      targetId: '',
      sortOrder: 0,
      isActive: true,
      startsAt: '',
      endsAt: '',
    },
  });

  useEffect(() => {
    form.reset({
      titleAr: banner?.titleAr ?? '',
      titleEn: banner?.titleEn ?? '',
      subtitleAr: banner?.subtitleAr ?? '',
      subtitleEn: banner?.subtitleEn ?? '',
      imageUrl: banner?.imageUrl ?? '',
      linkUrl: banner?.linkUrl ?? '',
      targetType: banner?.targetType ?? 'none',
      targetId: banner?.targetId ?? '',
      sortOrder: banner?.sortOrder ?? 0,
      isActive: banner?.isActive ?? true,
      startsAt: toDatetimeLocal(banner?.startsAt),
      endsAt: toDatetimeLocal(banner?.endsAt),
    });
  }, [banner, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      titleAr: values.titleAr,
      titleEn: values.titleEn || undefined,
      subtitleAr: values.subtitleAr || undefined,
      subtitleEn: values.subtitleEn || undefined,
      imageUrl: values.imageUrl,
      linkUrl: values.linkUrl || undefined,
      targetType: values.targetType === 'none' ? undefined : values.targetType,
      targetId: values.targetId || undefined,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      startsAt: fromDatetimeLocal(values.startsAt),
      endsAt: fromDatetimeLocal(values.endsAt),
    };

    try {
      if (isEdit && banner) {
        await update.mutateAsync({ id: banner.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(t('saved'));
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving banner');
    }
  });

  const imageUrl = form.watch('imageUrl');
  const targetType = form.watch('targetType');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Sub-Page Header */}
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
                ? 'أدخل بيانات البانر الإعلاني واحفظ التغييرات لعرضها للمستخدمين.'
                : 'Enter banner details and save changes to display them to users.'}
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Form Container */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Column 1: Content details */}
          <Card className="glass-panel border-white/10 shadow-xl rounded-2xl glow-hover p-6 space-y-4">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b pb-2 border-border/20">
              {lang === 'ar' ? 'المحتوى الإعلاني' : 'Advertising Content'}
            </h2>

            <Field
              id="titleAr"
              label={t('form.titleAr')}
              dir="rtl"
              error={form.formState.errors.titleAr?.message}
              register={form.register('titleAr')}
            />
            <Field
              id="titleEn"
              label={t('form.titleEn')}
              dir="ltr"
              register={form.register('titleEn')}
            />
            <Field
              id="subtitleAr"
              label={t('form.subtitleAr')}
              dir="rtl"
              register={form.register('subtitleAr')}
            />
            <Field
              id="subtitleEn"
              label={t('form.subtitleEn')}
              dir="ltr"
              register={form.register('subtitleEn')}
            />

            {/* Banner Image Upload */}
            <div className="space-y-1.5 pt-2">
              <ImageUpload
                label={t('form.imageUrl')}
                purpose="banner_image"
                value={imageUrl}
                onChange={(v) =>
                  form.setValue('imageUrl', v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.imageUrl ? (
                <p className="text-xs text-destructive font-semibold">
                  {form.formState.errors.imageUrl.message}
                </p>
              ) : null}
            </div>
          </Card>

          {/* Column 2: Parameters and Behavior */}
          <Card className="glass-panel border-white/10 shadow-xl rounded-2xl glow-hover p-6 space-y-4">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-b pb-2 border-border/20">
              {lang === 'ar' ? 'خيارات الاستهداف والجدولة' : 'Targeting & Scheduling'}
            </h2>

            {/* Target Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('form.targetType')}
              </Label>
              <Select
                value={targetType}
                onValueChange={(v) => form.setValue('targetType', v, { shouldDirty: true })}
              >
                <SelectTrigger className="rounded-xl border-border bg-background/50 focus:ring-2 focus:ring-primary/20 h-10 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {TARGET_TYPES.map((tt) => (
                    <SelectItem key={tt} value={tt}>
                      {t(`form.target.${tt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetType && targetType !== 'none' && targetType !== 'external' ? (
              <Field
                id="targetId"
                label={t('form.targetId')}
                dir="ltr"
                register={form.register('targetId')}
              />
            ) : null}

            {targetType === 'external' ? (
              <Field
                id="linkUrl"
                label={t('form.linkUrl')}
                dir="ltr"
                register={form.register('linkUrl')}
              />
            ) : null}

            {/* Scheduling dates */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="startsAt"
                label={t('form.startsAt')}
                type="datetime-local"
                register={form.register('startsAt')}
              />
              <Field
                id="endsAt"
                label={t('form.endsAt')}
                type="datetime-local"
                register={form.register('endsAt')}
              />
            </div>

            {/* Sort order */}
            <Field
              id="sortOrder"
              label={t('form.sortOrder')}
              type="number"
              register={form.register('sortOrder')}
            />

            {/* Status Switcher */}
            <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20 border-border/40 transition-all">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="isActive" className="font-bold text-sm">
                  {t('form.isActive')}
                </Label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {lang === 'ar'
                    ? 'سيظهر هذا البانر للمستخدمين فوراً عند تنشيطه.'
                    : 'The banner will immediately display when activated.'}
                </span>
              </div>
              <Switch
                id="isActive"
                checked={form.watch('isActive')}
                onCheckedChange={(v) =>
                  form.setValue('isActive', v, { shouldDirty: true })
                }
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
  register: UseFormRegisterReturn;
}

function Field({ id, label, type = 'text', dir, error, register }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        dir={dir}
        className="rounded-xl border-border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 h-10 transition-all font-medium"
        {...register}
      />
      {error ? <p className="text-xs text-destructive font-semibold mt-1">{error}</p> : null}
    </div>
  );
}
