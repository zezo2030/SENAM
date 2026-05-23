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

import {
  useCreateCategory,
  useUpdateCategory,
  type Category,
} from '@/api/admin-catalog.api';

const schema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1),
  iconUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      iconUrl: '',
      sortOrder: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nameAr: category?.nameAr ?? '',
        nameEn: category?.nameEn ?? '',
        slug: category?.slug ?? '',
        iconUrl: category?.iconUrl ?? '',
        sortOrder: category?.sortOrder ?? 0,
        active: category?.active ?? true,
      });
    }
  }, [open, category, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && category) {
      await update.mutateAsync({ id: category.id, ...values });
    } else {
      await create.mutateAsync(values);
    }
    toast.success(t('saved'));
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
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
          <Field
            id="iconUrl"
            label={t('form.iconUrl')}
            dir="ltr"
            register={form.register('iconUrl')}
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
