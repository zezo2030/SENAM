export interface PresignUploadOptions {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignUploadResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export interface PresignDownloadOptions {
  key: string;
  expiresInSeconds?: number;
}

export abstract class ObjectStoragePort {
  abstract presignUpload(options: PresignUploadOptions): Promise<PresignUploadResult>;
  abstract presignDownload(options: PresignDownloadOptions): Promise<string>;
}
