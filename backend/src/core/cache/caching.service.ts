import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const cached = await this.cacheManager.get(key);
      if (cached !== undefined) {
        this.logger.debug(`Retrieved cached value for key ${key}`);
        return cached as T;
      }
      return undefined;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve cached value for key ${key}: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cached value for key ${key}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to cache value for key ${key}: ${(error as Error).message}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Invalidated cache for key ${key}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to invalidate cache for key ${key}: ${(error as Error).message}`,
      );
    }
  }
}
