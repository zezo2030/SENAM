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
import { ImageUpload } from '@/components/shared/ImageUpload';
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
import { localizedName } from '@/lib/catalog-labels';
import { useUiStore } from '@/store/ui.store';

const schema = z.object({
  categoryId: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1),
  iconKey: z.string().optional().default(''),
  imageKey: z.string().optional().default(''),
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

function readField(s: Service | null, ...keys: string[]): string {
  if (!s) return '';
  for (const k of keys) {
    const v = s[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return '';
}

export function ServiceForm({ service, categories, open, onOpenChange }: Props) {
  const { t } = useTranslation('catalog');
  const lang = useUiStore((s) => s.lang);
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
      iconKey: '',
      imageKey: '',
      descriptionAr: '',
      descriptionEn: '',
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId:
          (service?.categoryId as string | undefined) ??
          (service?.category_id as string | undefined) ??
          categories[0]?.id ??
          '',
        nameAr:
          (service?.nameAr as string | undefined) ??
          (service?.name_ar as string | undefined) ??
          '',
        nameEn:
          (service?.nameEn as string | undefined) ??
          (service?.name_en as string | undefined) ??
          '',
        slug: service?.slug ?? '',
        iconKey: readField(service, 'iconKey', 'icon_key', 'iconUrl'),
        imageKey: readField(service, 'imageKey', 'image_key', 'imageUrl'),
        descriptionAr:
          (service?.descriptionAr as string | undefined) ??
          (service?.description_ar as string | undefined) ??
          '',
        descriptionEn:
          (service?.descriptionEn as string | undefined) ??
          (service?.description_en as string | undefined) ??
          '',
        active:
          (service?.active as boolean | undefined) ??
          (service?.isActive as boolean | undefined) ??
          (service?.is_active as boolean | undefined) ??
          true,
      });
    }
  }, [open, service, categories, form]);

  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const iconValue = form.watch('iconKey') ?? '';
  const imageValue = form.watch('imageKey') ?? '';

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: Partial<Service> = {
      categoryId: values.categoryId,
      nameAr: values.nameAr,
      nameEn: values.nameEn,
      slug: values.slug,
      iconKey: values.iconKey || undefined,
      imageKey: values.imageKey || undefined,
      descriptionAr: values.descriptionAr,
      descriptionEn: values.descriptionEn,
      isActive: values.active,
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
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('services.edit') : t('services.new')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>{t('form.category')}</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(v) => form.setValue('categoryId', v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.category')}>
                  {selectedCategory
                    ? (localizedName(selectedCategory, lang) ?? selectedCategory.slug)
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {localizedName(c, lang) ?? c.slug ?? '—'}
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

          <ImageUpload
            label={t('form.icon')}
            purpose="service_icon"
            value={iconValue}
            onChange={(v) =>
              form.setValue('iconKey', v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <ImageUpload
            label={t('form.image')}
            purpose="service_image"
            value={imageValue}
            onChange={(v) =>
              form.setValue('imageKey', v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

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
