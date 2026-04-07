/**
 * ============================================================
 * Rate Limiter — In-Memory Sliding Window
 * ============================================================
 * 
 * Prevents brute-force face matching attempts and API abuse.
 * Uses a sliding window counter stored in a global Map.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Global store (persists across hot reloads in dev)
declare global {
  var rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store = global.rateLimitStore || new Map<string, RateLimitEntry>();
if (!global.rateLimitStore) {
  global.rateLimitStore = store;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Default configs for different endpoints */
export const RATE_LIMITS = {
  /** Face search/verify — prevent brute force */
  ML_SEARCH: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Face registration */
  ML_REGISTER: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Login attempts */
  AUTH_LOGIN: { maxRequests: 10, windowSeconds: 300 } as RateLimitConfig,
  /** General API */
  API_GENERAL: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
  /** Attendance marking */
  ATTENDANCE_MARK: { maxRequests: 20, windowSeconds: 60 } as RateLimitConfig,
};

/**
 * Check rate limit for a given key (typically IP or IP+endpoint).
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfterSeconds }`
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterSeconds?: number; remaining?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // Start new window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}
