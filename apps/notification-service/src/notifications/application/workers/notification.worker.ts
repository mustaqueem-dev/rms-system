// apps/notification-service/src/notifications/application/workers/notification.worker.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job }                   from 'bullmq';
import { ConsoleLogger }         from '@rms/shared-kernel';

@Processor('notifications-queue')
export class NotificationWorker extends WorkerHost {
  private readonly logger = new ConsoleLogger({ service: 'NotificationWorker' });

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.info(`Processing notification job`, { jobId: job.id, name: job.name });

    switch (job.name) {
      case 'send-order-confirmation':
        await this.handleOrderConfirmation(job.data);
        break;
      case 'send-low-stock-alert':
        await this.handleLowStockAlert(job.data);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleOrderConfirmation(data: any) {
    // Mock connecting to SMS/Email provider
    this.logger.info(`[MOCK] Sending order confirmation to customer`, {
      orderId: data.orderId,
      branchId: data.branchId,
      amount: data.totalAmount,
    });
    // Simulate delay
    await new Promise(r => setTimeout(r, 500));
  }

  private async handleLowStockAlert(data: any) {
    // Mock connecting to WhatsApp/SMS for Manager alert
    this.logger.info(`[MOCK] Sending LOW STOCK ALERT to Manager`, {
      itemId: data.itemId,
      branchId: data.branchId,
      currentQty: data.currentQty,
      reorderLevel: data.reorderLevel,
    });
    await new Promise(r => setTimeout(r, 500));
  }
}
