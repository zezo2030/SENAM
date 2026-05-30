import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
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
import { ImageUpload } from '@/components/shared/ImageUpload';

import {
  useCreateCategory,
  useUpdateCategory,
  type Category,
} from '@/api/admin-catalog.api';

const schema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1),
  iconKey: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function readIcon(c: Category | null): string {
  return (
    (c?.iconKey as string | undefined) ??
    (c?.icon_key as string | undefined) ??
    (c?.iconUrl as string | undefined) ??
    ''
  );
}

function readActive(c: Category | null): boolean {
  if (c?.active !== undefined) return Boolean(c.active);
  if (c?.isActive !== undefined) return Boolean(c.isActive);
  if (c?.is_active !== undefined) return Boolean(c.is_active);
  return true;
}

function readNameAr(c: Category | null): string {
  return (c?.nameAr as string | undefined) ?? (c?.name_ar as string | undefined) ?? '';
}
function readNameEn(c: Category | null): string {
  return (c?.nameEn as string | undefined) ?? (c?.name_en as string | undefined) ?? '';
}
function readSortOrder(c: Category | null): number {
  return (c?.sortOrder as number | undefined) ?? (c?.sort_order as number | undefined) ?? 0;
}

export function CategoryForm({ category, open, onOpenChange }: Props) {
  const { t } = useTranslation('catalog');
  const isEdit = !!category;
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const pending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      slug: '',
      iconKey: '',
      sortOrder: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nameAr: readNameAr(category),
        nameEn: readNameEn(category),
        slug: category?.slug ?? '',
        iconKey: readIcon(category),
        sortOrder: readSortOrder(category),
        active: readActive(category),
      });
    }
  }, [open, category, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      nameAr: values.nameAr,
      nameEn: values.nameEn,
      slug: values.slug,
      iconKey: values.iconKey || undefined,
      sortOrder: values.sortOrder,
      isActive: values.active,
    };
    if (isEdit && category) {
      await update.mutateAsync({ id: category.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    toast.success(t('saved'));
    onOpenChange(false);
  });

  const iconValue = form.watch('iconKey') ?? '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('categories.edit') : t('categories.new')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <Field
            id="nameAr"
            label={t('form.nameAr')}
            dir="rtl"
            error={form.formState.errors.nameAr?.message}
            register={form.register('nameAr')}
          />
          <Field
            id="nameEn"
            label={t('form.nameEn')}
            dir="ltr"
            error={form.formState.errors.nameEn?.message}
            register={form.register('nameEn')}
          />
          <Field
            id="slug"
            label={t('form.slug')}
            dir="ltr"
            error={form.formState.errors.slug?.message}
            register={form.register('slug')}
          />

          <ImageUpload
            label={t('form.icon')}
            purpose="category_icon"
            value={iconValue}
            onChange={(v) =>
              form.setValue('iconKey', v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <Field
            id="sortOrder"
            label={t('form.sortOrder')}
            type="number"
            register={form.register('sortOrder')}
          />
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="active">{t('form.active')}</Label>
            <Switch
              id="active"
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
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} dir={dir} {...register} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
