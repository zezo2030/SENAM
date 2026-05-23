import { useState, useEffect } from 'react';
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
import { useApproveSettlement, type Settlement } from '@/api/admin-settlements.api';

interface Props {
  settlement: Settlement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApproveSettlementDialog({ settlement, open, onOpenChange }: Props) {
  const { t } = useTranslation(['settlements', 'common']);
  const [reference, setReference] = useState('');
  const approve = useApproveSettlement();

  useEffect(() => {
    if (open) setReference(settlement?.payoutReference ?? '');
  }, [open, settlement]);

  if (!settlement) return null;

  const onConfirm = async () => {
    await approve.mutateAsync({
      id: settlement.id,
      payoutReference: reference.trim() || undefined,
    });
    toast.success(t('approve.success'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('approve.title')}</DialogTitle>
          <DialogDescription>{t('approve.body')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="payout-ref">{t('approve.reference')}</Label>
          <Input
            id="payout-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approve.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={() => void onConfirm()} disabled={approve.isPending}>
            {approve.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('approve.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
