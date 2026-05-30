import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import {
  ObjectStoragePort,
  PresignUploadOptions,
  PresignUploadResult,
  PresignDownloadOptions,
} from './object-storage.port.js';
import { toStoredMediaPath } from '../../common/utils/media-url.util.js';

/**
 * Dev/CI replacement for the S3 adapter that stores objects on the API server's
 * local filesystem. Upload URLs use {@link publicBaseUrl}; persisted
 * {@link PresignUploadResult.publicUrl} is a host-independent path
 * (`/v1/uploads/raw/...`) so DB rows survive IP / host changes.
 */
@Injectable()
export class LocalFilesystemAdapter extends ObjectStoragePort {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;
  private readonly signingSecret: string;

  constructor(config: ConfigService) {
    super();
    this.rootDir =
      config.get<string>('LOCAL_STORAGE_DIR') ||
      path.join(process.cwd(), 'storage');
    this.publicBaseUrl = (
      config.get<string>('LOCAL_STORAGE_PUBLIC_BASE_URL') ||
      config.get<string>('API_PUBLIC_BASE_URL') ||
      config.get<string>('APP_BASE_URL') ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
    this.signingSecret =
      config.get<string>('LOCAL_STORAGE_SIGNING_SECRET') ||
      config.get<string>('JWT_SECRET') ||
      'dev-only-signing-secret';
  }

  /** Where this adapter writes a given object key on disk. */
  resolvePath(key: string): string {
    const safe = key.replace(/\.\.+/g, '').replace(/^[/\\]+/, '');
    return path.join(this.rootDir, safe);
  }

  signKey(key: string, expiresAt: number): string {
    const h = crypto.createHmac('sha256', this.signingSecret);
    h.update(`${key}|${expiresAt}`);
    return h.digest('hex').slice(0, 32);
  }

  verifySignature(key: string, expiresAt: number, signature: string): boolean {
    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return false;
    const expected = this.signKey(key, expiresAt);
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  }

  async presignUpload(
    options: PresignUploadOptions,
  ): Promise<PresignUploadResult> {
    const ttlMs = (options.expiresInSeconds ?? 900) * 1000;
    const expiresAt = Date.now() + ttlMs;
    const sig = this.signKey(options.key, expiresAt);
    const uploadUrl =
      `${this.publicBaseUrl}/v1/uploads/raw/` +
      encodeURI(options.key) +
      `?expires=${expiresAt}&sig=${sig}`;
    return {
      uploadUrl,
      objectKey: options.key,
      publicUrl: toStoredMediaPath(options.key),
    };
  }

  async presignDownload(options: PresignDownloadOptions): Promise<string> {
    return `${this.publicBaseUrl}${toStoredMediaPath(options.key)}`;
  }

  async writeFile(key: string, body: Buffer): Promise<void> {
    const target = this.resolvePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
  }

  async readFile(key: string): Promise<Buffer> {
    return fs.readFile(this.resolvePath(key));
  }
}
