// packages/shared-kernel/src/infrastructure/redis-cache.ts

import Redis, { type RedisOptions } from 'ioredis';

/**
 * RedisCache — thin wrapper around ioredis providing typed get/set/del
 * with automatic JSON serialization, TTL support, and cache-aside pattern.
 *
 * Each microservice creates its own RedisCache instance with a service-specific
 * key prefix to avoid namespace collisions.
 */
export class RedisCache {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor(options: RedisOptions & { keyPrefix?: string }) {
    const { keyPrefix = 'rms', ...redisOptions } = options;
    this.prefix = keyPrefix;
    this.client = new Redis(redisOptions);
  }

  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get a cached value, automatically deserializing JSON.
   * Returns null on cache miss.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.buildKey(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  /**
   * Set a value with optional TTL in seconds.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(this.buildKey(key), serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(this.buildKey(key), serialized);
    }
  }

  /**
   * Delete a cached key.
   */
  async del(key: string): Promise<void> {
    await this.client.del(this.buildKey(key));
  }

  /**
   * Delete all keys matching a glob pattern (e.g. 'menu:branch:*').
   * Uses SCAN to avoid blocking Redis with KEYS command.
   */
  async delByPattern(pattern: string): Promise<void> {
    const keys   = await this.scanKeys(`${this.prefix}:${pattern}`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Cache-aside: fetch from cache; on miss, run loader and cache result.
   */
  async getOrSet<T>(
    key:        string,
    loader:     () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await loader();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Increment a numeric counter (useful for rate limiting / counters).
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.client.incr(this.buildKey(key));
    if (ttlSeconds && count === 1) {
      await this.client.expire(this.buildKey(key), ttlSeconds);
    }
    return count;
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(this.buildKey(key))) === 1;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.client.scan(
        cursor, 'MATCH', pattern, 'COUNT', 100
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }
}
