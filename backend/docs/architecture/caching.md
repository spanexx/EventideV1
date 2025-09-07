# Caching Architecture

## Overview
The Eventide backend implements a flexible caching system using NestJS's built-in cache manager. This system provides both in-memory and Redis-backed caching options with automatic fallback.

## Implementation

### Cache Module
The caching infrastructure is implemented in `src/core/cache/`:
- `cache.module.ts`: Configures the cache manager with Redis or in-memory fallback
- `caching.service.ts`: Provides generic caching operations (get, set, del)

### Configuration
The cache module automatically configures based on environment variables:
- `USE_REDIS`: Boolean to enable/disable Redis (defaults to true)
- `REDIS_HOST`: Redis server hostname (defaults to localhost)
- `REDIS_PORT`: Redis server port (defaults to 6379)
- `CACHE_TTL`: Default time-to-live in seconds (defaults to 300 seconds/5 minutes)

### Cache Service Interface
```typescript
class CachingService {
  async get<T>(key: string): Promise<T | undefined>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async del(key: string): Promise<void>
}
```

## Usage in Modules
Modules can import `CustomCacheModule` and inject `CachingService` to implement caching for their specific needs.

### Example Implementation
```typescript
// In a service
constructor(
  private readonly cacheService: CachingService
) {}

async getData(key: string): Promise<Data> {
  // Try cache first
  const cached = await this.cacheService.get<Data>(`data:${key}`);
  if (cached) return cached;
  
  // Fetch from database if not cached
  const data = await this.databaseService.find(key);
  
  // Cache for future requests
  await this.cacheService.set(`data:${key}`, data, 300);
  
  return data;
}
```

## Cache Invalidation Strategy
Cache invalidation follows these patterns:
1. **Time-based expiration**: All cached items have a TTL (default 5 minutes)
2. **Explicit invalidation**: Cache is cleared when underlying data changes
3. **Key-based organization**: Related data uses consistent key prefixes for bulk invalidation

## Performance Benefits
- Reduces database load for frequently accessed data
- Improves API response times
- Provides graceful degradation (in-memory fallback)
- Automatic cache warming strategies can be implemented per module