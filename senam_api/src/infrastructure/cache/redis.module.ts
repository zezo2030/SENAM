import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { isRedisEnabled } from '../../config/redis-enabled.js';
import { CacheService } from './cache.service.js';
import { InMemoryCacheService } from './in-memory-cache.service.js';
import { REDIS_CLIENT } from './redis.constants.js';

export { REDIS_CLIENT } from './redis.constants.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    InMemoryCacheService,
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        if (!isRedisEnabled(config)) {
          return null;
        }
        const client = new Redis(config.get<string>('REDIS_URL')!, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });
        client.on('error', (err) => {
          console.error('[Redis] connection error', err);
        });
        return client;
      },
    },
    {
      provide: CacheService,
      inject: [ConfigService, REDIS_CLIENT, InMemoryCacheService],
      useFactory: (
        config: ConfigService,
        redis: Redis | null,
        inMemory: InMemoryCacheService,
      ): CacheService | InMemoryCacheService => {
        if (!isRedisEnabled(config) || redis === null) {
          return inMemory;
        }
        return new CacheService(redis);
      },
    },
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class RedisModule {}
