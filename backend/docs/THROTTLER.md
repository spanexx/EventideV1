# Throttler (Rate Limiting) Documentation

## What is Throttler?

Throttler is a rate-limiting mechanism in NestJS that protects your API from abuse by limiting how many requests a client can make within a specific time period. It acts as a protective barrier against:

1. **Brute Force Attacks**: Prevents automated password guessing
2. **Denial of Service (DoS)**: Stops malicious users from overwhelming the server
3. **API Abuse**: Limits excessive usage that could impact performance
4. **Resource Exhaustion**: Prevents overconsumption of server resources

## How Throttler Works

The throttler uses a **token bucket algorithm**:

```
Time:     0s    10s   20s   30s   40s   50s   60s
Tokens:   10    10    10    8     8     8     10
Requests: 0     0     2     0     2     0     0
```

- Each endpoint has a "bucket" with a limited number of tokens
- Each request consumes one token
- Tokens are replenished over time (TTL - Time To Live)
- When no tokens remain, requests are blocked until tokens are replenished

## Configuration

### Global Configuration

In `app.module.ts`:
```typescript
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    throttlers: [{
      // Time-to-live: 60 seconds by default
      // After this time, consumed tokens are replenished
      ttl: configService.get<number>('THROTTLE_TTL', 60),
      // Limit: 10 requests per TTL period per IP address
      // After 10 requests, subsequent requests will be blocked until TTL expires
      limit: configService.get<number>('THROTTLE_LIMIT', 10),
    }]
  }),
})
```

This sets a global default of 10 requests per minute per IP address.

### Environment Variables

In `.env` files:
```env
# Throttling
THROTTLE_TTL=60      # 60 seconds
THROTTLE_LIMIT=10    # 10 requests per TTL period
```

## Endpoint-Specific Throttling

Different endpoints can have different throttling rules based on their sensitivity and usage patterns.

### Auth Endpoints

#### Signup Endpoint (`POST /api/auth/signup`)
```typescript
@Throttle({
  // Short-term limit: 5 signup attempts per minute per IP
  // Prevents rapid account creation spam
  short: { limit: 5, ttl: 60000 }, // 5 attempts per minute
  // Long-term limit: 10 signup attempts per hour per IP
  // Prevents sustained account creation abuse
  long: { limit: 10, ttl: 3600000 }, // 10 attempts per hour
})
```

**Reasoning**: Account creation is a sensitive operation that should be rate-limited to prevent spam and bot registrations.

#### Login Endpoint (`POST /api/auth/login`)
```typescript
@Throttle({
  // Short-term limit: 5 login attempts per minute per IP
  // Prevents brute force password attacks
  short: { limit: 5, ttl: 60000 }, // 5 attempts per minute
  // Long-term limit: 10 login attempts per hour per IP
  // Prevents sustained login attempts
  long: { limit: 10, ttl: 3600000 }, // 10 attempts per hour
})
```

**Reasoning**: Login is vulnerable to brute force attacks. Strict limits protect against password guessing while allowing legitimate users to retry.

#### Refresh Token Endpoint (`POST /api/auth/refresh`)
```typescript
@Throttle({ 
  // Default limit: 10 refresh attempts per minute per IP
  // Prevents token refresh abuse while allowing normal usage
  default: { limit: 10, ttl: 60000 } 
})
```

**Reasoning**: Token refresh is a common operation for active users. Higher limits accommodate normal usage while preventing abuse.

#### Forgot Password Endpoint (`POST /api/auth/forgot-password`)
```typescript
@Throttle({ 
  // Default limit: 5 forgot password requests per minute per IP
  // Prevents email spam while allowing legitimate users to request resets
  default: { limit: 5, ttl: 60000 } 
})
```

**Reasoning**: Prevents attackers from spamming the email system with password reset requests.

#### Reset Password Endpoint (`POST /api/auth/reset-password`)
```typescript
@Throttle({ 
  // Default limit: 5 password reset attempts per minute per IP
  // Prevents brute force attempts to guess reset tokens
  default: { limit: 5, ttl: 60000 } 
})
```

**Reasoning**: Reset tokens are sensitive. Limits prevent attackers from trying to guess valid tokens.

## Error Handling

When rate limits are exceeded, the API returns a `429 Too Many Requests` error:

```json
{
  "success": false,
  "data": null,
  "message": "Too many requests",
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests",
    "details": {
      "message": "Too many requests",
      "error": "Too Many Requests",
      "statusCode": 429
    }
  },
  "meta": {
    "timestamp": "2025-09-02T20:35:00.000Z",
    "statusCode": 429
  }
}
```

## Testing Rate Limits

You can test rate limits by making multiple rapid requests to a throttled endpoint:

```bash
# This will work for the first 5 attempts (with signup throttling)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email": "test'$i'@example.com", "password": "password123"}'
done
```

After the 6th request, you should receive a 429 error.

## Best Practices

1. **Set Appropriate Limits**: Balance between security and usability
2. **Use Endpoint-Specific Limits**: Different endpoints need different protection levels
3. **Monitor Usage Patterns**: Watch for unusual spikes that might indicate attacks
4. **Log Throttled Requests**: Keep track of rate-limited requests for security analysis
5. **Consider User Experience**: Provide clear error messages to users

## Security Considerations

1. **IP-Based Throttling**: Limits are applied per IP address to prevent simple workarounds
2. **Multiple Time Windows**: Short and long-term limits provide comprehensive protection
3. **Graceful Degradation**: Users get clear feedback when limits are exceeded
4. **No Information Leakage**: Error messages don't reveal whether accounts exist

## Customization

You can customize throttling behavior by:

1. **Adjusting TTL and Limit Values**: Based on your application's usage patterns
2. **Adding Custom Storage**: Use Redis for distributed rate limiting in multi-server deployments
3. **Implementing Custom Guards**: For more complex rate limiting logic
4. **Whitelisting IPs**: Allow trusted IPs to have higher limits

## Monitoring

Rate limiting events should be monitored to:
- Detect potential attacks
- Identify legitimate users hitting limits
- Adjust limits based on actual usage
- Track API performance and abuse patterns