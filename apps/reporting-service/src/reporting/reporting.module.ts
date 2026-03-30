// apps/reporting-service/src/reporting/reporting.module.ts

import { Module }       from '@nestjs/common';
import { BullModule }   from '@nestjs/bullmq';
import { ReportWorker } from './application/workers/report.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reports-queue',
    }),
  ],
  providers: [ReportWorker],
})
export class ReportingModule {}
