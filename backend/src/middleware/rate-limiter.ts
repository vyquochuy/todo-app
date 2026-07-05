import type { Context, Next } from "hono";
import { AppError } from "./error-handler.js";

// Global cache to track request frequencies
// Tracks client IP -> { count: number, resetTime: number }
const ipCache = new Map<string, { count: number; resetTime: number }>();

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60;          // max 60 requests per minute

/**
 * IP-based Rate Limiter middleware.
 *
 * Prevents DDoS and brute-force spam by limiting clients to 60 requests
 * per minute. Attaches standard rate-limiting headers to responses.
 */
export async function rateLimiter(c: Context, next: Next) {
  // Retrieve IP from Cloudflare's connecting header, proxy, or fallback
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For") ||
    "127.0.0.1";

  const now = Date.now();
  let record = ipCache.get(ip);

  // If new IP or window elapsed, reset window
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + WINDOW_SIZE_MS };
    ipCache.set(ip, record);
  } else {
    record.count++;
  }

  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  const resetSeconds = Math.ceil(record.resetTime / 1000);

  // Set standard rate limit headers
  c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
  c.header("X-RateLimit-Remaining", remaining.toString());
  c.header("X-RateLimit-Reset", resetSeconds.toString());

  if (record.count > MAX_REQUESTS) {
    throw new AppError(429, "Too many requests. Please try again in a minute.");
  }

  await next();
}
