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

  private getBookingCacheKey(idempotencyKey: string): string {
    return `idem:booking:create:${idempotencyKey}`;
  }
}
