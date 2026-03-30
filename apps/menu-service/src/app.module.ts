// apps/menu-service/src/app.module.ts

import { Module }         from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuModule }     from './menu/menu.module';
import { HealthModule }   from './health/health.module';
import appConfig          from './config/app.config';

@Module({
  imports: [
    // Config — validates env vars at startup, fails fast if missing
    ConfigModule.forRoot({
      isGlobal:  true,
      load:      [appConfig],
      expandVariables: true,
    }),

    // MongoDB — async config from validated env
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('app.mongoUri'),
        dbName: config.getOrThrow<string>('app.mongoDbName'),

        // Connection pool tuned for enterprise load
        maxPoolSize:           20,
        minPoolSize:           5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS:       45000,
        connectTimeoutMS:      10000,

        // Auto-index in dev, manual in prod (avoids startup latency)
        autoIndex: config.get<string>('app.nodeEnv') !== 'production',
      }),
    }),

    MenuModule,
    HealthModule,
  ],
})
export class AppModule {}