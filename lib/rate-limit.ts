import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory rate limiting for development
class InMemoryRateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(identifier: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or initialize request timestamps for this identifier
    const timestamps = this.requests.get(identifier) || [];
    
    // Filter out old requests outside the window
    const recentRequests = timestamps.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + this.windowMs;
      
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - recentRequests.length,
      reset: now + this.windowMs,
    };
  }
}

// Create rate limiters based on environment
const createRateLimiter = (requests: number, windowStr: string) => {
  // Use Upstash in production if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Parse window string to duration format for Upstash
    let duration: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
    
    if (windowStr.endsWith("m")) {
      duration = `${parseInt(windowStr)} m` as `${number} m`;
    } else if (windowStr.endsWith("h")) {
      duration = `${parseInt(windowStr)} h` as `${number} h`;
    } else if (windowStr.endsWith("d")) {
      duration = `${parseInt(windowStr)} d` as `${number} d`;
    } else {
      duration = `${parseInt(windowStr)} s` as `${number} s`;
    }
    
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(requests, duration),
      analytics: true,
      prefix: "@ratelimit",
    });
  }

  // Fallback to in-memory for development
  const windowMs = windowStr.endsWith("s") 
    ? parseInt(windowStr) * 1000 
    : windowStr.endsWith("m") 
    ? parseInt(windowStr) * 60 * 1000 
    : parseInt(windowStr) * 60 * 60 * 1000;

  return new InMemoryRateLimiter(requests, windowMs);
};

// Auth endpoints: 5 requests per 15 minutes
export const authRateLimit = createRateLimiter(5, "15 m");

// Profile updates: 10 requests per minute
export const profileRateLimit = createRateLimiter(10, "1 m");

// Password reset: 3 requests per hour
export const passwordResetRateLimit = createRateLimiter(3, "1 h");

// Helper function to get client IP
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}
