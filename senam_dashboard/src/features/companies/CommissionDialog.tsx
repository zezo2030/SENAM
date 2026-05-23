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
import { useUpdateCommission, type AdminCompany } from '@/api/admin-companies.api';

const MIN_PERCENT = 10;
const MAX_PERCENT = 25;

interface Props {
  company: AdminCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommissionDialog({ company, open, onOpenChange }: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const update = useUpdateCommission();
  const [percent, setPercent] = useState<string>('');

  useEffect(() => {
    if (company && open) {
      const bps = company.commissionBps ?? 1500;
      setPercent((bps / 100).toFixed(2));
    }
  }, [company, open]);

  if (!company) return null;

  const percentNum = Number(percent);
  const valid =
    Number.isFinite(percentNum) &&
    percentNum >= MIN_PERCENT &&
    percentNum <= MAX_PERCENT;

  const onSave = async () => {
    if (!valid) return;
    const commissionBps = Math.round(percentNum * 100);
    await update.mutateAsync({ id: company.id, commissionBps });
    toast.success(t('companies.commission.success'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('companies.commission.title')}</DialogTitle>
          <DialogDescription>
            {company.displayName ?? company.legalName ?? company.id}
            <br />
            {t('companies.commission.body')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="commission-percent">
            {t('companies.commission.label')} (%)
          </Label>
          <Input
            id="commission-percent"
            type="number"
            min={MIN_PERCENT}
            max={MAX_PERCENT}
            step="0.01"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            autoFocus
          />
          {!valid && percent !== '' ? (
            <p className="text-xs text-destructive">
              {MIN_PERCENT}% – {MAX_PERCENT}%
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={() => void onSave()} disabled={!valid || update.isPending}>
            {update.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('companies.commission.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
