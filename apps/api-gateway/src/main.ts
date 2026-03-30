// apps/api-gateway/src/main.ts

import { NestFactory }   from '@nestjs/core';
import { AppModule }     from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Rate limiting, CORS, and Helmet would be configured here
  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`[API Gateway] Listening on port ${port}`);
}

bootstrap();
