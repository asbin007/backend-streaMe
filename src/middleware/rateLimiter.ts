import { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  /** Derive the bucket key. Defaults to client IP. */
  keyBy?: (req: Request) => string;
  message?: string;
}

/**
 * Every bucket store created here is registered so a single sweep can evict
 * expired entries across all limiters. Without this the maps grew forever —
 * one entry per unique IP for the lifetime of the process.
 */
const stores: Array<Map<string, Bucket>> = [];
const SWEEP_INTERVAL_MS = 60_000;

const sweep = setInterval(() => {
  const now = Date.now();
  for (const store of stores) {
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }
}, SWEEP_INTERVAL_MS);

// Never hold the event loop open just to run the sweep.
sweep.unref?.();

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter({
  windowMs = 60_000,
  max = 180,
  keyBy = clientKey,
  message = 'Too many requests, please try again later',
}: RateLimiterOptions = {}) {
  const hits = new Map<string, Bucket>();
  stores.push(hits);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyBy(req);
    const now = Date.now();
    let bucket = hits.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
    }

    bucket.count += 1;
    hits.set(key, bucket);

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ message, retryAfter });
    }

    next();
  };
}

/**
 * Credential and OTP endpoints. Keyed by IP + submitted email so one attacker
 * cannot lock out a victim's account, and a botnet cannot spread a single
 * account's guesses across many IPs unnoticed.
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  keyBy: req => `${clientKey(req)}:${String(req.body?.email || '').toLowerCase()}`,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

/** Endpoints that send an email. Stricter, because abuse costs money. */
export const emailLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  max: 5,
  keyBy: req => `${clientKey(req)}:${String(req.body?.email || '').toLowerCase()}`,
  message: 'Too many email requests. Please wait before requesting another.',
});
