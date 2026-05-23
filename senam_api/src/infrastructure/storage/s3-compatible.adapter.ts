import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ObjectStoragePort,
  PresignUploadOptions,
  PresignUploadResult,
  PresignDownloadOptions,
} from './object-storage.port.js';

@Injectable()
export class S3CompatibleAdapter extends ObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string | undefined;
  private readonly publicBaseUrl: string | undefined;

  constructor(config: ConfigService) {
    super();
    this.bucket = config.get<string>('S3_BUCKET')!;
    this.endpoint = config.get<string>('S3_ENDPOINT');
    this.publicBaseUrl = config.get<string>('S3_PUBLIC_BASE_URL');
    this.client = new S3Client({
      region: config.get<string>('S3_REGION', 'auto'),
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: config.get<string>('S3_SECRET_ACCESS_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  private buildPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async presignUpload(options: PresignUploadOptions): Promise<PresignUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      ContentType: options.contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresInSeconds ?? 900,
    });
    return {
      uploadUrl,
      objectKey: options.key,
      publicUrl: this.buildPublicUrl(options.key),
    };
  }

  async presignDownload(options: PresignDownloadOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresInSeconds ?? 3600,
    });
  }
}
