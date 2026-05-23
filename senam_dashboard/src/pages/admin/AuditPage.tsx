import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  useAuditLogs,
  type AuditEntry,
  type AuditQuery,
} from '@/api/admin-audit.api';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';
import { JsonView } from '@/components/shared/JsonView';
import { useUiStore } from '@/store/ui.store';
import { formatDateTimeQatar } from '@/lib/formatters';

export default function AdminAuditPage() {
  const { t } = useTranslation(['audit', 'common']);
  const lang = useUiStore((s) => s.lang);

  const [draft, setDraft] = useState<AuditQuery>({});
  const [range, setRange] = useState<DateRange>({});
  const [applied, setApplied] = useState<AuditQuery>({});
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const params = useMemo<AuditQuery>(
    () => ({
      ...applied,
      from: range.from ? `${range.from}T00:00:00.000Z` : undefined,
      to: range.to ? `${range.to}T23:59:59.999Z` : undefined,
    }),
    [applied, range],
  );

  const { data, isPending } = useAuditLogs(params);
  const entries = data?.data ?? [];

  const apply = () => setApplied(draft);
  const clear = () => {
    setDraft({});
    setRange({});
    setApplied({});
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Field
            id="actor-id"
            label={t('filter.actorId')}
            value={draft.actorId ?? ''}
            onChange={(v) => setDraft({ ...draft, actorId: v })}
          />
          <Field
            id="target-type"
            label={t('filter.targetType')}
            value={draft.targetType ?? ''}
            onChange={(v) => setDraft({ ...draft, targetType: v })}
          />
          <Field
            id="target-id"
            label={t('filter.targetId')}
            value={draft.targetId ?? ''}
            onChange={(v) => setDraft({ ...draft, targetId: v })}
          />
          <Field
            id="action"
            label={t('filter.action')}
            value={draft.action ?? ''}
            onChange={(v) => setDraft({ ...draft, action: v })}
          />
          <DateRangeFilter value={range} onChange={setRange} />
          <div className="ms-auto flex gap-2">
            <Button variant="outline" onClick={clear}>
              {t('filter.clear')}
            </Button>
            <Button onClick={apply}>{t('filter.apply')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.at')}</TableHead>
                <TableHead>{t('table.actor')}</TableHead>
                <TableHead>{t('table.action')}</TableHead>
                <TableHead>{t('table.target')}</TableHead>
                <TableHead className="text-end">{t('table.details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => {
                  const targetType = e.targetType ?? e.targetKind ?? '—';
                  return (
                    <TableRow
                      key={e.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelected(e)}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTimeQatar(e.at, 'PPpp', lang)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.actorEmail ?? e.actorId ?? '—'}
                      </TableCell>
                      <TableCell>{e.action}</TableCell>
                      <TableCell className="text-xs">
                        <div>{targetType}</div>
                        {e.targetId ? (
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {e.targetId}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="sm">
                          {t('table.details')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('sheet.title')}</SheetTitle>
            {selected ? (
              <SheetDescription>
                {selected.action} ·{' '}
                {formatDateTimeQatar(selected.at, 'PPpp', lang)}
              </SheetDescription>
            ) : null}
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <JsonView value={selected ?? {}} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[180px]"
      />
    </div>
  );
}
