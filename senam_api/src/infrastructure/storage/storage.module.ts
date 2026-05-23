import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObjectStoragePort } from './object-storage.port.js';
import { S3CompatibleAdapter } from './s3-compatible.adapter.js';
import { LocalFilesystemAdapter } from './local-filesystem.adapter.js';
import { LocalUploadsController } from './local-uploads.controller.js';

/**
 * Pick the storage backend with `STORAGE_DRIVER`:
 *   - `s3` (default) — S3-compatible (R2, MinIO, AWS S3).
 *   - `local`        — writes files under `LOCAL_STORAGE_DIR` on the API host
 *                      and serves them back via `/v1/uploads/raw/...`. Handy
 *                      for laptop development with no Docker/MinIO running.
 */
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [LocalUploadsController],
  providers: [
    LocalFilesystemAdapter,
    {
      provide: ObjectStoragePort,
      inject: [ConfigService, LocalFilesystemAdapter],
      useFactory: (config: ConfigService, local: LocalFilesystemAdapter) => {
        const driver = (
          config.get<string>('STORAGE_DRIVER') ?? 's3'
        ).toLowerCase();
        if (driver === 'local') {
          return local;
        }
        return new S3CompatibleAdapter(config);
      },
    },
  ],
  exports: [ObjectStoragePort, LocalFilesystemAdapter],
})
export class StorageModule {}
