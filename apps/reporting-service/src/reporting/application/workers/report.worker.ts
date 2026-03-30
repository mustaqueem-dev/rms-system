// apps/reporting-service/src/reporting/application/workers/report.worker.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job }                   from 'bullmq';
import { ConsoleLogger }         from '@rms/shared-kernel';

@Processor('reports-queue')
export class ReportWorker extends WorkerHost {
  private readonly logger = new ConsoleLogger({ service: 'ReportWorker' });

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.info(`Processing report generation job`, { jobId: job.id, name: job.name });

    switch (job.name) {
      case 'generate-daily-sales':
        await this.handleDailySales(job.data);
        break;
      case 'generate-inventory-status':
        await this.handleInventoryStatus(job.data);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleDailySales(data: any) {
    this.logger.info(`[MOCK] Generating PDF for Daily Sales...`, { date: data.date, branchId: data.branchId });
    // Simulate intensive PDF generation task
    await new Promise(r => setTimeout(r, 2000));
    this.logger.info(`[MOCK] Daily Sales PDF Generated successfully! Saving to cloud storage...`);
  }

  private async handleInventoryStatus(data: any) {
    this.logger.info(`[MOCK] Generating PDF for Inventory Status...`, { branchId: data.branchId });
    await new Promise(r => setTimeout(r, 1500));
    this.logger.info(`[MOCK] Inventory Status PDF Generated successfully!`);
  }
}
