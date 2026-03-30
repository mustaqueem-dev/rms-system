// apps/reporting-service/src/main.ts

import { NestFactory }       from '@nestjs/core';
import { AppModule }         from './app.module';
import { ConsoleLogger }     from '@rms/shared-kernel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const port = process.env.PORT || 3006;
  await app.listen(port);

  new ConsoleLogger({ service: 'reporting-service' })
    .info('Reporting Service listening (BullMQ workers active)', { port: Number(port) });
}

bootstrap();
