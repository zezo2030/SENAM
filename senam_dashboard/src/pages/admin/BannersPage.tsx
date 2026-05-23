import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  useBanners,
  useDeleteBanner,
  type Banner,
} from '@/api/admin-banners.api';
import { BannerForm } from '@/features/banners/BannerForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';

export default function AdminBannersPage() {
  const { t, i18n } = useTranslation('banners');
  const { data, isPending } = useBanners();
  const del = useDeleteBanner();

  const [editing, setEditing] = useState<Banner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  const banners = data ?? [];
  const lang = i18n.language;
  const fmtDate = (s?: string | null) =>
    s ? new Date(s).toLocaleString(lang === 'ar' ? 'ar' : 'en') : '—';

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(b: Banner) {
    setEditing(b);
    setFormOpen(true);
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;
    await del.mutateAsync(pendingDelete.id);
    toast.success(t('deleted'));
    setPendingDelete(null);
  }

  if (formOpen) {
    return (
      <BannerForm
        banner={editing}
        onCancel={() => setFormOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button 
          onClick={openCreate}
          className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98] h-10 px-5"
        >
          <Plus className="me-2 h-4 w-4" />
          {t('new')}
        </Button>
      </div>

      <Card className="glass-panel border-white/10 shadow-xl overflow-hidden rounded-2xl glow-hover">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.image')}</TableHead>
                <TableHead>{t('table.titleAr')}</TableHead>
                <TableHead>{t('table.target')}</TableHead>
                <TableHead>{t('table.window')}</TableHead>
                <TableHead>{t('table.sortOrder')}</TableHead>
                <TableHead>{t('table.active')}</TableHead>
                <TableHead className="text-end">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/40 transition-colors border-b border-border/20">
                    <TableCell>
                      {b.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.imageUrl}
                          alt={b.titleAr}
                          className="h-10 w-16 rounded object-cover shadow-sm border border-border/40"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell dir="rtl" className="font-semibold">{b.titleAr}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {b.targetType
                        ? `${b.targetType}${b.targetId ? `: ${b.targetId}` : ''}`
                        : b.linkUrl
                          ? b.linkUrl
                          : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {b.startsAt || b.endsAt ? (
                        <div className="space-y-0.5">
                          <div>{fmtDate(b.startsAt)}</div>
                          <div className="text-muted-foreground text-[10px]">
                            → {fmtDate(b.endsAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t('always')}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">{b.sortOrder}</TableCell>
                    <TableCell>
                      {b.isActive ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      ) : (
                        <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/45" />
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="icon" className="rounded-lg hover:bg-muted" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg hover:bg-muted"
                        onClick={() => setPendingDelete(b)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
