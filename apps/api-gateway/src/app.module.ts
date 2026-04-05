// apps/api-gateway/src/app.module.ts
//
// API Gateway — single ingress for all RMS microservices.
//
// Proxy routing table:
//   /api/v1/auth/**        → auth-service      :3004
//   /api/v1/menu/**        → menu-service      :3001
//   /api/v1/inventory/**   → inventory-service :3002
//   /api/v1/orders/**      → order-service     :3003
//   /api/v1/tables/**      → table-service     :3007
//   /api/v1/staff/**       → staff-service     :3008
//   /api/v1/reports/**     → reporting-service :3006
//
// Security layer (applied to all routes):
//   1. RateLimitMiddleware — sliding-window 429
//   2. JwtAuthGuard        — verifies JWT, injects x-user-* headers
//                            (PUBLIC_PATHS bypass the guard)

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD }                                  from '@nestjs/core';
import { ConfigModule, ConfigService }                from '@nestjs/config';
import { createProxyMiddleware }                      from 'http-proxy-middleware';
import gatewayConfig                                  from './config/gateway.config';
import { GatewayModule }                              from './gateway/gateway.module';
import { JwtAuthGuard }                               from './gateway/guards/jwt-auth.guard';
import { RateLimitMiddleware }                        from './gateway/middleware/rate-limit.middleware';

interface ServiceMap { [key: string]: string; }

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    GatewayModule,
  ],
  providers: [
    // Apply JwtAuthGuard globally via APP_GUARD
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {
  constructor(private readonly config: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    const services = this.config.get<ServiceMap>('gateway.services')!;

    // ── Rate limiter on ALL routes ────────────────────────────────────────────
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // ── Service proxies ────────────────────────────────────────────────────────
    const routes: Array<{ path: string; target: string }> = [
      { path: 'api/v1/auth/*',       target: services['auth']      },
      { path: 'api/v1/menu/*',       target: services['menu']      },
      { path: 'api/v1/inventory/*',  target: services['inventory'] },
      { path: 'api/v1/orders/*',     target: services['order']     },
      { path: 'api/v1/tables/*',     target: services['table']     },
      { path: 'api/v1/staff/*',      target: services['staff']     },
      { path: 'api/v1/reports/*',    target: services['reporting'] },
    ];

    for (const route of routes) {
      consumer
        .apply(
          createProxyMiddleware({
            target:       route.target,
            changeOrigin: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError:      (err: Error, _req: any, res: any) => {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                statusCode: 502,
                message: `Upstream service unavailable: ${err.message}`,
              }));
            },
          } as Parameters<typeof createProxyMiddleware>[0]),
        )
        .forRoutes({ path: route.path, method: RequestMethod.ALL });
    }
  }
}
