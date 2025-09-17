import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * A service that provides a wrapper around the NestJS CacheManager.
 * It centralizes caching logic, including getting, setting, and deleting cache entries,
 * and adds logging and error handling.
 * This service is now optimized to leverage Redis-specific features if available.
 */
@Injectable()
export class CachingService implements OnModuleInit {
  private readonly logger = new Logger(CachingService.name);
  // Default Time-To-Live for cache entries is set to 5 minutes.
  private readonly DEFAULT_TTL = 300;
  private redisClient: any;

  /**
   * Injects the core `CACHE_MANAGER` from NestJS's caching module.
   * @param cacheManager The underlying cache store instance.
   */
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * On module initialization, safely navigates the cache store object
   * to find the underlying Redis client.
   */
  onModuleInit() {
    const firstStore = this.cacheManager.stores[0] as any;

    // The type error revealed the store is a Keyv instance.
    // The raw Redis client is typically found in the adapter within the Keyv options.
    if (firstStore?.opts?.store?.client) {
      const client = firstStore.opts.store.client;
      // Final check to ensure it's a Redis client with the 'scan' method.
      if (typeof client.scan === 'function') {
        this.redisClient = client;
        this.logger.log('Redis client found via Keyv adapter. `delPattern` is enabled.');
        return;
      }
    }
    this.logger.warn(
      'Redis client with `scan` method not found. `delPattern` will be non-functional.',
    );
  }

  /**
   * Retrieves a value from the cache by its key.
   * @param key The key of the item to retrieve.
   * @returns The cached value if found and not expired, otherwise `undefined`.
   */
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
      return undefined; // Return undefined on error to prevent crashes.
    }
  }

  /**
   * Stores a value in the cache.
   * @param key The key under which to store the value.
   * @param value The value to store.
   * @param ttl The time-to-live in seconds for this specific cache entry. Defaults to `DEFAULT_TTL`.
   */
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

  /**
   * Deletes a value from the cache by its key.
   * @param key The key of the item to delete.
   */
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

  /**
   * Deletes cache entries based on a key pattern using Redis's SCAN command.
   * This is a production-safe way to remove multiple keys without blocking the server.
   * This method will only work if the cache store is Redis.
   * @param pattern The pattern to match against cache keys (e.g., 'user-*').
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.redisClient) {
      this.logger.warn(`delPattern called but Redis client is not available. Skipping operation.`);
      return;
    }

    try {
      this.logger.debug(`Invalidating cache for pattern ${pattern}`);
      const client = this.redisClient;
      let cursor = 0;
      do {
        const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys.length > 0) {
          await client.del(keys);
          this.logger.debug(`Deleted ${keys.length} keys matching pattern ${pattern}`);
        }
      } while (cursor !== 0);
    } catch (error: any) {
      this.logger.error(
        `Failed to invalidate cache for pattern ${pattern}: ${(error as Error).message}`,
      );
    }
  }
}
