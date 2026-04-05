// apps/staff-service/src/main.ts

import { NestFactory }       from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule }         from './app.module';
import { AllExceptionsFilter, ConsoleLogger, LoggingInterceptor, GlobalValidationPipe } from '@rms/shared-kernel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalPipes(new GlobalValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.setGlobalPrefix('api/v1');

  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RMS Staff & Shift Service')
      .setDescription('Staff shift scheduling and clock-in/out attendance API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env['PORT'] ?? 3008;
  await app.listen(port);

  const logger = new ConsoleLogger({ service: 'staff-service' });
  logger.info('Staff service listening', { port: Number(port) });
}

bootstrap();
