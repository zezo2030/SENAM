import { rewriteUploadUrl, toStoredMediaPath } from '@/lib/media-url';
import { api } from './client';
import { EP } from './endpoints';

export type UploadPurpose =
  | 'profile_photo'
  | 'kyc_document'
  | 'review_photo'
  | 'company_logo'
  | 'company_cover'
  | 'portfolio_photo'
  | 'gallery_photo'
  | 'banner_image'
  | 'category_icon'
  | 'service_icon'
  | 'service_image';

interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

/**
 * Same as {@link uploadImage} but returns the raw object key (e.g.
 * `gallery_photo/abc.jpg`) instead of the publicly-fetchable URL. The
 * provider-self endpoints expect to receive object keys.
 */
export async function uploadAndGetKey(
  file: File,
  purpose: UploadPurpose,
): Promise<string> {
  const presign = await api.post<PresignResponse>(EP.uploads.presign, {
    purpose,
    contentType: file.type || 'application/octet-stream',
  });

  const res = await fetch(rewriteUploadUrl(presign.uploadUrl), {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`upload_failed_${res.status}`);
  }

  return presign.objectKey;
}

/**
 * Direct browser → S3 upload via pre-signed PUT. Returns the public URL
 * to persist (e.g. in `banners.image_url`).
 */
export async function uploadImage(
  file: File,
  purpose: UploadPurpose,
): Promise<string> {
  const presign = await api.post<PresignResponse>(EP.uploads.presign, {
    purpose,
    contentType: file.type || 'application/octet-stream',
  });

  const res = await fetch(rewriteUploadUrl(presign.uploadUrl), {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`upload_failed_${res.status}`);
  }

  return toStoredMediaPath(presign.publicUrl || presign.objectKey);
}
