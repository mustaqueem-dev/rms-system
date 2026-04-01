// apps/reporting-service/src/reporting/application/cron/report-cron.service.ts
//
// Schedules automatic daily report generation at 23:59 each night.
// Uses @nestjs/schedule (CronJob under the hood).
// Falls back to manual queue injection so the controller can also trigger jobs.

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue }          from '@nestjs/bullmq';
import { Queue }                from 'bullmq';

@Injectable()
export class ReportCronService {
  private readonly logger = new Logger(ReportCronService.name);

  constructor(
    @InjectQueue('reports-queue') private readonly reportsQueue: Queue,
  ) {}

  /**
   * Fires every day at 23:59 — generates daily sales for all watched branches.
   * Branch list is read from env REPORTING_BRANCHES (comma-separated IDs).
   */
  @Cron('59 23 * * *', { name: 'daily-sales', timeZone: 'Asia/Kolkata' })
  async scheduleDailySalesReports(): Promise<void> {
    const branches = this.getBranches();
    const date     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    this.logger.log(`Enqueueing daily-sales reports for ${branches.length} branch(es) on ${date}`);

    await Promise.all(
      branches.map((branchId) =>
        this.reportsQueue.add(
          'generate-daily-sales',
          { date, branchId },
          { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
        ),
      ),
    );
  }

  /**
   * Fires every day at 06:00 — morning inventory status for managers.
   */
  @Cron('0 6 * * *', { name: 'morning-inventory', timeZone: 'Asia/Kolkata' })
  async scheduleInventoryReports(): Promise<void> {
    const branches = this.getBranches();
    this.logger.log(`Enqueueing inventory-status reports for ${branches.length} branch(es)`);

    await Promise.all(
      branches.map((branchId) =>
        this.reportsQueue.add(
          'generate-inventory-status',
          { branchId },
          { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
        ),
      ),
    );
  }

  // ── Manual trigger (used by controller) ──────────────────────────────────

  async triggerDailySales(branchId: string, date: string): Promise<string> {
    const job = await this.reportsQueue.add(
      'generate-daily-sales',
      { branchId, date },
      { attempts: 3 },
    );
    return job.id?.toString() ?? 'queued';
  }

  async triggerInventoryStatus(branchId: string): Promise<string> {
    const job = await this.reportsQueue.add(
      'generate-inventory-status',
      { branchId },
      { attempts: 3 },
    );
    return job.id?.toString() ?? 'queued';
  }

  private getBranches(): string[] {
    const env = process.env['REPORTING_BRANCHES'] ?? '';
    return env ? env.split(',').map((b) => b.trim()) : [];
  }
}
