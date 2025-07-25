import { type NextFetchEvent, type NextMiddleware, type NextRequest, NextResponse } from 'next/server';
import type { NextMiddlewareResult } from 'next/dist/server/web/types';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { rateLimitConfigs, type RateLimitConfig } from '@workspace/constants';

const redis = Redis.fromEnv();

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = rateLimitConfigs.normal;

/**
 * Retrieves the IP address of the client making the request.
 * Checks various headers including 'x-forwarded-for', 'x-real-ip', and 'cf-connecting-ip'
 * to account for proxies such as Vercel or Cloudflare.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {string} - The client's IP address or 'unknown' if not found.
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }
  return 'unknown';
}

/**
 * Create a new Ratelimit instance with the provided configuration.
 *
 * @param {RateLimitConfig} config - The rate limit configuration.
 * @returns {Ratelimit} - An instance of the Ratelimit class.
 */
function createRatelimit(config: RateLimitConfig) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${Math.floor(config.windowMs / 1000)} s`),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });
}

/**
 * Adds rate limit information headers to the response object.
 *
 * @param {NextMiddlewareResult} response - The response object to modify.
 * @param {Awaited<ReturnType<Ratelimit['limit']>>} limit - The result of the rate limiter check for the current request.
 * @param {RateLimitConfig} config - The configuration used for the rate limiter, including the max requests allowed.
 */
function addRateLimitHeaders(
  response: NextMiddlewareResult,
  limit: Awaited<ReturnType<Ratelimit['limit']>>,
  config: RateLimitConfig,
): void {
  response?.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response?.headers.set('X-RateLimit-Remaining', limit.remaining.toString());
  response?.headers.set('X-RateLimit-Reset', Math.ceil(limit.reset / 1000).toString());
}

/**
 * Generates a response for requests that exceed the rate limit.
 *
 * @param {Awaited<ReturnType<Ratelimit['limit']>>} limit - The result of the rate limiter check for the current request.
 * @param {RateLimitConfig} config - The rate limit configuration used.
 * @returns {NextResponse} - A JSON response with status 429 (Too Many Requests) and appropriate headers.
 */
function createRateLimitResponse(limit: Awaited<ReturnType<Ratelimit['limit']>>, config: RateLimitConfig): NextResponse {
  const retryAfter = Math.ceil((limit.reset - Date.now()) / 1000);
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit reached. Please wait a while before retrying.',
      retryAfter: retryAfter,
    },
    { status: 429 },
  );
  response.headers.set('Retry-After', retryAfter.toString());
  addRateLimitHeaders(response, limit, config);
  return response;
}

/**
 * Higher-order middleware that applies rate limiting to API routes or pages in Next.js.
 *
 * @param {NextMiddleware} middleware - The original middleware to wrap and protect with rate limiting.
 * @param {Partial<RateLimitConfig>} [config={}] - Optional override for the default rate limit configuration.
 * @returns {NextMiddleware} - The wrapped middleware with rate limiting applied.
 */
export function ratelimit(middleware: NextMiddleware, config: Partial<RateLimitConfig> = {}): NextMiddleware {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const ratelimiter = createRatelimit(mergedConfig);

  return async (request: NextRequest, event: NextFetchEvent) => {
    const ip = getClientIP(request);

    const limit = await ratelimiter.limit(ip);
    if (!limit.success) {
      return createRateLimitResponse(limit, mergedConfig);
    }

    const response = await middleware(request, event);
    if (response) {
      addRateLimitHeaders(response, limit, mergedConfig);
    }
    return response;
  };
}
