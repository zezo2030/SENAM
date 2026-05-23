import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useIntervene,
  type InterveneAction,
  type IntervenePayload,
} from '@/api/admin-orders.api';

interface Props {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InterveneDialog({ orderId, open, onOpenChange }: Props) {
  const { t } = useTranslation(['orders', 'common']);
  const intervene = useIntervene(orderId);
  const [action, setAction] = useState<InterveneAction>('cancel');
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [staffId, setStaffId] = useState('');

  useEffect(() => {
    if (!open) {
      setAction('cancel');
      setReason('');
      setRefundAmount('');
      setStaffId('');
    }
  }, [open]);

  const refundValid =
    action !== 'refund' || (Number.isFinite(Number(refundAmount)) && Number(refundAmount) > 0);
  const reassignValid = action !== 'reassign' || staffId.trim().length > 0;
  const canSubmit = reason.trim().length > 0 && refundValid && reassignValid;

  const onSubmit = async () => {
    if (!canSubmit) return;
    const payload: IntervenePayload = { action, reason: reason.trim() };
    if (action === 'refund') {
      payload.refundAmountMinor = Math.round(Number(refundAmount) * 100);
    }
    if (action === 'reassign') {
      payload.staffId = staffId.trim();
    }
    await intervene.mutateAsync(payload);
    toast.success(t('intervene.success'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('intervene.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t('intervene.action')}</Label>
            <Select value={action} onValueChange={(v) => setAction(v as InterveneAction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cancel">{t('intervene.action.cancel')}</SelectItem>
                <SelectItem value="refund">{t('intervene.action.refund')}</SelectItem>
                <SelectItem value="reassign">{t('intervene.action.reassign')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'refund' ? (
            <div className="space-y-2">
              <Label htmlFor="refund-amount">{t('intervene.refundAmount')}</Label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
          ) : null}

          {action === 'reassign' ? (
            <div className="space-y-2">
              <Label htmlFor="staff-id">{t('intervene.staffId')}</Label>
              <Input
                id="staff-id"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="reason">{t('intervene.reason')}</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={intervene.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={!canSubmit || intervene.isPending}
          >
            {intervene.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('intervene.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
