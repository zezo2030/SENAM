import { Injectable } from '@nestjs/common';

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

@Injectable()
export class InMemoryCacheService {
  private readonly store = new Map<string, CacheEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async incrWithExpire(key: string, ttlSeconds: number): Promise<number> {
    const entry = this.store.get(key);
    let value = 1;
    if (entry && (entry.expiresAt === null || entry.expiresAt > Date.now())) {
      value = Number.parseInt(entry.value, 10) + 1;
    }
    await this.set(key, String(value), ttlSeconds);
    return value;
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
