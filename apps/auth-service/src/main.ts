// apps/auth-service/src/main.ts

import { NestFactory }       from '@nestjs/core';
import { ValidationPipe }    from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule }         from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ConsoleLogger }     from '@rms/shared-kernel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    forbidNonWhitelisted: true,
    transform:            true,
    transformOptions:     { enableImplicitConversion: true },
  }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RMS Auth Service')
      .setDescription('User authentication & authorization API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3004;
  await app.listen(port);

  const logger = new ConsoleLogger({ service: 'auth-service' });
  logger.info('Auth service listening', { port: Number(port) });
}

bootstrap();
