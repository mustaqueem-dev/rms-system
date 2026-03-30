// apps/menu-service/src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags }          from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; service: string; timestamp: string } {
    return {
      status:    'ok',
      service:   'menu-service',
      timestamp: new Date().toISOString(),
    };
  }
}
