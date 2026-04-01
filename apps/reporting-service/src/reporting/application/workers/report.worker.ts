// apps/reporting-service/src/reporting/application/workers/report.worker.ts
//
// BullMQ worker that generates PDFs and stores them.
// Uses AnalyticsService + PdfService; saves to local uploads/ dir
// (swap to S3/GCS in production by injecting a StorageService).

import * as fs   from 'fs';
import * as path from 'path';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job }                   from 'bullmq';
import { ConsoleLogger }         from '@rms/shared-kernel';
import { AnalyticsService }      from '../../infrastructure/analytics.service';
import { PdfService }            from '../../infrastructure/pdf.service';

interface DailySalesJobData   { date: string;    branchId: string; }
interface InventoryJobData    { branchId: string; }

@Processor('reports-queue')
export class ReportWorker extends WorkerHost {
  private readonly logger      = new ConsoleLogger({ service: 'ReportWorker' });
  private readonly uploadsDir: string;

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly pdf:       PdfService,
  ) {
    super();
    this.uploadsDir = process.env['REPORTS_UPLOAD_DIR'] ?? path.join(process.cwd(), 'uploads', 'reports');
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  async process(job: Job<unknown, unknown, string>): Promise<string> {
    this.logger.info(`Processing report job`, { jobId: job.id, name: job.name });

    switch (job.name) {
      case 'generate-daily-sales':
        return this.handleDailySales(job.data as DailySalesJobData);
      case 'generate-inventory-status':
        return this.handleInventoryStatus(job.data as InventoryJobData);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return 'skipped';
    }
  }

  private async handleDailySales(data: DailySalesJobData): Promise<string> {
    const summary = await this.analytics.getDailySales(data.branchId, data.date);
    const buffer  = await this.pdf.generateDailySalesPdf(summary);

    const filename = `daily-sales_${data.branchId}_${data.date}.pdf`;
    const filepath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    this.logger.info(`Daily sales PDF saved`, { filename, bytes: buffer.length });
    return filepath;
  }

  private async handleInventoryStatus(data: InventoryJobData): Promise<string> {
    const summary = await this.analytics.getInventoryStatus(data.branchId);
    const buffer  = await this.pdf.generateInventoryStatusPdf(summary);

    const filename = `inventory-status_${data.branchId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const filepath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    this.logger.info(`Inventory status PDF saved`, { filename, bytes: buffer.length });
    return filepath;
  }
}
