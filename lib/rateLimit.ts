/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * Uses a sliding-window counter keyed by IP address.
 * On Vercel, each serverless function instance has its own memory,
 * so this prevents burst abuse within a single instance. For stricter
 * multi-instance limiting, swap the Map for Upstash Redis.
 *
 * Usage:
 *   const { success, retryAfter } = rateLimit(req, { limit: 10, windowMs: 60_000 });
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Global store — persists across requests in the same serverless instance
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt <= now) store.delete(key);
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional key prefix to namespace different limits */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Seconds until the limit resets (only set when success = false) */
  retryAfter?: number;
}

/**
 * Extract the real client IP from Next.js request headers.
 * Checks x-forwarded-for (Vercel/proxies) then falls back to a default.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export function rateLimit(
  req: Request,
  options: RateLimitOptions,
): RateLimitResult {
  const { limit, windowMs, prefix = 'rl' } = options;
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // Start a new window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}
