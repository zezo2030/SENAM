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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateStaff,
  useUpdateStaff,
  type ProviderStaff,
  type ProviderStaffRole,
} from '@/api/provider-staff.api';

const schema = z.object({
  displayName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['provider_owner', 'provider_staff']),
  active: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  staff: ProviderStaff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeRole(role: ProviderStaff['role']): ProviderStaffRole {
  if (role === 'owner' || role === 'provider_owner') return 'provider_owner';
  return 'provider_staff';
}

export function StaffForm({ staff, open, onOpenChange }: Props) {
  const { t } = useTranslation(['provider', 'common']);
  const isEdit = !!staff;
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const pending = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      role: 'provider_staff',
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        displayName: staff?.displayName ?? '',
        email: staff?.email ?? '',
        phone: staff?.phone ?? '',
        role: normalizeRole(staff?.role),
        active: staff?.active ?? staff?.status !== 'suspended',
      });
    }
  }, [open, staff, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: Partial<ProviderStaff> = {
      displayName: values.displayName,
      email: values.email,
      phone: values.phone || null,
      role: values.role,
      active: values.active,
    };
    if (isEdit && staff) {
      await update.mutateAsync({ id: staff.id, ...payload });
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
          <SheetTitle>{isEdit ? t('staff.edit') : t('staff.new')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">{t('staff.form.displayName')}</Label>
            <Input id="displayName" {...form.register('displayName')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('staff.form.email')}</Label>
            <Input id="email" type="email" dir="ltr" {...form.register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('staff.form.phone')}</Label>
            <Input id="phone" type="tel" dir="ltr" {...form.register('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('staff.form.role')}</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(v) =>
                form.setValue('role', v as ProviderStaffRole, { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="provider_owner">{t('staff.role.owner')}</SelectItem>
                <SelectItem value="provider_staff">{t('staff.role.staff')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="staff-active">{t('staff.form.active')}</Label>
            <Switch
              id="staff-active"
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
              {isEdit ? t('actions.save', { ns: 'common' }) : t('actions.create', { ns: 'common' })}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
