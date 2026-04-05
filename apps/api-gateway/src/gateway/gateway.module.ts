// apps/api-gateway/src/gateway/gateway.module.ts

import { Module }              from '@nestjs/common';
import { JwtAuthGuard }        from './guards/jwt-auth.guard';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { HealthController }    from './health/health.controller';

@Module({
  controllers: [HealthController],
  providers:   [JwtAuthGuard, RateLimitMiddleware],
  exports:     [JwtAuthGuard, RateLimitMiddleware],
})
export class GatewayModule {}
