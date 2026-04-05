// apps/api-gateway/src/gateway/health/health.controller.ts
//
// GET /api/v1/health — lightweight liveness probe.
// Does NOT check downstream services (use dedicated readiness probes for that).

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('api/v1/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Gateway liveness probe' })
  check(): Record<string, unknown> {
    return {
      status:    'ok',
      service:   'api-gateway',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
    };
  }
}
