import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CachingService } from './caching.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        // Check if we should use Redis or in-memory cache
        const useRedis = configService.get<boolean>('USE_REDIS', true);

        if (useRedis) {
          try {
            const store = await redisStore({
              socket: {
                host: configService.get<string>('REDIS_HOST', 'localhost'),
                port: configService.get<number>('REDIS_PORT', 6379),
              },
              ttl: configService.get<number>('CACHE_TTL', 300), // 5 minutes default
            });

            return {
              store: store as any,
            };
          } catch (error) {
            console.error('Redis Connection Error:', error);
            // Fallback to in-memory cache if Redis connection fails
            return {
              ttl: configService.get<number>('CACHE_TTL', 300),
            };
          }
        } else {
          // Use in-memory cache
          return {
            ttl: configService.get<number>('CACHE_TTL', 300),
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CachingService],
  exports: [CachingService, CacheModule],
})
export class CustomCacheModule {}
