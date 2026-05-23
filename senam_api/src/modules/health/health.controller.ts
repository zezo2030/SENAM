import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { CacheService } from '../../infrastructure/cache/cache.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  @Public()
  @Get('healthz')
  @ApiOperation({ summary: 'Liveness probe — process alive' })
  healthz() {
    return { status: 'ok' };
  }

  @Public()
  @Get('readyz')
  @ApiOperation({ summary: 'Readiness probe — checks Postgres and Redis' })
  async readyz() {
    const [dbOk, redisOk] = await Promise.allSettled([
      this.dataSource.query('SELECT 1'),
      this.cacheService.ping(),
    ]);

    const db = dbOk.status === 'fulfilled';
    const redis = redisOk.status === 'fulfilled' && redisOk.value === true;

    return {
      status: db && redis ? 'ok' : 'degraded',
      checks: { db, redis },
    };
  }
}
