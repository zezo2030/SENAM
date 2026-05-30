/** Canonical path prefix for locally served uploads. */
export const UPLOADS_RAW_PREFIX = '/v1/uploads/raw/';

const UPLOAD_PURPOSES = [
  'profile_photo',
  'kyc_document',
  'review_photo',
  'company_logo',
  'company_cover',
  'portfolio_photo',
  'gallery_photo',
  'banner_image',
  'category_icon',
  'service_icon',
  'service_image',
] as const;

function isUploadObjectKey(value: string): boolean {
  return UPLOAD_PURPOSES.some((p) => value.startsWith(`${p}/`));
}

/**
 * Normalize upload URLs/keys to a host-independent stored path:
 * `/v1/uploads/raw/{objectKey}`. Non-upload URLs (external CDN) pass through.
 */
export function toStoredMediaPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  try {
    const u = new URL(trimmed);
    const idx = u.pathname.indexOf(UPLOADS_RAW_PREFIX);
    if (idx >= 0) {
      return u.pathname.slice(idx);
    }
    return trimmed;
  } catch {
    /* not an absolute URL */
  }

  if (trimmed.startsWith(UPLOADS_RAW_PREFIX)) {
    return trimmed;
  }

  if (isUploadObjectKey(trimmed)) {
    return `${UPLOADS_RAW_PREFIX}${trimmed}`;
  }

  return trimmed;
}

/** Build a browser-fetchable URL from a stored path or legacy absolute URL. */
export function resolveMediaUrl(
  value: string | null | undefined,
  publicBaseUrl: string,
): string {
  if (!value) return '';
  const base = publicBaseUrl.replace(/\/+$/, '');
  const stored = toStoredMediaPath(value);
  if (stored.startsWith(UPLOADS_RAW_PREFIX)) {
    return `${base}${stored}`;
  }
  return value;
}
