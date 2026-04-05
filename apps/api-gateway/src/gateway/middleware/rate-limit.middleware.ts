// apps/api-gateway/src/gateway/middleware/rate-limit.middleware.ts
//
// Simple in-memory sliding-window rate limiter.
// For production use `@nestjs/throttler` backed by Redis instead.
// This implementation is good for single-instance deployments.

import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

interface WindowEntry { count: number; resetAt: number; }

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly store  = new Map<string, WindowEntry>();
  private readonly ttlMs:  number;
  private readonly limit:  number;

  constructor(private readonly config: ConfigService) {
    this.ttlMs = config.get<number>('gateway.throttleTtl',   60)  * 1000;
    this.limit = config.get<number>('gateway.throttleLimit', 120);
    // Periodically clean up stale entries
    setInterval(() => this.cleanup(), this.ttlMs * 2);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Key by IP + (userId header if present)
    const userId = req.headers['x-user-id'] as string | undefined;
    const ip     = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
                ?? req.socket.remoteAddress
                ?? 'unknown';
    const key    = userId ? `${ip}:${userId}` : ip;

    const now   = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.ttlMs });
      this.setHeaders(res, this.limit - 1, Math.ceil((now + this.ttlMs - now) / 1000));
      return next();
    }

    entry.count++;
    const remaining   = this.limit - entry.count;
    const resetInSecs = Math.ceil((entry.resetAt - now) / 1000);

    if (remaining < 0) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      this.setHeaders(res, 0, resetInSecs);
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:    'Too many requests — please slow down',
        retryAfter: resetInSecs,
      });
      return;
    }

    this.setHeaders(res, remaining, resetInSecs);
    next();
  }

  private setHeaders(res: Response, remaining: number, resetInSecs: number): void {
    res.setHeader('X-RateLimit-Limit',     this.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset',     resetInSecs);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  }
}
