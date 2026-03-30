// apps/auth-service/src/app.module.ts

import { Module }         from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig          from './config/app.config';
import { AuthModule }     from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:        true,
      load:            [appConfig],
      expandVariables: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:    config.getOrThrow<string>('app.mongoUri'),
        dbName: config.getOrThrow<string>('app.mongoDbName'),
        maxPoolSize:              10,
        minPoolSize:              2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS:          45000,
        autoIndex: config.get('app.nodeEnv') !== 'production',
      }),
    }),

    AuthModule,
  ],
})
export class AppModule {}
