// apps/reporting-service/src/reporting/reporting.module.ts

import { Module }            from '@nestjs/common';
import { ScheduleModule }    from '@nestjs/schedule';
import { BullModule }        from '@nestjs/bullmq';
import { MongooseModule }    from '@nestjs/mongoose';
import { ConfigService }     from '@nestjs/config';

// ── Infrastructure ────────────────────────────────────────────────────────────
import { AnalyticsService }   from './infrastructure/analytics.service';
import { PdfService }         from './infrastructure/pdf.service';

// ── Application ───────────────────────────────────────────────────────────────
import { ReportWorker }       from './application/workers/report.worker';
import { ReportCronService }  from './application/cron/report-cron.service';

// ── Presentation ──────────────────────────────────────────────────────────────
import { ReportController }   from './presentation/report.controller';

@Module({
  imports: [
    // Named Mongoose connection to shared orders+inventory DB (read-only replica)
    MongooseModule.forRootAsync({
      connectionName: 'reporting',
      inject:  [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('reporting.mongoUri', 'mongodb://localhost:27017/rms_reporting'),
        readPreference: 'secondaryPreferred',
      }),
    }),

    BullModule.registerQueue({ name: 'reports-queue' }),

    ScheduleModule.forRoot(),
  ],
  controllers: [ReportController],
  providers: [
    AnalyticsService,
    PdfService,
    ReportWorker,
    ReportCronService,
  ],
})
export class ReportingModule {}
