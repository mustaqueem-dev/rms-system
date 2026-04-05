// apps/api-gateway/src/gateway/guards/jwt-auth.guard.ts
//
// Lightweight JWT verification guard at the gateway level.
// This is NOT a replacement for per-service JWT auth — it's an additional
// ingress check that rejects obviously invalid tokens before proxying,
// reducing load on downstream services.
//
// Routes listed in PUBLIC_PATHS are allowed through without a token.

import {
  CanActivate, ExecutionContext, Injectable,
  UnauthorizedException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request }       from 'express';
import * as jwt          from 'jsonwebtoken';

// Paths that don't require a JWT (login, register, health)
const PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/health',
  '/api/docs',
];

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.secret = config.getOrThrow<string>('gateway.jwtSecret');
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();

    // Allow public paths
    if (PUBLIC_PATHS.some((p) => req.path.startsWith(p))) {
      return true;
    }

    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('No bearer token provided');
    }

    try {
      const payload = jwt.verify(token, this.secret) as Record<string, unknown>;
      // Forward decoded claims as headers to downstream services
      req.headers['x-user-id']       = String(payload['sub']         ?? '');
      req.headers['x-user-role']     = String(payload['role']        ?? '');
      req.headers['x-branch-id']     = String(payload['branchId']    ?? '');
      req.headers['x-franchise-id']  = String(payload['franchiseId'] ?? '');
      return true;
    } catch (err) {
      this.logger.warn(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
