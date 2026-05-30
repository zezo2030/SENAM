import { useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCategories,
  useDeleteService,
  useServices,
  type Service,
} from '@/api/admin-catalog.api';
import { ServiceForm } from '@/features/catalog/ServiceForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useUiStore } from '@/store/ui.store';
import {
  buildCategoryMap,
  localizedName,
  serviceCategoryLabel,
} from '@/lib/catalog-labels';
import { resolveMediaUrl } from '@/lib/media-url';

const ALL = '__all__';

function readUrl(s: Service, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = s[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

export default function AdminServicesPage() {
  const { t } = useTranslation('catalog');
  const lang = useUiStore((s) => s.lang);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<Service | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: services = [], isPending } = useServices(
    categoryFilter === ALL ? undefined : categoryFilter,
  );
  const del = useDeleteService();

  const categoryById = useMemo(() => buildCategoryMap(categories), [categories]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: Service) {
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
        <h1 className="text-2xl font-semibold">{t('services.title')}</h1>
        <Button onClick={openCreate} disabled={categories.length === 0}>
          <Plus className="me-2 h-4 w-4" />
          {t('services.new')}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t('services.filter.category')}
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('services.filter.allCategories')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {localizedName(c, lang) ?? c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.icon')}</TableHead>
                <TableHead>{t('table.image')}</TableHead>
                <TableHead>{t('table.nameAr')}</TableHead>
                <TableHead>{t('table.nameEn')}</TableHead>
                <TableHead>{t('table.category')}</TableHead>
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
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t('services.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                services.map((s) => {
                  const nameAr =
                    (s.nameAr as string | undefined) ??
                    (s.name_ar as string | undefined);
                  const nameEn =
                    (s.nameEn as string | undefined) ??
                    (s.name_en as string | undefined);
                  const isActive =
                    (s.active as boolean | undefined) ??
                    (s.isActive as boolean | undefined) ??
                    (s.is_active as boolean | undefined) ??
                    false;
                  const iconUrl = readUrl(s, 'iconKey', 'icon_key', 'iconUrl');
                  const imageUrl = readUrl(s, 'imageKey', 'image_key', 'imageUrl');
                  return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {iconUrl ? (
                        <img
                          src={resolveMediaUrl(iconUrl)}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {imageUrl ? (
                        <img
                          src={resolveMediaUrl(imageUrl)}
                          alt=""
                          className="h-10 w-16 rounded object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell dir="rtl">{nameAr ?? '—'}</TableCell>
                    <TableCell>{nameEn ?? '—'}</TableCell>
                    <TableCell>{serviceCategoryLabel(s, categoryById, lang)}</TableCell>
                    <TableCell>
                      {isActive ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
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
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ServiceForm
        service={editing}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
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
