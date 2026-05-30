import {
  BadRequestException,
  Controller,
  Get,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { Public } from '../../common/decorators/public.decorator.js';
import { LocalFilesystemAdapter } from './local-filesystem.adapter.js';

/**
 * Sibling of the S3 "presigned URL" flow but for the local-filesystem adapter:
 *   PUT /v1/uploads/raw/*?expires=...&sig=...  — accept the bytes the client
 *      previously got a signed URL for, persist them on disk.
 *   GET /v1/uploads/raw/*                      — serve a stored object back
 *      (used by the dashboard / app to render logos, photos, KYC docs).
 *
 * Only the LocalFilesystemAdapter routes traffic here; when STORAGE_DRIVER=s3
 * the routes still exist but are unused.
 */
@ApiTags('uploads-local')
@Controller('uploads/raw')
export class LocalUploadsController {
  constructor(private readonly local: LocalFilesystemAdapter) {}

  @Public()
  @Put('{*splat}')
  @ApiOperation({
    summary:
      'Local-storage upload sink. The client receives this URL from /uploads/presign.',
  })
  async putObject(
    @Req() req: Request,
    @Query('expires') expires: string,
    @Query('sig') sig: string,
  ): Promise<{ ok: true; objectKey: string }> {
    const key = this.extractKey(req);
    if (!key) throw new BadRequestException('missing_key');
    const expiresAt = Number(expires);
    if (!sig || !Number.isFinite(expiresAt)) {
      throw new UnauthorizedException('invalid_signature');
    }
    if (!this.local.verifySignature(key, expiresAt, sig)) {
      throw new UnauthorizedException('invalid_signature');
    }

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => resolve());
      req.on('error', reject);
    });

    const body = Buffer.concat(chunks);
    if (body.length === 0) {
      throw new BadRequestException('empty_body');
    }
    if (body.length > 25 * 1024 * 1024) {
      throw new BadRequestException('file_too_large');
    }

    await this.local.writeFile(key, body);
    return { ok: true, objectKey: key };
  }

  @Public()
  @Get('{*splat}')
  @ApiOperation({ summary: 'Serve a locally-stored object by key.' })
  async getObject(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const key = this.extractKey(req);
    if (!key) throw new BadRequestException('missing_key');
    const filePath = this.local.resolvePath(key);
    let size = 0;
    try {
      const s = await stat(filePath);
      size = s.size;
    } catch {
      throw new NotFoundException('object_not_found');
    }
    res.setHeader('Content-Length', String(size));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', guessMime(key));
    return new StreamableFile(createReadStream(filePath));
  }

  private extractKey(req: Request): string {
    // Express 5 / NestJS 11 named-wildcard: `splat` is either a string or
    // an array of path segments. We also fall back to parsing the URL path
    // ourselves so changes in framework versions don't silently break this.
    const params = req.params as Record<string, string | string[] | undefined>;
    const raw = params['splat'] ?? params['0'];
    if (raw) {
      const joined = Array.isArray(raw) ? raw.join('/') : raw;
      return decodeURIComponent(joined);
    }
    // Fallback: strip the `/v1/uploads/raw/` prefix from the URL.
    const url = req.originalUrl || req.url;
    const m = url.match(/\/uploads\/raw\/([^?]+)/);
    return m ? decodeURIComponent(m[1]!) : '';
  }
}

function guessMime(key: string): string {
  const ext = key.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}
