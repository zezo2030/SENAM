import { api } from './client';
import { EP } from './endpoints';

export type UploadPurpose =
  | 'profile_photo'
  | 'kyc_document'
  | 'review_photo'
  | 'company_logo'
  | 'banner_image';

interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
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

  const res = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`upload_failed_${res.status}`);
  }

  return presign.publicUrl;
}
