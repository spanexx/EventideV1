import { Injectable, Logger } from '@nestjs/common';
import { CachingService } from '../../../core/cache/caching.service';
import { IBooking } from '../interfaces/booking.interface';

@Injectable()
export class BookingCacheService {
  private readonly logger = new Logger(BookingCacheService.name);

  constructor(private readonly cacheService: CachingService) {}

  async getCachedBooking(idempotencyKey: string): Promise<IBooking | null> {
    const cacheKey = this.getBookingCacheKey(idempotencyKey);
    const cached = await this.cacheService.get<IBooking>(cacheKey);
    return cached || null;
  }

  async cacheBooking(idempotencyKey: string, booking: IBooking, ttlMinutes = 10): Promise<void> {
    const cacheKey = this.getBookingCacheKey(idempotencyKey);
    await this.cacheService.set(cacheKey, booking, ttlMinutes * 60);
  }

  async invalidateBookingCache(idempotencyKey: string): Promise<void> {
    const cacheKey = this.getBookingCacheKey(idempotencyKey);
    await this.cacheService.del(cacheKey);
  }

  // Generic cache methods for query result caching
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheService.get<T>(key);
      return cached || null;
    } catch (error) {
      this.logger.error(`[BookingCacheService] Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    try {
      await this.cacheService.set(key, value, ttlSeconds);
    } catch (error) {
      this.logger.error(`[BookingCacheService] Error setting cache key ${key}:`, error);
    }
  }

  async invalidateProviderCache(providerId: string): Promise<void> {
    this.logger.log(`[BookingCacheService] Invalidating query caches for provider: ${providerId}`);
    // Note: In a production system, you'd implement pattern-based cache invalidation here
  }

  private getBookingCacheKey(idempotencyKey: string): string {
    return `idem:booking:create:${idempotencyKey}`;
  }
}
