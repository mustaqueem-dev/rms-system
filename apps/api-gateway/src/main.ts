// apps/api-gateway/src/main.ts

import { NestFactory }     from '@nestjs/core';
import { Logger }          from '@nestjs/common';
import { ConfigService }   from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }       from './app.module';

const logger = new Logger('ApiGateway');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  const config = app.get(ConfigService);
  const port   = config.get<number>('gateway.port', 3000);

  // ── Helmet — security headers ────────────────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmet = require('helmet');
    app.use(helmet() as Parameters<typeof app.use>[0]);
    logger.log('Helmet security headers enabled');
  } catch {
    logger.warn('helmet not installed — security headers disabled');
  }

  // ── CORS ─────────────────────────────────────────────────────────────────────
  const origins = config.get<string[]>('gateway.corsOrigins', ['*']);
  app.enableCors({
    origin:      origins.length === 1 && origins[0] === '*' ? '*' : origins,
    methods:     'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ── Swagger ──────────────────────────────────────────────────────────────────
  const swaggerDoc = new DocumentBuilder()
    .setTitle('RMS API Gateway')
    .setDescription(
      'Single ingress for Restaurant Management System microservices.\n\n' +
      'All `/api/v1/*` routes are proxied to the appropriate downstream service.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  logger.log(`✅ API Gateway running → http://localhost:${port}`);
  logger.log(`📄 Swagger docs      → http://localhost:${port}/api/docs`);
}

bootstrap();
