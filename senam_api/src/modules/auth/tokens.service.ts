import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CacheService } from '../../infrastructure/cache/cache.service.js';

export interface JwtPayload {
  sub: string;
  principal: 'customer' | 'provider' | 'admin';
  roles: string[];
  companyId?: string | undefined;
  /** Shown in dashboard user menu (display name or company name). */
  name?: string | undefined;
  email?: string | undefined;
  jti?: string | undefined;
}

@Injectable()
export class TokensService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {
    this.accessTtl = Number(config.get<string | number>('JWT_ACCESS_TTL_SECONDS') ?? 900);
    this.refreshTtl = Number(config.get<string | number>('JWT_REFRESH_TTL_SECONDS') ?? 2592000);
  }

  async issueTokenPair(payload: Omit<JwtPayload, 'jti'>): Promise<{ accessToken: string; refreshToken: string }> {
    // `expiresIn` is forced to a number so the `ms` library interprets it as
    // seconds, not the bare-string "<N>" → milliseconds path that produced
    // immediately-expired tokens.
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.accessTtl });

    const tokenId = crypto.randomUUID();
    const rawRefreshToken = `${tokenId}.${crypto.randomBytes(32).toString('hex')}`;
    const hash = await bcrypt.hash(rawRefreshToken, 10);

    const key = `refresh:${tokenId}`;
    await this.cache.set(key, JSON.stringify({ hash, ...payload }), this.refreshTtl);

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async rotateRefreshToken(raw: string): Promise<{ accessToken: string; refreshToken: string }> {
    const [tokenId] = raw.split('.');
    if (!tokenId) throw new UnauthorizedException('token_invalid');

    const key = `refresh:${tokenId}`;
    const stored = await this.cache.get(key);
    if (!stored) throw new UnauthorizedException('token_invalid');

    const { hash, ...payload } = JSON.parse(stored) as JwtPayload & { hash: string };
    const valid = await bcrypt.compare(raw, hash);
    if (!valid) throw new UnauthorizedException('token_invalid');

    await this.cache.del(key);

    return this.issueTokenPair({
      sub: payload.sub,
      principal: payload.principal,
      roles: payload.roles ?? [],
      ...(payload.companyId ? { companyId: payload.companyId } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.email ? { email: payload.email } : {}),
    });
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    const [tokenId] = raw.split('.');
    if (tokenId) {
      await this.cache.del(`refresh:${tokenId}`);
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('token_invalid');
    }
  }
}
