import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  useDeleteStaff,
  useProviderStaff,
  type ProviderStaff,
} from '@/api/provider-staff.api';
import { StaffForm } from '@/features/staff/StaffForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useRoles } from '@/hooks/useRoles';

function roleLabel(role: ProviderStaff['role'], t: (key: string) => string) {
  if (role === 'owner' || role === 'provider_owner') return t('staff.role.owner');
  return t('staff.role.staff');
}

export default function ProviderStaffPage() {
  const { t } = useTranslation('provider');
  const { has } = useRoles();
  const canEdit = has('provider_owner');

  const { data: staff = [], isPending } = useProviderStaff();
  const del = useDeleteStaff();

  const [editing, setEditing] = useState<ProviderStaff | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProviderStaff | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: ProviderStaff) {
    setEditing(s);
    setFormOpen(true);
  }
  async function onConfirmDelete() {
    if (!pendingDelete) return;
    await del.mutateAsync(pendingDelete.id);
    toast.success(t('deleted'));
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('staff.title')}</h1>
          {!canEdit ? (
            <p className="text-xs text-muted-foreground">{t('staff.viewOnly')}</p>
          ) : null}
        </div>
        {canEdit ? (
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" />
            {t('staff.new')}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('staff.table.name')}</TableHead>
                <TableHead>{t('staff.table.email')}</TableHead>
                <TableHead>{t('staff.table.phone')}</TableHead>
                <TableHead>{t('staff.table.role')}</TableHead>
                <TableHead>{t('staff.table.rating')}</TableHead>
                <TableHead>{t('staff.table.active')}</TableHead>
                {canEdit ? (
                  <TableHead className="text-end">{t('staff.table.actions')}</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={canEdit ? 7 : 6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canEdit ? 7 : 6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('staff.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.displayName ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{s.email ?? '—'}</TableCell>
                    <TableCell>{s.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabel(s.role, t)}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.ratingAvg !== null && s.ratingAvg !== undefined
                        ? Number(s.ratingAvg).toFixed(2)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {(s.active ?? s.status !== 'suspended') ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    {canEdit ? (
                      <TableCell className="text-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(s)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canEdit ? (
        <>
          <StaffForm staff={editing} open={formOpen} onOpenChange={setFormOpen} />
          <DeleteConfirmDialog
            open={!!pendingDelete}
            onOpenChange={(o) => !o && setPendingDelete(null)}
            title={t('staff.delete.title')}
            body={t('staff.delete.body')}
            confirmLabel={t('staff.delete.confirm')}
            loading={del.isPending}
            onConfirm={() => void onConfirmDelete()}
          />
        </>
      ) : null}
    </div>
  );
}
