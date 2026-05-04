import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

type CachedValue<T> = {
  value: T;
  expiresAt: number;
};

@Injectable()
export class ProductsSearchCacheService implements OnModuleDestroy {
  private readonly memory = new Map<string, CachedValue<unknown>>();
  private readonly ttlSeconds: number;
  private redis: RedisClientType | null = null;
  private redisEnabled = false;

  constructor(private readonly configService: ConfigService) {
    this.ttlSeconds = Math.max(5, Number(this.configService.get('products.searchCacheTtlSeconds') ?? 45));
    const redisUrl = String(this.configService.get<string>('redis.url') ?? '').trim();
    if (redisUrl) {
      this.redis = createClient({ url: redisUrl });
      this.redis.on('error', () => {
        this.redisEnabled = false;
      });
      this.redis
        .connect()
        .then(() => {
          this.redisEnabled = true;
        })
        .catch(() => {
          this.redisEnabled = false;
        });
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // noop
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.redisEnabled) {
      try {
        const raw = await this.redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        // fallback to memory cache
      }
    }
    const item = this.memory.get(key);
    if (!item) return null;
    if (item.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.set(key, JSON.stringify(value), { EX: this.ttlSeconds });
      } catch {
        // fallback to memory cache
      }
    }
    this.memory.set(key, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
    if (this.redis && this.redisEnabled) {
      try {
        let cursor = 0;
        do {
          const r = await this.redis.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
          cursor = r.cursor;
          if (r.keys.length > 0) {
            await this.redis.del(r.keys);
          }
        } while (cursor !== 0);
      } catch {
        // noop
      }
    }
  }
}
