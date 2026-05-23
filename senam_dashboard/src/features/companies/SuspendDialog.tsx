import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSuspendCompany, type AdminCompany } from '@/api/admin-companies.api';

interface Props {
  company: AdminCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuspendDialog({ company, open, onOpenChange }: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const [reason, setReason] = useState('');
  const suspend = useSuspendCompany();

  if (!company) return null;

  const onConfirm = async () => {
    if (!reason.trim()) return;
    await suspend.mutateAsync({ id: company.id, reason: reason.trim() });
    toast.success(t('companies.suspend.success'));
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setReason(''); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('companies.suspend.title')}</DialogTitle>
          <DialogDescription>
            {company.displayName ?? company.legalName ?? company.id}
            <br />
            {t('companies.suspend.body')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">{t('companies.suspend.reason')}</Label>
          <Input
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={suspend.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={suspend.isPending || !reason.trim()}
          >
            {suspend.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('companies.suspend.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
