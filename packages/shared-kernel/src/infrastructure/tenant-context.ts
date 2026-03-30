// packages/shared-kernel/src/infrastructure/tenant-context.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * TenantContext — typed representation of the multi-tenant identity
 * extracted from the validated JWT payload on every authenticated request.
 *
 * Every repository/use-case must scope ALL queries to franchiseId + branchId
 * to enforce strict data isolation between restaurant chain locations.
 */
export interface TenantContext {
  userId:      string;
  franchiseId: string;
  branchId:    string;
  role:        string;
}

/**
 * @CurrentTenant() parameter decorator.
 *
 * Usage:
 *   @Get('items')
 *   async list(@CurrentTenant() tenant: TenantContext) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    const user    = request.user;
    return {
      userId:      user.sub,
      franchiseId: user.franchiseId,
      branchId:    user.branchId,
      role:        user.role,
    };
  }
);

/**
 * @CurrentUserId() parameter decorator — convenience shorthand.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub;
  }
);
