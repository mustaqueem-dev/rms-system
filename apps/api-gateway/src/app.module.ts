// apps/api-gateway/src/app.module.ts

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createProxyMiddleware }       from 'http-proxy-middleware';
import gatewayConfig                   from './config/gateway.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [gatewayConfig],
    }),
  ],
})
export class AppModule {
  constructor(private readonly config: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const services = this.config.get<{ [key: string]: string }>('gateway.services');

    if (!services) throw new Error('Gateway services not configured');

    consumer
      .apply(createProxyMiddleware({ target: services.auth, changeOrigin: true }))
      .forRoutes({ path: 'api/v1/auth/*', method: RequestMethod.ALL });

    consumer
      .apply(createProxyMiddleware({ target: services.menu, changeOrigin: true }))
      .forRoutes({ path: 'api/v1/menu/*', method: RequestMethod.ALL });

    consumer
      .apply(createProxyMiddleware({ target: services.inventory, changeOrigin: true }))
      .forRoutes({ path: 'api/v1/inventory/*', method: RequestMethod.ALL });

    consumer
      .apply(createProxyMiddleware({ target: services.order, changeOrigin: true }))
      .forRoutes({ path: 'api/v1/orders/*', method: RequestMethod.ALL });
  }
}
