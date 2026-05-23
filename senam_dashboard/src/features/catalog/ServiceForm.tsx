import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateService,
  useUpdateService,
  type Service,
  type Category,
} from '@/api/admin-catalog.api';

const schema = z.object({
  categoryId: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1),
  basePriceQar: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().int().min(1),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  active: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  service: Service | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceForm({ service, categories, open, onOpenChange }: Props) {
  const { t } = useTranslation('catalog');
  const isEdit = !!service;
  const create = useCreateService();
  const update = useUpdateService();
  const pending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: '',
      nameAr: '',
      nameEn: '',
      slug: '',
      basePriceQar: 0,
      durationMinutes: 30,
      descriptionAr: '',
      descriptionEn: '',
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      const priceMinor = service?.basePriceMinor;
      const priceQar =
        priceMinor === undefined || priceMinor === null
          ? 0
          : Number(priceMinor) / 100;
      form.reset({
        categoryId: service?.categoryId ?? categories[0]?.id ?? '',
        nameAr: service?.nameAr ?? '',
        nameEn: service?.nameEn ?? '',
        slug: service?.slug ?? '',
        basePriceQar: priceQar,
        durationMinutes: service?.durationMinutes ?? 30,
        descriptionAr: service?.descriptionAr ?? '',
        descriptionEn: service?.descriptionEn ?? '',
        active: service?.active ?? true,
      });
    }
  }, [open, service, categories, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: Partial<Service> = {
      categoryId: values.categoryId,
      nameAr: values.nameAr,
      nameEn: values.nameEn,
      slug: values.slug,
      basePriceMinor: Math.round(values.basePriceQar * 100),
      durationMinutes: values.durationMinutes,
      descriptionAr: values.descriptionAr,
      descriptionEn: values.descriptionEn,
      active: values.active,
    };
    if (isEdit && service) {
      await update.mutateAsync({ id: service.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    toast.success(t('saved'));
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('services.edit') : t('services.new')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>{t('form.category')}</Label>
            <Select
              value={form.watch('categoryId')}
              onValueChange={(v) => form.setValue('categoryId', v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameEn ?? c.nameAr ?? c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId ? (
              <p className="text-xs text-destructive">{t('form.required')}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nameAr">{t('form.nameAr')}</Label>
            <Input id="nameAr" dir="rtl" {...form.register('nameAr')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nameEn">{t('form.nameEn')}</Label>
            <Input id="nameEn" dir="ltr" {...form.register('nameEn')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">{t('form.slug')}</Label>
            <Input id="slug" dir="ltr" {...form.register('slug')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="basePriceQar">{t('form.basePriceQar')}</Label>
              <Input
                id="basePriceQar"
                type="number"
                step="0.01"
                min={0}
                {...form.register('basePriceQar')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationMinutes">{t('form.durationMin')}</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={1}
                {...form.register('durationMinutes')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descriptionAr">{t('form.descriptionAr')}</Label>
            <Textarea
              id="descriptionAr"
              dir="rtl"
              rows={2}
              {...form.register('descriptionAr')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descriptionEn">{t('form.descriptionEn')}</Label>
            <Textarea
              id="descriptionEn"
              dir="ltr"
              rows={2}
              {...form.register('descriptionEn')}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="service-active">{t('form.active')}</Label>
            <Switch
              id="service-active"
              checked={form.watch('active')}
              onCheckedChange={(v) => form.setValue('active', v, { shouldDirty: true })}
            />
          </div>

          <SheetFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? t('form.save') : t('form.create')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
