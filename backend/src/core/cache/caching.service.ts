import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CachingService implements OnModuleInit {
  private readonly logger = new Logger(CachingService.name);
  private redisClient: RedisClientType;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const useRedis = this.configService.get<boolean>('USE_REDIS', true);
    if (useRedis) {
      try {
        this.redisClient = createClient({
          socket: {
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
          },
          password: this.configService.get<string>('REDIS_PASSWORD'),
        });

        await this.redisClient.connect();
        this.logger.log('Redis client connected successfully');
      } catch (error) {
        this.logger.error('Failed to connect to Redis:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return undefined;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, pattern deletion skipped');
      return;
    }

    try {
      let cursor = 0;
      do {
        const reply = await this.redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = reply.cursor;

        if (reply.keys.length > 0) {
          await this.redisClient.del(reply.keys);
          this.logger.debug(`Deleted ${reply.keys.length} keys matching pattern: ${pattern}`);
        }
      } while (cursor !== 0);
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.flushDb();
      } else {
        // For in-memory cache, delete all keys
        const keys = await this.keys('*');
        for (const key of keys) {
          await this.del(key);
        }
      }
      this.logger.log('Cache reset successfully');
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, returning empty keys array');
      return [];
    }

    try {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const reply = await this.redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = reply.cursor;
        keys.push(...reply.keys);
      } while (cursor !== 0);

      return keys;
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async getTtl(key: string): Promise<number | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return null;
    }
  }

  async setTtl(key: string, ttl: number): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      await this.redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Error setting TTL for key ${key}:`, error);
      return false;
    }
  }
}
