import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, ExternalLink, ImageOff, Loader2, Pencil, Plus, Trash2, Wrench } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FEATURE_ICON_OPTIONS, getFeatureIcon } from '@/lib/feature-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

import {
  useProviderCompany,
  useUpdateProviderCompany,
  useSetLogo,
  useSetCover,
  useGalleryCategories,
  useCreateGalleryCategory,
  useUpdateGalleryCategory,
  useDeleteGalleryCategory,
  useGalleryPhotos,
  useCreateGalleryPhoto,
  useDeleteGalleryPhoto,
  useProviderServices,
  useUpdateProviderServices,
  type CompanyDetail,
  type LocalizedLabel,
  type GalleryCategory,
  type ProviderCatalogService,
} from '@/api/provider-profile.api';
import { uploadAndGetKey } from '@/lib/api/uploads';
import { resolveMediaUrl } from '@/lib/media-url';

/**
 * Layout for the provider's "company page" editor. The actual sections
 * (identity, media, contacts, location, features, gallery) live in the
 * main left sidebar as separate routes; this layout loads the company
 * once and shares it with each child page via `useOutletContext`.
 */
export default function ProviderProfileLayout() {
  const { data, isPending } = useProviderCompany();

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return <Outlet context={{ company: data }} />;
}

function useCompany(): CompanyDetail {
  return useOutletContext<{ company: CompanyDetail }>().company;
}

export function IdentityPage() {
  return <IdentitySection company={useCompany()} />;
}
export function MediaPage() {
  return <MediaSection company={useCompany()} />;
}
export function ContactsPage() {
  return <ContactsSection company={useCompany()} />;
}
export function LocationPage() {
  return <LocationSection company={useCompany()} />;
}
export function ServicesPage() {
  return <ServicesSection />;
}
export function FeaturesPage() {
  return <FeaturesSection company={useCompany()} />;
}
export function GalleryPage() {
  return <GallerySection company={useCompany()} />;
}

/* ── Identity ─────────────────────────────────────────────────────────── */

function IdentitySection({ company }: { company: CompanyDetail }) {
  const { t } = useTranslation('provider');
  const update = useUpdateProviderCompany();
  const [displayName, setDisplayName] = useState(company.displayName);
  const [description, setDescription] = useState(company.description ?? '');

  const save = async () => {
    await update.mutateAsync({ displayName, description });
    toast.success(t('profile.saved'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('section.identity')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          id="legalName"
          label={t('identity.legalName')}
          value={company.legalName}
          readOnly
        />
        <Field
          id="slug"
          label={t('identity.slug')}
          value={company.slug}
          readOnly
        />
        <Field
          id="displayName"
          label={t('identity.displayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <div className="space-y-1.5">
          <Label htmlFor="description">{t('identity.description')}</Label>
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t('identity.descriptionHint')}
          </p>
        </div>
        <div className="flex justify-end">
          <SaveButton pending={update.isPending} onClick={save}>
            {t('identity.save')}
          </SaveButton>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Media ────────────────────────────────────────────────────────────── */

function MediaSection({ company }: { company: CompanyDetail }) {
  const { t } = useTranslation('provider');
  const setLogo = useSetLogo();
  const setCover = useSetCover();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ImageUploaderCard
        title={t('media.logo')}
        hint={t('media.logoHint')}
        aspect="aspect-square"
        currentUrl={company.logoUrl}
        purpose="company_logo"
        pending={setLogo.isPending}
        onUploaded={async (key) => {
          await setLogo.mutateAsync(key);
          toast.success(t('media.uploaded'));
        }}
      />
      <ImageUploaderCard
        title={t('media.cover')}
        hint={t('media.coverHint')}
        aspect="aspect-[16/9]"
        currentUrl={company.coverUrl}
        purpose="company_cover"
        pending={setCover.isPending}
        onUploaded={async (key) => {
          await setCover.mutateAsync(key);
          toast.success(t('media.uploaded'));
        }}
      />
    </div>
  );
}

function ImageUploaderCard({
  title,
  hint,
  aspect,
  currentUrl,
  purpose,
  pending,
  onUploaded,
}: {
  title: string;
  hint: string;
  aspect: string;
  currentUrl: string | null;
  purpose: 'company_logo' | 'company_cover' | 'gallery_photo';
  pending: boolean;
  onUploaded: (objectKey: string) => Promise<void>;
}) {
  const { t } = useTranslation('provider');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const key = await uploadAndGetKey(file, purpose);
      await onUploaded(key);
    } catch {
      toast.error(t('media.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={`${aspect} w-full overflow-hidden rounded-xl border bg-muted/40 flex items-center justify-center`}
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(currentUrl)}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff className="h-10 w-10 text-muted-foreground/50" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading || pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              void handleFile(f);
            }}
          />
          <span
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground cursor-pointer transition hover:opacity-90 ${uploading || pending ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {(uploading || pending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? t('media.uploading') : t('media.uploadAndSave')}
          </span>
        </label>
      </CardContent>
    </Card>
  );
}

/* ── Contacts ─────────────────────────────────────────────────────────── */

function ContactsSection({ company }: { company: CompanyDetail }) {
  const { t } = useTranslation('provider');
  const update = useUpdateProviderCompany();
  const [whatsappLink, setW] = useState(company.contacts.whatsappLink ?? '');
  const [phone, setPhone] = useState(company.contacts.phone ?? '');
  const [landline, setLandline] = useState(company.contacts.landline ?? '');
  const [instagram, setInstagram] = useState(company.contacts.instagram ?? '');
  const [email, setEmail] = useState(company.contacts.email ?? '');
  const [website, setWebsite] = useState(company.contacts.website ?? '');

  const save = async () => {
    await update.mutateAsync({
      whatsappLink,
      phone,
      landline,
      instagram,
      email,
      website,
    });
    toast.success(t('profile.saved'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('section.contacts')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">{t('contacts.whatsapp')}</Label>
          <Input
            id="whatsapp"
            dir="ltr"
            type="tel"
            inputMode="tel"
            placeholder="97455551234"
            value={whatsappLink}
            onChange={(e) => setW(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t('contacts.whatsappHint')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label={t('contacts.phone')} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Field id="landline" label={t('contacts.landline')} dir="ltr" value={landline} onChange={(e) => setLandline(e.target.value)} />
          <Field id="instagram" label={t('contacts.instagram')} dir="ltr" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          <Field id="email" label={t('contacts.email')} dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field id="website" label={t('contacts.website')} dir="ltr" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <SaveButton pending={update.isPending} onClick={save}>
            {t('contacts.save')}
          </SaveButton>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Location ─────────────────────────────────────────────────────────── */

function LocationSection({ company }: { company: CompanyDetail }) {
  const { t } = useTranslation('provider');
  const update = useUpdateProviderCompany();
  const [city, setCity] = useState(company.location.city ?? '');
  const [region, setRegion] = useState(company.location.region ?? '');
  const [lat, setLat] = useState(company.location.latitude?.toString() ?? '');
  const [lng, setLng] = useState(company.location.longitude?.toString() ?? '');
  const [mapUrl, setMapUrl] = useState(company.location.mapUrl ?? '');

  const save = async () => {
    const patch: Record<string, unknown> = { city, region, mapUrl };
    if (lat) patch['latitude'] = Number(lat);
    if (lng) patch['longitude'] = Number(lng);
    await update.mutateAsync(patch);
    toast.success(t('profile.saved'));
  };

  const mapsHref =
    mapUrl ||
    (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('section.location')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label={t('location.city')} value={city} onChange={(e) => setCity(e.target.value)} />
          <Field id="region" label={t('location.region')} value={region} onChange={(e) => setRegion(e.target.value)} />
          <Field id="lat" label={t('location.latitude')} dir="ltr" type="number" value={lat} onChange={(e) => setLat(e.target.value)} />
          <Field id="lng" label={t('location.longitude')} dir="ltr" type="number" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mapUrl">{t('location.mapUrl')}</Label>
          <Input id="mapUrl" dir="ltr" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
          <p className="text-xs text-muted-foreground">{t('location.mapUrlHint')}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          {mapsHref && (
            <Button variant="outline" size="sm" asChild>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                {t('location.openInMaps')}
              </a>
            </Button>
          )}
          <SaveButton pending={update.isPending} onClick={save}>
            {t('location.save')}
          </SaveButton>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Services ─────────────────────────────────────────────────────────── */

function ServicesSection() {
  const { t, i18n } = useTranslation('provider');
  const { data, isPending } = useProviderServices();
  const update = useUpdateProviderServices();
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const selected = draft ?? new Set(data?.selectedServiceIds ?? []);
  const isAr = i18n.language?.startsWith('ar');

  const toggle = (serviceId: string) => {
    const next = new Set(selected);
    if (next.has(serviceId)) next.delete(serviceId);
    else next.add(serviceId);
    setDraft(next);
  };

  const save = async () => {
    const saved = await update.mutateAsync([...selected]);
    setDraft(new Set(saved.selectedServiceIds));
    toast.success(t('profile.saved'));
  };

  if (isPending || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeCategory =
    data.categories.find((category) => category.id === activeCategoryId) ??
    data.categories[0] ??
    null;

  const categoryLabel = (category: (typeof data.categories)[number]) =>
    isAr ? category.nameAr : category.nameEn ?? category.nameAr;

  const categorySelectedCount = (category: (typeof data.categories)[number]) =>
    category.services.filter((service) => selected.has(service.id)).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{t('section.services')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('services.subtitle')}
          </p>
        </div>
        <Badge variant="secondary">
          {selected.size} {t('services.selected')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('services.categories')}
            </p>
            <div className="space-y-1">
              {data.categories.map((category) => {
                const isActive = activeCategory?.id === category.id;
                const chosen = categorySelectedCount(category);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-start text-sm transition ${
                      isActive
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background hover:bg-muted/60'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {categoryLabel(category)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {category.services.length} {t('services.available')}
                      </span>
                    </span>
                    <Badge variant={chosen ? 'default' : 'outline'}>{chosen}</Badge>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-3">
            {activeCategory ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <div>
                      <h3 className="font-semibold">
                        {categoryLabel(activeCategory)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {categorySelectedCount(activeCategory)} {t('services.selected')}
                        {' / '}
                        {activeCategory.services.length} {t('services.available')}
                      </p>
                    </div>
                  </div>
                </div>

                {activeCategory.services.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    {t('services.categoryEmpty')}
                  </p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {activeCategory.services.map((service) => (
                      <ServiceChoice
                        key={service.id}
                        service={service}
                        checked={selected.has(service.id)}
                        label={isAr ? service.nameAr : service.nameEn ?? service.nameAr}
                        description={
                          isAr
                            ? service.descriptionAr
                            : service.descriptionEn ?? service.descriptionAr
                        }
                        onToggle={() => toggle(service.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                {t('services.noCategories')}
              </p>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t pt-4">
          <SaveButton pending={update.isPending} onClick={save}>
            {t('services.save')}
          </SaveButton>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceChoice({
  service,
  checked,
  label,
  description,
  onToggle,
}: {
  service: ProviderCatalogService;
  checked: boolean;
  label: string;
  description: string | null;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`min-h-24 rounded-lg border p-4 text-start transition ${
        checked
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border bg-background hover:bg-muted/60'
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-semibold">{label}</span>
          {description ? (
            <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            checked ? 'border-primary bg-primary text-primary-foreground' : ''
          }`}
        >
          {checked ? <Check className="h-4 w-4" /> : null}
        </span>
      </span>
      <span className="mt-3 block text-xs text-muted-foreground">
        {service.slug}
      </span>
    </button>
  );
}

/* ── Features ─────────────────────────────────────────────────────────── */

function FeaturesSection({ company }: { company: CompanyDetail }) {
  const { t, i18n } = useTranslation('provider');
  const update = useUpdateProviderCompany();
  const [items, setItems] = useState<LocalizedLabel[]>(company.features ?? []);
  const isAr = i18n.language?.startsWith('ar');

  const addRow = () => setItems((arr) => [...arr, { ar: '', en: '' }]);
  const updateRow = <K extends keyof LocalizedLabel>(i: number, key: K, value: LocalizedLabel[K]) =>
    setItems((arr) => arr.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeRow = (i: number) =>
    setItems((arr) => arr.filter((_, idx) => idx !== i));

  const save = async () => {
    const clean = items
      .map((r) => ({
        ar: r.ar.trim(),
        en: r.en.trim(),
        ...(r.icon ? { icon: r.icon } : {}),
      }))
      .filter((r) => r.ar && r.en);
    await update.mutateAsync({ features: clean });
    setItems(clean);
    toast.success(t('profile.saved'));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('section.features')}</CardTitle>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="me-2 h-4 w-4" />
          {t('features.add')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('features.empty')}
          </p>
        ) : (
          items.map((row, i) => {
            const selected = getFeatureIcon(row.icon);
            const SelectedIcon = selected?.Icon;
            return (
              <div
                key={i}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-end"
              >
                <div className="space-y-1.5">
                  {i === 0 && <Label className="text-xs">{t('features.icon')}</Label>}
                  <Select
                    value={row.icon ?? ''}
                    onValueChange={(v) => updateRow(i, 'icon', v || undefined)}
                  >
                    <SelectTrigger className="w-[64px] justify-center px-2">
                      <SelectValue
                        placeholder={
                          <span className="text-muted-foreground">—</span>
                        }
                      >
                        {SelectedIcon ? (
                          <SelectedIcon className="h-4 w-4" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {FEATURE_ICON_OPTIONS.map((opt) => {
                        const OptIcon = opt.Icon;
                        return (
                          <SelectItem key={opt.id} value={opt.id}>
                            <span className="flex items-center gap-2">
                              <OptIcon className="h-4 w-4" />
                              <span>{isAr ? opt.ar : opt.en}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  {i === 0 && <Label className="text-xs">{t('features.ar')}</Label>}
                  <Input
                    dir="rtl"
                    value={row.ar}
                    onChange={(e) => updateRow(i, 'ar', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  {i === 0 && <Label className="text-xs">{t('features.en')}</Label>}
                  <Input
                    dir="ltr"
                    value={row.en}
                    onChange={(e) => updateRow(i, 'en', e.target.value)}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeRow(i)}
                  aria-label="remove"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })
        )}
        <div className="flex justify-end pt-2">
          <SaveButton pending={update.isPending} onClick={save}>
            {t('features.save')}
          </SaveButton>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Gallery ──────────────────────────────────────────────────────────── */

function GallerySection({ company }: { company: CompanyDetail }) {
  const { t } = useTranslation('provider');
  const { data: categories = company.galleryCategories } = useGalleryCategories();
  const [activeCat, setActiveCat] = useState<string | null>(
    categories[0]?.id ?? null,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <CategoriesPanel
        categories={categories}
        activeId={activeCat}
        onSelect={setActiveCat}
      />
      <PhotosPanel
        categoryId={activeCat}
        categoryLabel={
          categories.find((c) => c.id === activeCat)?.ar ??
          t('gallery.photos.uncategorized')
        }
      />
    </div>
  );
}

function CategoriesPanel({
  categories,
  activeId,
  onSelect,
}: {
  categories: GalleryCategory[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation('provider');
  const createCat = useCreateGalleryCategory();
  const updateCat = useUpdateGalleryCategory();
  const deleteCat = useDeleteGalleryCategory();
  const [editing, setEditing] = useState<GalleryCategory | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GalleryCategory | null>(null);
  const [ar, setAr] = useState('');
  const [en, setEn] = useState('');

  const openNew = () => {
    setAr('');
    setEn('');
    setEditing('new');
  };
  const openEdit = (cat: GalleryCategory) => {
    setAr(cat.ar);
    setEn(cat.en);
    setEditing(cat);
  };
  const close = () => setEditing(null);

  const save = async () => {
    if (!ar.trim() || !en.trim()) return;
    if (editing === 'new') {
      const created = await createCat.mutateAsync({ ar, en });
      onSelect(created.id);
    } else if (editing) {
      await updateCat.mutateAsync({ id: editing.id, ar, en });
    }
    close();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteCat.mutateAsync(pendingDelete.id);
    if (activeId === pendingDelete.id) onSelect(null);
    setPendingDelete(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('gallery.categories')}</CardTitle>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`block w-full rounded-md px-3 py-2 text-start text-sm transition ${
            activeId === null ? 'bg-primary/15 font-semibold' : 'hover:bg-muted'
          }`}
        >
          {t('gallery.photos.uncategorized')}
        </button>
        {categories.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            {t('gallery.categories.empty')}
          </p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(cat.id)}
                className={`flex-1 rounded-md px-3 py-2 text-start text-sm transition ${
                  activeId === cat.id ? 'bg-primary/15 font-semibold' : 'hover:bg-muted'
                }`}
              >
                {cat.ar} <span className="text-xs text-muted-foreground">/ {cat.en}</span>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => openEdit(cat)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setPendingDelete(cat)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? t('gallery.categories.add') : t('section.gallery')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field id="cat-ar" label={t('features.ar')} dir="rtl" value={ar} onChange={(e) => setAr(e.target.value)} />
            <Field id="cat-en" label={t('features.en')} dir="ltr" value={en} onChange={(e) => setEn(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <SaveButton
              pending={createCat.isPending || updateCat.isPending}
              onClick={save}
            >
              {t('actions.save', { ns: 'common' })}
            </SaveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gallery.categories.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('gallery.categories.deleteConfirmBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('actions.delete', { ns: 'common' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function PhotosPanel({
  categoryId,
  categoryLabel,
}: {
  categoryId: string | null;
  categoryLabel: string;
}) {
  const { t } = useTranslation('provider');
  const { data: photos = [], isPending } = useGalleryPhotos(categoryId);
  const createPhoto = useCreateGalleryPhoto();
  const deletePhoto = useDeleteGalleryPhoto();
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const key = await uploadAndGetKey(file, 'gallery_photo');
      await createPhoto.mutateAsync({
        objectKey: key,
        ...(categoryId ? { categoryId } : {}),
      });
      toast.success(t('media.uploaded'));
    } catch {
      toast.error(t('media.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          {t('gallery.photos')} · <Badge variant="outline">{categoryLabel}</Badge>
        </CardTitle>
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              void handleFile(f);
            }}
          />
          <span
            className={`inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground cursor-pointer transition hover:opacity-90 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('gallery.photos.uploadAndAdd')}
          </span>
        </label>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('gallery.photos.empty')}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(p.objectKey)}
                  alt={p.captionAr ?? ''}
                  className="h-full w-full object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 end-2 h-8 w-8 opacity-0 transition group-hover:opacity-100"
                  onClick={() => setPendingDelete(p.id)}
                  aria-label={t('gallery.photos.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gallery.photos.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('gallery.photos.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDelete) {
                  await deletePhoto.mutateAsync(pendingDelete);
                  setPendingDelete(null);
                }
              }}
            >
              {t('actions.delete', { ns: 'common' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ── Shared ───────────────────────────────────────────────────────────── */

interface FieldExtra {
  id: string;
  label: string;
  dir?: 'ltr' | 'rtl';
  type?: string;
  readOnly?: boolean;
}
type FieldProps = FieldExtra &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof FieldExtra>;
const Field = ({ id, label, dir, type = 'text', readOnly, ...rest }: FieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} dir={dir} type={type} readOnly={readOnly} {...rest} />
  </div>
);

function SaveButton({
  pending,
  onClick,
  children,
}: {
  pending: boolean;
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <Button onClick={() => void onClick()} disabled={pending}>
      {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
