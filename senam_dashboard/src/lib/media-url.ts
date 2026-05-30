const API_BASE = (import.meta.env.VITE_API_BASE_URL as string).replace(
  /\/+$/,
  '',
);
const UPLOADS_RAW_PREFIX = '/v1/uploads/raw/';

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

/** Host-independent path for DB / form state. */
export function toStoredMediaPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  try {
    const u = new URL(trimmed);
    const idx = u.pathname.indexOf(UPLOADS_RAW_PREFIX);
    if (idx >= 0) return u.pathname.slice(idx);
    return trimmed;
  } catch {
    /* relative path or bare key */
  }

  if (trimmed.startsWith(UPLOADS_RAW_PREFIX)) return trimmed;

  if (isUploadObjectKey(trimmed)) {
    return `${UPLOADS_RAW_PREFIX}${trimmed}`;
  }

  return trimmed;
}

/** Absolute URL for <img src>. Rewrites legacy upload hosts to VITE_API_BASE_URL. */
export function resolveMediaUrl(value: string | null | undefined): string {
  if (!value) return '';
  const stored = toStoredMediaPath(value);
  if (stored.startsWith(UPLOADS_RAW_PREFIX)) {
    return `${API_BASE}${stored}`;
  }
  return value;
}

/** Point presigned PUT URLs at the same host the dashboard uses for API calls. */
export function rewriteUploadUrl(uploadUrl: string): string {
  try {
    const target = new URL(API_BASE);
    const parsed = new URL(uploadUrl);
    parsed.protocol = target.protocol;
    parsed.host = target.host;
    return parsed.toString();
  } catch {
    return uploadUrl;
  }
}
