export interface RateLimitConfig {
  /** Time window (milliseconds) */
  windowMs: number;
  /** Maximum number of requests */
  maxRequests: number;
  /** Skip successful requests */
  skipSuccessfulRequests?: boolean;
  /** Skip failed requests */
  skipFailedRequests?: boolean;
}

export const rateLimitConfigs = {
  // Strict limit (anti-abuse)
  strict: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // General limit
  normal: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Loose limit
  loose: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  },

  // API specific
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
  },
};
