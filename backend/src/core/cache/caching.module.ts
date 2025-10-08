import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CachingService } from './caching.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ttl: 60 * 60, // 1 hour default TTL
    }),
  ],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
