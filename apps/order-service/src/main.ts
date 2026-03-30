// apps/order-service/src/main.ts

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
    const cfg = new DocumentBuilder().setTitle('RMS Order Service')
      .setDescription('Order lifecycle and state machine management')
      .setVersion('1.0').addBearerAuth().build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg));
  }
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  new ConsoleLogger({ service: 'order-service' }).info('Order service listening', { port: Number(port) });
}
bootstrap();
