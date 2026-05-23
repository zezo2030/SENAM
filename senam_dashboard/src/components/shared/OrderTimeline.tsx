import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle } from 'lucide-react';
import { useUiStore } from '@/store/ui.store';
import { formatDateTimeQatar } from '@/lib/formatters';
import type { OrderHistoryEntry } from '@/api/admin-orders.api';

interface Props {
  history: OrderHistoryEntry[] | undefined;
  currentStatus?: string;
}

export function OrderTimeline({ history, currentStatus }: Props) {
  const { t } = useTranslation('orders');
  const lang = useUiStore((s) => s.lang);
  const entries = history ?? [];

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {currentStatus
          ? t(`status.${currentStatus}`, { defaultValue: currentStatus })
          : '—'}
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <li key={`${entry.at}-${entry.status}-${i}`} className="flex items-start gap-3">
            {isLast ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {t(`status.${entry.status}`, { defaultValue: String(entry.status) })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTimeQatar(entry.at, 'PPpp', lang)}
                {entry.actor ? ` · ${entry.actor}` : ''}
              </p>
              {entry.reason ? (
                <p className="text-xs text-muted-foreground">{entry.reason}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
