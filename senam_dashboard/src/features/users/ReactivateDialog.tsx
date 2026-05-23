import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUpdateUserStatus, type AdminUser } from '@/api/admin-users.api';

interface Props {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReactivateUserDialog({ user, open, onOpenChange }: Props) {
  const { t } = useTranslation('admin');
  const mutation = useUpdateUserStatus();

  if (!user) return null;

  const onConfirm = async () => {
    await mutation.mutateAsync({ id: user.id, status: 'active' });
    toast.success(t('users.reactivate.success'));
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('users.reactivate.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {user.displayName ?? user.email ?? user.id}
            <br />
            {t('users.reactivate.body')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            {t('actions.cancel', { ns: 'common' })}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {mutation.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('users.reactivate.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
