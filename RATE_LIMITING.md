# Rate Limiting Configuration

## Overview

The application uses a hybrid rate limiting system:
- **Development**: In-memory rate limiting (no external dependencies)
- **Production**: Upstash Redis-based rate limiting (recommended)

## Current Limits

- **Auth endpoints** (login/signup): 5 requests per 15 minutes
- **Profile updates**: 10 requests per minute
- **Password reset**: 3 requests per hour

## Setup for Production (Upstash)

### 1. Create Upstash Account

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Create a new Redis database

### 2. Get Credentials

From your Upstash dashboard:
1. Click on your database
2. Go to **REST API** section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure Environment Variables

Add to your `.env.local` (development) and production environment:

```env
# Upstash Redis (for rate limiting in production)
UPSTASH_REDIS_REST_URL=your_upstash_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

### 4. Deploy

Once these variables are set in production, the app will automatically use Upstash for rate limiting.

## Development Mode

In development (without Upstash configured), the app uses in-memory rate limiting:
- Works locally without external services
- Data is cleared on server restart
- Not suitable for production (doesn't work across multiple server instances)

## Customizing Rate Limits

Edit `lib/rate-limit.ts` to adjust limits:

```typescript
// Auth endpoints: 5 requests per 15 minutes
export const authRateLimit = createRateLimiter(5, "15 m");

// Profile updates: 10 requests per minute  
export const profileRateLimit = createRateLimiter(10, "1 m");

// Password reset: 3 requests per hour
export const passwordResetRateLimit = createRateLimiter(3, "1 h");
```

## Testing Rate Limits

To test rate limiting in development:

1. Make multiple requests to an endpoint quickly
2. You should see a `429 Too Many Requests` response
3. Check response headers:
   - `X-RateLimit-Limit`: Total allowed requests
   - `X-RateLimit-Remaining`: Requests remaining
   - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Monitoring

In production with Upstash:
- Analytics are automatically enabled
- View request patterns in Upstash dashboard
- Monitor rate limit hits and patterns

## Alternative Solutions

If you prefer not to use Upstash:

1. **Vercel KV**: Built-in Redis for Vercel deployments
2. **Redis Cloud**: Self-hosted Redis instance
3. **Cloudflare Workers KV**: If deploying to Cloudflare

Update `lib/rate-limit.ts` to use your preferred provider.
