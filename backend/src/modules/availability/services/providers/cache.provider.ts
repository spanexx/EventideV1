import { Injectable, Logger } from '@nestjs/common';
import { CachingService } from '../../../../core/cache/caching.service';
import { IAvailabilityBase } from '../../interfaces/availability.interface';

@Injectable()
export class CacheProvider {
  private readonly logger = new Logger(CacheProvider.name);

  constructor(
    private readonly cacheService: CachingService,
  ) {}

  /**
   * Get cached availability or fetch from database
   */
  async getCachedAvailability(
    cacheKey: string,
    fetchFunction: () => Promise<IAvailabilityBase[]>,
  ): Promise<IAvailabilityBase[]> {
    try {
      // Try to get the result from the cache first
      const cachedAvailabilities = await this.cacheService.get<IAvailabilityBase[]>(cacheKey);
      if (cachedAvailabilities) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        return cachedAvailabilities;
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}. Fetching from DB.`);

      // Fetch from database
      const result = await fetchFunction();

      // Cache the result
      await this.cacheService.set(cacheKey, result, 5 * 60); // Cache for 5 minutes

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve cached availability: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Clear cache for a provider
   */
  async clearProviderCache(providerId: string): Promise<void> {
    await this.cacheService.del(`availability:${providerId}`);
  }

  /**
   * Set cache for idempotency key
   */
  async setIdempotencyCache(key: string, data: any, ttlMinutes = 10): Promise<void> {
    const cacheKey = `idem:availability:${key}`;
    await this.cacheService.set(cacheKey, data, ttlMinutes * 60);
  }

  /**
   * Get cached idempotency result
   */
  async getIdempotencyCache<T>(key: string): Promise<T | null> {
    const cacheKey = `idem:availability:${key}`;
    const result = await this.cacheService.get<T>(cacheKey);
    return result ?? null;
  }
}
