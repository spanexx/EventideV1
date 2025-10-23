import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { CachingService } from './caching.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const useRedis = configService.get<boolean>('USE_REDIS', true);

        if (useRedis) {
          try {
            return {
              store: redisStore,
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              ttl: configService.get<number>('CACHE_TTL', 300) * 1000,
              isGlobal: true,
            };
          } catch (error) {
            console.error('Redis Connection Error:', error);
            return {
              ttl: configService.get<number>('CACHE_TTL', 300) * 1000,
              isGlobal: true,
            };
          }
        }

        return {
          ttl: configService.get<number>('CACHE_TTL', 300) * 1000,
          isGlobal: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CachingService],
  exports: [CachingService, CacheModule],
})
export class CustomCacheModule {}
