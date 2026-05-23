import type { ConfigService } from '@nestjs/config';

export function isRedisEnabled(config: ConfigService): boolean {
  const raw = config.get<string | boolean | undefined>('REDIS_ENABLED');
  if (raw === undefined || raw === null || raw === '') {
    return true;
  }
  if (raw === false || raw === 'false' || raw === '0') {
    return false;
  }
  return true;
}

export function isRedisEnabledFromEnv(): boolean {
  const raw = process.env['REDIS_ENABLED'];
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw !== 'false' && raw !== '0';
}
