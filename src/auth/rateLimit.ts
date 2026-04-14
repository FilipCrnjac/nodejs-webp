import { NextFunction, Request, Response } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  max: number;
  windowMs: number;
};

const buckets = new Map<string, RateLimitEntry>();

function createRateLimiter(options: RateLimitOptions) {
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const userId = (req as Request & { userId?: number }).userId;
    const identity = userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`;
    const key = `${options.keyPrefix}:${identity}`;

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: true,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

export = createRateLimiter;

