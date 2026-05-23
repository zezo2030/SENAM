import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useProviderCompany,
  useUpdateProviderCompany,
  type ProviderCompany,
} from '@/api/provider-profile.api';
import { useRoles } from '@/hooks/useRoles';

const schema = z.object({
  displayNameAr: z.string().min(1),
  displayNameEn: z.string().min(1),
  legalName: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export default function ProviderProfilePage() {
  const { t } = useTranslation('provider');
  const { has } = useRoles();
  const canEdit = has('provider_owner');

  const { data, isPending } = useProviderCompany();
  const update = useUpdateProviderCompany();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayNameAr: '',
      displayNameEn: '',
      legalName: '',
      descriptionAr: '',
      descriptionEn: '',
      phone: '',
      contactEmail: '',
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      displayNameAr: data.displayNameAr ?? data.displayName ?? '',
      displayNameEn: data.displayNameEn ?? data.displayName ?? '',
      legalName: data.legalName ?? '',
      descriptionAr: data.descriptionAr ?? '',
      descriptionEn: data.descriptionEn ?? '',
      phone: data.phone ?? '',
      contactEmail: data.contactEmail ?? '',
    });
  }, [data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const patch: Partial<ProviderCompany> = {
      displayNameAr: values.displayNameAr,
      displayNameEn: values.displayNameEn,
      legalName: values.legalName,
      descriptionAr: values.descriptionAr,
      descriptionEn: values.descriptionEn,
      phone: values.phone,
      contactEmail: values.contactEmail || undefined,
    };
    await update.mutateAsync(patch);
    toast.success(t('profile.saved'));
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('profile.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data?.legalName ?? data?.displayName ?? '—'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="displayNameAr"
                label={t('profile.nameAr')}
                dir="rtl"
                {...form.register('displayNameAr')}
                disabled={!canEdit}
              />
              <Field
                id="displayNameEn"
                label={t('profile.nameEn')}
                dir="ltr"
                {...form.register('displayNameEn')}
                disabled={!canEdit}
              />
              <Field
                id="legalName"
                label={t('profile.legalName')}
                {...form.register('legalName')}
                disabled={!canEdit}
              />
              <Field
                id="phone"
                label={t('profile.phone')}
                type="tel"
                dir="ltr"
                {...form.register('phone')}
                disabled={!canEdit}
              />
              <Field
                id="contactEmail"
                label={t('profile.contactEmail')}
                type="email"
                dir="ltr"
                {...form.register('contactEmail')}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descriptionAr">{t('profile.descriptionAr')}</Label>
              <Textarea
                id="descriptionAr"
                dir="rtl"
                rows={3}
                {...form.register('descriptionAr')}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descriptionEn">{t('profile.descriptionEn')}</Label>
              <Textarea
                id="descriptionEn"
                dir="ltr"
                rows={3}
                {...form.register('descriptionEn')}
                disabled={!canEdit}
              />
            </div>

            {canEdit ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('profile.save')}
                </Button>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface FieldExtra {
  id: string;
  label: string;
  dir?: 'ltr' | 'rtl';
  type?: string;
  disabled?: boolean;
}

type FieldProps = FieldExtra &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof FieldExtra>;

const Field = ({ id, label, dir, type = 'text', disabled, ...rest }: FieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} dir={dir} type={type} disabled={disabled} {...rest} />
  </div>
);
