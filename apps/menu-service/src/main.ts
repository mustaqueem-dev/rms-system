// apps/menu-service/src/main.ts

import { NestFactory }        from '@nestjs/core';
import { ValidationPipe }     from '@nestjs/common';
import { AppModule }          from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ConsoleLogger }      from '@rms/shared-kernel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Global validation — reject unknown fields, whitelist only DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter — maps AppError hierarchy to HTTP responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // API versioning prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  const logger = new ConsoleLogger({ service: 'menu-service' });
  logger.info(`Menu service listening`, { port: Number(port) });
}

bootstrap();