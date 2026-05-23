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
import { useUpdateUserStatus, type AdminUser } from '@/api/admin-users.api';

interface Props {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BanUserDialog({ user, open, onOpenChange }: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const [reason, setReason] = useState('');
  const mutation = useUpdateUserStatus();

  if (!user) return null;

  const onConfirm = async () => {
    if (!reason.trim()) return;
    await mutation.mutateAsync({
      id: user.id,
      status: 'banned',
      reason: reason.trim(),
    });
    toast.success(t('users.ban.success'));
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason('');
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.ban.title')}</DialogTitle>
          <DialogDescription>
            {user.displayName ?? user.email ?? user.id}
            <br />
            {t('users.ban.body')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ban-reason">{t('users.ban.reason')}</Label>
          <Input
            id="ban-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={mutation.isPending || !reason.trim()}
          >
            {mutation.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('users.ban.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
