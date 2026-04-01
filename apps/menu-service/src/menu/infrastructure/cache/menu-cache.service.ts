// apps/menu-service/src/menu/infrastructure/cache/menu-cache.service.ts
//
// Redis cache wrapper for branch menu lists.
// TTL: 60 seconds per SRS §5.2 (non-functional: sub-200ms reads)
// Invalidation: on any write (create/update/delete/toggle)

import { Injectable, Inject, Optional } from '@nestjs/common';
import { RedisCache } from '@rms/shared-kernel';
import { ConsoleLogger } from '@rms/shared-kernel';

const MENU_CACHE_TTL_SEC = 60;

@Injectable()
export class MenuCacheService {
  private readonly logger = new ConsoleLogger({ service: 'MenuCacheService' });

  constructor(
    @Optional() @Inject('REDIS_CACHE')
    private readonly cache: RedisCache | null,
  ) {}

  private branchKey(branchId: string): string {
    return `menu:branch:${branchId}:items`;
  }

  async getItems<T>(branchId: string): Promise<T[] | null> {
    if (!this.cache) return null;
    try {
      return await this.cache.get<T[]>(this.branchKey(branchId));
    } catch (err) {
      this.logger.warn('Redis GET failed — cache miss', { branchId, error: (err as Error).message });
      return null;
    }
  }

  async setItems<T>(branchId: string, items: T[]): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.set(this.branchKey(branchId), items, MENU_CACHE_TTL_SEC);
    } catch (err) {
      this.logger.warn('Redis SET failed', { branchId, error: (err as Error).message });
    }
  }

  /** Invalidate whenever any item or category changes for a branch */
  async invalidateBranch(branchId: string): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(this.branchKey(branchId));
      this.logger.debug('Cache invalidated', { branchId });
    } catch (err) {
      this.logger.warn('Redis DEL failed', { branchId, error: (err as Error).message });
    }
  }
}
