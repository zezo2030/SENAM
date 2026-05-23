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
import { useApproveCompany, type AdminCompany } from '@/api/admin-companies.api';

interface Props {
  company: AdminCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApproveDialog({ company, open, onOpenChange }: Props) {
  const { t } = useTranslation('admin');
  const approve = useApproveCompany();

  if (!company) return null;

  const onConfirm = async () => {
    await approve.mutateAsync(company.id);
    toast.success(t('companies.approve.success'));
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('companies.approve.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {company.displayName ?? company.legalName ?? company.id}
            <br />
            {t('companies.approve.body')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approve.isPending}>
            {t('actions.cancel', { ns: 'common' })}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={approve.isPending}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {approve.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('companies.approve.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
