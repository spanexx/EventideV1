// import { Injectable, Logger, Inject } from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
// import { Availability } from '../../modules/bookings/availability.schema';

// @Injectable()
// export class CachingService {
//   private readonly logger = new Logger(CachingService.name);
//   private readonly AVAILABILITY_CACHE_PREFIX = 'availability:';
//   private readonly DEFAULT_TTL = 300; // 5 minutes

//   constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

//   async cacheAvailability(
//     providerId: string,
//     availability: Availability[],
//     ttl: number = this.DEFAULT_TTL,
//   ): Promise<void> {
//     try {
//       const key = `${this.AVAILABILITY_CACHE_PREFIX}${providerId}`;
//       await this.cacheManager.set(key, availability, ttl);
//       this.logger.debug(`Cached availability for provider ${providerId}`);
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to cache availability for provider ${providerId}: ${error.message}`,
//       );
//     }
//   }

//   async getCachedAvailability(
//     providerId: string,
//   ): Promise<Availability[] | null> {
//     try {
//       const key = `${this.AVAILABILITY_CACHE_PREFIX}${providerId}`;
//       const cached = (await this.cacheManager.get(key)) as
//         | Availability[]
//         | null;

//       if (cached) {
//         this.logger.debug(
//           `Retrieved cached availability for provider ${providerId}`,
//         );
//         return cached;
//       }

//       return null;
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to retrieve cached availability for provider ${providerId}: ${error.message}`,
//       );
//       return null;
//     }
//   }

//   async invalidateAvailabilityCache(providerId: string): Promise<void> {
//     try {
//       const key = `${this.AVAILABILITY_CACHE_PREFIX}${providerId}`;
//       await this.cacheManager.del(key);
//       this.logger.debug(
//         `Invalidated availability cache for provider ${providerId}`,
//       );
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to invalidate availability cache for provider ${providerId}: ${error.message}`,
//       );
//     }
//   }

//   async cacheAvailableTimeSlots(
//     providerId: string,
//     date: string,
//     slots: Array<{ startTime: Date; duration: number }>,
//     ttl: number = this.DEFAULT_TTL,
//   ): Promise<void> {
//     try {
//       const key = `available_slots:${providerId}:${date}`;
//       await this.cacheManager.set(key, slots, ttl);
//       this.logger.debug(
//         `Cached available time slots for provider ${providerId} on ${date}`,
//       );
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to cache available time slots for provider ${providerId} on ${date}: ${error.message}`,
//       );
//     }
//   }

//   async getCachedAvailableTimeSlots(
//     providerId: string,
//     date: string,
//   ): Promise<Array<{ startTime: Date; duration: number }> | null> {
//     try {
//       const key = `available_slots:${providerId}:${date}`;
//       const cached = (await this.cacheManager.get(key)) as Array<{
//         startTime: Date;
//         duration: number;
//       }> | null;

//       if (cached) {
//         this.logger.debug(
//           `Retrieved cached available time slots for provider ${providerId} on ${date}`,
//         );
//         return cached;
//       }

//       return null;
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to retrieve cached available time slots for provider ${providerId} on ${date}: ${error.message}`,
//       );
//       return null;
//     }
//   }

//   async invalidateAvailableTimeSlotsCache(
//     providerId: string,
//     date: string,
//   ): Promise<void> {
//     try {
//       const key = `available_slots:${providerId}:${date}`;
//       await this.cacheManager.del(key);
//       this.logger.debug(
//         `Invalidated available time slots cache for provider ${providerId} on ${date}`,
//       );
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to invalidate available time slots cache for provider ${providerId} on ${date}: ${error.message}`,
//       );
//     }
//   }
// }
