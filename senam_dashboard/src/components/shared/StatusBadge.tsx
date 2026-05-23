import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

const STYLES: Record<Variant, string> = {
  default: '',
  success: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  danger: 'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

const COMPANY_STATUS: Record<string, Variant> = {
  pending: 'warning',
  pending_review: 'warning',
  active: 'success',
  suspended: 'danger',
};

const ORDER_STATUS: Record<string, Variant> = {
  pending: 'warning',
  accepted: 'default',
  on_the_way: 'default',
  arrived: 'default',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'danger',
  unassignable: 'muted',
};

const SETTLEMENT_STATUS: Record<string, Variant> = {
  due: 'warning',
  paid: 'success',
  provider_owes: 'danger',
  void: 'muted',
};

const USER_STATUS: Record<string, Variant> = {
  active: 'success',
  banned: 'danger',
  deleted: 'muted',
};

const MAPS = {
  company: COMPANY_STATUS,
  order: ORDER_STATUS,
  settlement: SETTLEMENT_STATUS,
  user: USER_STATUS,
} as const;

interface Props {
  kind: keyof typeof MAPS;
  value: string;
  label?: string;
}

export function StatusBadge({ kind, value, label }: Props) {
  const variant = MAPS[kind][value] ?? 'default';
  return <Badge className={cn(STYLES[variant])}>{label ?? value}</Badge>;
}
