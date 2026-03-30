// apps/reporting-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule }      from '@nestjs/bullmq';
import reportingConfig     from './config/reporting.config';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [reportingConfig],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('reporting.redisHost'),
          port: config.getOrThrow<number>('reporting.redisPort'),
        },
      }),
    }),
    ReportingModule,
  ],
})
export class AppModule {}
