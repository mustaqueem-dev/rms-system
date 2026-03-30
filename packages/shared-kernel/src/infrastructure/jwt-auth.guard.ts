// packages/shared-kernel/src/infrastructure/jwt-auth.guard.ts

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
  SetMetadata,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { Reflector }      from '@nestjs/core';
import { JwtService }     from '@nestjs/jwt';

// ─── Role definitions ────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN      = 'SUPER_ADMIN',
  FRANCHISE_OWNER  = 'FRANCHISE_OWNER',
  BRANCH_MANAGER   = 'BRANCH_MANAGER',
  STAFF            = 'STAFF',
}

export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles) — metadata decorator to specify required roles on a route.
 * If not applied, any authenticated user can access the route.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ─── JWT Auth Guard ───────────────────────────────────────────────────────────

/**
 * JwtAuthGuard — validates Bearer token and attaches the decoded payload
 * to request.user for downstream use by @CurrentTenant() and @CurrentUserId().
 *
 * Expects JWT_SECRET in process.env (injected by ConfigService on NestJS startup).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token   = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    try {
      const payload     = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user      = payload;   // { sub, franchiseId, branchId, role, iat, exp }
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractBearerToken(request: { headers: Record<string, string> }): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}

// ─── Roles Guard ─────────────────────────────────────────────────────────────

/**
 * RolesGuard — checks request.user.role against the @Roles() metadata.
 * Must be used AFTER JwtAuthGuard (which populates request.user).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → any authenticated user is allowed
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}

// ─── Combined convenience decorator ──────────────────────────────────────────

/**
 * @Auth(...roles) — applies JwtAuthGuard + RolesGuard in one decorator.
 *
 * Usage:
 *   @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER)
 *   @Post('items')
 *   async create(...) { ... }
 */
export const Auth = (...roles: UserRole[]) =>
  applyDecorators(
    ...(roles.length > 0 ? [Roles(...roles)] : []),
    UseGuards(JwtAuthGuard, RolesGuard)
  );
