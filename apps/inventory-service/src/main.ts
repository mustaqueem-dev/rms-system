// apps/inventory-service/src/main.ts

import { NestFactory }       from '@nestjs/core';
import { ValidationPipe }    from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule }         from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ConsoleLogger }     from '@rms/shared-kernel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true,
    transform: true, transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api/v1');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RMS Inventory Service')
      .setDescription('Stock tracking and reorder management')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  new ConsoleLogger({ service: 'inventory-service' }).info('Inventory service listening', { port: Number(port) });
}

bootstrap();
