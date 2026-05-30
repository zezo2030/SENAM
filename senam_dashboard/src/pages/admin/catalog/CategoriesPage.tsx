import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useCategories,
  useDeleteCategory,
  type Category,
} from '@/api/admin-catalog.api';
import { CategoryForm } from '@/features/catalog/CategoryForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { resolveMediaUrl } from '@/lib/media-url';

export default function AdminCategoriesPage() {
  const { t } = useTranslation('catalog');
  const { data, isPending } = useCategories();
  const del = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const categories = data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
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
        <h1 className="text-2xl font-semibold">{t('categories.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />
          {t('categories.new')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('table.icon')}</TableHead>
                <TableHead>{t('table.nameAr')}</TableHead>
                <TableHead>{t('table.nameEn')}</TableHead>
                <TableHead>{t('table.slug')}</TableHead>
                <TableHead>{t('table.sortOrder')}</TableHead>
                <TableHead>{t('table.active')}</TableHead>
                <TableHead className="text-end">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('categories.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c) => {
                  const iconSrc =
                    (c.iconKey as string | undefined) ??
                    (c.icon_key as string | undefined) ??
                    (c.iconUrl as string | undefined) ??
                    '';
                  const nameAr =
                    (c.nameAr as string | undefined) ??
                    (c.name_ar as string | undefined);
                  const nameEn =
                    (c.nameEn as string | undefined) ??
                    (c.name_en as string | undefined);
                  const sortOrder =
                    (c.sortOrder as number | undefined) ??
                    (c.sort_order as number | undefined) ??
                    0;
                  const isActive =
                    c.active ??
                    c.isActive ??
                    c.is_active ??
                    false;
                  return (
                  <TableRow key={c.id}>
                    <TableCell>
                      {iconSrc ? (
                        <img
                          src={resolveMediaUrl(iconSrc)}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover border bg-muted/30"
                          onError={(ev) => {
                            (ev.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md border border-dashed bg-muted/30" />
                      )}
                    </TableCell>
                    <TableCell dir="rtl">{nameAr ?? '—'}</TableCell>
                    <TableCell>{nameEn ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.slug ?? '—'}</TableCell>
                    <TableCell>{sortOrder}</TableCell>
                    <TableCell>
                      {isActive ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(c)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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

      <CategoryForm category={editing} open={formOpen} onOpenChange={setFormOpen} />
      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={t('delete.title')}
        body={t('delete.body')}
        confirmLabel={t('delete.confirm')}
        loading={del.isPending}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}
