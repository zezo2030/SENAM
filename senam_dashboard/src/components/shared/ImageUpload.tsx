import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadImage, type UploadPurpose } from '@/lib/api/uploads';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (url: string) => void;
  purpose: UploadPurpose;
  label?: string;
  accept?: string;
  maxBytes?: number;
  className?: string;
}

const DEFAULT_MAX = 5 * 1024 * 1024; // 5MB

export function ImageUpload({
  value,
  onChange,
  purpose,
  label,
  accept = 'image/png,image/jpeg,image/webp',
  maxBytes = DEFAULT_MAX,
  className,
}: Props) {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!file) return;

    if (file.size > maxBytes) {
      toast.error(t('upload.tooLarge', { mb: Math.round(maxBytes / 1024 / 1024) }));
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file, purpose);
      onChange(url);
      toast.success(t('upload.success'));
    } catch {
      toast.error(t('upload.failed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label>{label}</Label> : null}

      {value ? (
        <div className="group relative overflow-hidden rounded-md border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="preview"
            className="h-40 w-full object-cover"
            onError={(ev) => {
              (ev.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute end-2 top-2 opacity-0 transition group-hover:opacity-100"
            onClick={() => onChange('')}
            aria-label={t('upload.remove')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="me-2 h-4 w-4" />
          )}
          {value ? t('upload.replace') : t('upload.choose')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => void onFile(e)}
        />
      </div>

      <Input
        type="url"
        dir="ltr"
        placeholder="https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
