import { type NextFetchEvent, type NextProxy, type NextRequest, NextResponse } from 'next/server';
import type { NextMiddlewareResult } from 'next/dist/server/web/types';
import { rateLimitConfigs, type RateLimitConfig } from '@workspace/constants';

/**
 * Default configuration for rate limiting
 */
const DEFAULT_CONFIG: RateLimitConfig = rateLimitConfigs.normal;

interface RequestRecord {
  /** Number of requests made by the client */
  count: number;
  /** Time when the request count will be reset (timestamp in milliseconds) */
  resetTime: number;
}

/**
 * In-memory storage for tracking the number of requests made by clients.
 * Maps client IP addresses to their respective request records, which include
 * the count of requests and the reset time for the request count.
 */
const requestCounts = new Map<string, RequestRecord>();

/**
 * Removes expired request records from the in-memory storage.
 * Iterates through all stored request records and deletes any records
 * where the reset time has passed the current time.
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Retrieves the IP address of the client making the request.
 * Checks various headers including 'x-forwarded-for', 'x-real-ip', and 'cf-connecting-ip'
 * to account for proxies such as Vercel or Cloudflare.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {string} - The client's IP address or 'unknown' if not found.
 */
function getClientIP(request: NextRequest): string {
  // For cases involving proxies such as Vercel and Cloudflare
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  // Check other headers as well
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  return 'unknown';
}

/**
 * Adds rate limit headers to the response.
 *
 * This function sets the `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers
 * to provide information about the rate limit to the client. These headers include the maximum allowable
 * requests, the remaining number of requests allowed, and the time when the rate limit will reset.
 *
 * @param {NextMiddlewareResult} response - The response object to which headers will be added.
 * @param {RequestRecord} record - The request record containing the current request count and reset time.
 * @param {RateLimitConfig} config - The rate limit configuration including maxRequests and windowMs.
 */
function addRateLimitHeaders(
  response: NextMiddlewareResult,
  record: RequestRecord,
  config: RateLimitConfig,
): void {
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetTime = Math.ceil(record.resetTime / 1000);

  response?.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response?.headers.set('X-RateLimit-Remaining', remaining.toString());
  response?.headers.set('X-RateLimit-Reset', resetTime.toString());
}

/**
 * Creates a rate limit response when the client exceeds the allowed number of requests.
 *
 * This function generates a JSON response with a 429 status code indicating that the rate limit
 * has been reached. It includes a `Retry-After` header that specifies how long the client
 * should wait before making another request. Additionally, rate limit information is added
 * to the response headers using the `addRateLimitHeaders` function.
 *
 * @param {RequestRecord} record - The request record containing the current request count and reset time.
 * @param {RateLimitConfig} config - The rate limit configuration including maxRequests and windowMs.
 * @returns {NextResponse} - The response object with rate limit headers and error details.
 */
function createRateLimitResponse(record: RequestRecord, config: RateLimitConfig): NextResponse {
  const retryAfter = Math.ceil((record.resetTime - Date.now()) / 1000);

  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit reached. Please wait a while before retrying.',
      retryAfter: retryAfter,
    },
    { status: 429 },
  );

  response.headers.set('Retry-After', retryAfter.toString());
  addRateLimitHeaders(response, record, config);

  return response;
}

/**
 * Middleware to apply rate limiting to incoming requests.
 *
 * This function wraps another middleware and enforces rate limiting based on the provided configuration.
 * It tracks the number of requests made by each client (identified by IP address) within a specified time window
 * and limits the number of allowable requests. If the limit is exceeded, a 429 response is returned.
 *
 * @param {NextProxy} proxy - The middleware to wrap with rate limiting.
 * @param {Partial<RateLimitConfig>} config - Optional rate limit configuration to customize behavior.
 *   - windowMs: Time window for rate limiting (in milliseconds).
 *   - maxRequests: Maximum number of requests allowed within the time window.
 *   - skipSuccessfulRequests: Whether to skip counting successful requests (default: false).
 *   - skipFailedRequests: Whether to skip counting failed requests (default: false).
 * @returns {NextProxy} - A new middleware function that enforces rate limiting.
 */
export function ratelimit(proxy: NextProxy, config: Partial<RateLimitConfig> = {}): NextProxy {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async (request: NextRequest, event: NextFetchEvent) => {
    const ip = getClientIP(request);
    const now = Date.now();

    // Periodic cleanup (executed with a 10% probability)
    if (Math.random() < 0.1) {
      cleanupExpiredRecords();
    }

    // Retrieve or create the current record
    let record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // Start of a new window
      record = {
        count: 0,
        resetTime: now + mergedConfig.windowMs,
      };
      requestCounts.set(ip, record);
    }

    // Increment request count
    record.count++;

    // Check rate limit
    if (record.count > mergedConfig.maxRequests) {
      return createRateLimitResponse(record, mergedConfig);
    }

    // Execute the next middleware or response processing
    const response = await proxy(request, event);

    // If a response exists, add rate limit information
    if (response) {
      addRateLimitHeaders(response, record, mergedConfig);
    }

    return response;
  };
}
