// apps/order-service/src/app.module.ts

import { Module }         from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { registerAs }     from '@nestjs/config';
import { OrderModule }    from './order/order.module';

const appConfig = registerAs('app', () => {
  const req = (k: string) => { const v = process.env[k]; if (!v) throw new Error(`Missing: ${k}`); return v; };
  return {
    nodeEnv:     process.env.NODE_ENV ?? 'development',
    port:        parseInt(process.env.PORT ?? '3003', 10),
    mongoUri:    req('MONGODB_URI'),
    mongoDbName: req('MONGODB_DB_NAME'),
    jwtSecret:   req('JWT_SECRET'),
    logLevel:    process.env.LOG_LEVEL ?? 'info',
  };
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig], expandVariables: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        uri: c.getOrThrow<string>('app.mongoUri'), dbName: c.getOrThrow<string>('app.mongoDbName'),
        maxPoolSize: 10, minPoolSize: 2, serverSelectionTimeoutMS: 5000, autoIndex: c.get('app.nodeEnv') !== 'production',
      }),
    }),
    OrderModule,
  ],
})
export class AppModule {}
