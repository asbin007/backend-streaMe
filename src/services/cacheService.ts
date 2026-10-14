import NodeCache from 'node-cache';
import Redis from 'ioredis';

// Two-tier cache. Redis when REDIS_URL is set (survives restarts, shared
// across instances, so horizontal scaling and warm Fly.io deploys benefit
// from the hit rate); in-memory NodeCache fallback for local dev and if
// Redis is unreachable. Callers see one surface: Promise<T|undefined> get,
// Promise set/del/flush.
//
// Keeping the memory fallback matters because tmdbService.getContents
// unconditionally awaits cacheService.get(); a Redis outage must not take
// the API down with it.

const REDIS_URL = process.env.REDIS_URL;
const DEFAULT_TTL = 300;

export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

class MemoryCache implements Cache {
  private c: NodeCache;
  constructor(ttl: number) {
    this.c = new NodeCache({ stdTTL: ttl, checkperiod: ttl * 0.2, useClones: false });
  }
  async get<T>(k: string) { return this.c.get<T>(k); }
  async set<T>(k: string, v: T, ttl?: number) {
    if (ttl) this.c.set(k, v, ttl); else this.c.set(k, v);
  }
  async del(k: string) { this.c.del(k); }
  async flush() { this.c.flushAll(); }
}

class RedisCache implements Cache {
  private r: Redis;
  private fallback: MemoryCache;
  private healthy = true;

  constructor(url: string, ttl: number) {
    this.fallback = new MemoryCache(ttl);
    this.r = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
      // ponytail: upstash + ioredis sometimes drops a dangling socket on
      // free tiers. Reconnect quietly instead of crashing the process.
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    this.r.on('error', (err) => {
      if (this.healthy) {
        console.warn('[cache] Redis error, falling back to memory:', err.message);
        this.healthy = false;
      }
    });
    this.r.on('ready', () => { this.healthy = true; });
  }

  async get<T>(k: string): Promise<T | undefined> {
    if (!this.healthy) return this.fallback.get<T>(k);
    try {
      const v = await this.r.get(k);
      return v == null ? undefined : (JSON.parse(v) as T);
    } catch {
      return this.fallback.get<T>(k);
    }
  }

  async set<T>(k: string, v: T, ttl?: number) {
    const s = JSON.stringify(v);
    await this.fallback.set(k, v, ttl);
    if (!this.healthy) return;
    try {
      if (ttl) await this.r.setex(k, ttl, s);
      else await this.r.set(k, s);
    } catch {
      // fallback already carries the value
    }
  }

  async del(k: string) {
    await this.fallback.del(k);
    if (!this.healthy) return;
    try { await this.r.del(k); } catch { /* ignore */ }
  }

  async flush() {
    await this.fallback.flush();
    if (!this.healthy) return;
    try { await this.r.flushdb(); } catch { /* ignore */ }
  }
}

export const cacheService: Cache = REDIS_URL
  ? new RedisCache(REDIS_URL, DEFAULT_TTL)
  : new MemoryCache(DEFAULT_TTL);

if (!REDIS_URL) {
  console.info('[cache] REDIS_URL not set — using in-memory cache (lost on restart, per-instance only).');
} else {
  console.info('[cache] Using Redis cache at', REDIS_URL.replace(/:[^@]+@/, ':***@'));
}
