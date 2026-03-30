// apps/notification-service/src/main.ts

import { NestFactory }       from '@nestjs/core';
import { AppModule }         from './app.module';
import { ConsoleLogger }     from '@rms/shared-kernel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const port = process.env.PORT || 3005;
  await app.listen(port);

  new ConsoleLogger({ service: 'notification-service' })
    .info('Notification Service listening (Kafka + BullMQ active)', { port: Number(port) });
}

bootstrap();
