import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Public } from '../../common/decorators/public.decorator.js';
import { ObjectStoragePort, PresignUploadResult } from '../../infrastructure/storage/object-storage.port.js';

type UploadPurpose =
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

const ALLOWED_PURPOSES: UploadPurpose[] = [
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
];

class PresignBodyDto {
  @ApiProperty({ enum: ALLOWED_PURPOSES })
  @IsIn(ALLOWED_PURPOSES)
  purpose!: UploadPurpose;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType!: string;
}

/** Derive file extension from MIME type, falling back to 'bin'. */
function extFromContentType(contentType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return mimeToExt[contentType.toLowerCase()] ?? 'bin';
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly objectStorage: ObjectStoragePort) {}

  /**
   * Pre-signed S3 upload URL.
   *
   * Public because guest visitors must be able to upload their company logo,
   * portfolio photos, and KYC documents while submitting the "Join as a
   * Company" application — they have no account yet. Heavy throttling keeps
   * bucket abuse bounded.
   */
  @Public()
  @Post('presign')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Generate a pre-signed S3 upload URL for direct browser upload' })
  async presign(
    @Body() body: PresignBodyDto,
  ): Promise<PresignUploadResult> {
    if (!ALLOWED_PURPOSES.includes(body.purpose)) {
      throw new BadRequestException(`Invalid purpose. Allowed: ${ALLOWED_PURPOSES.join(', ')}`);
    }

    const ext = extFromContentType(body.contentType);
    const uuid = crypto.randomUUID();
    const key = `${body.purpose}/${uuid}.${ext}`;

    return this.objectStorage.presignUpload({
      key,
      contentType: body.contentType,
      expiresInSeconds: 900, // 15 minutes
    });
  }
}
