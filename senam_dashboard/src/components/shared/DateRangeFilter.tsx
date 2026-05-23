import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DateRange {
  from?: string;
  to?: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/**
 * Two ISO date inputs; values are YYYY-MM-DD which the parent should
 * promote to ISO timestamps before sending to the API.
 */
export function DateRangeFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="range-from" className="text-xs text-muted-foreground">
          {t('orders.filter.from', { defaultValue: 'From' })}
        </Label>
        <Input
          id="range-from"
          type="date"
          value={value.from ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
          className="w-[160px]"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="range-to" className="text-xs text-muted-foreground">
          {t('orders.filter.to', { defaultValue: 'To' })}
        </Label>
        <Input
          id="range-to"
          type="date"
          value={value.to ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
          className="w-[160px]"
        />
      </div>
    </div>
  );
}
