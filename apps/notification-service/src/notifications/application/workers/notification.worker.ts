// apps/notification-service/src/notifications/application/workers/notification.worker.ts
//
// BullMQ worker that processes all notification jobs dispatched from
// KafkaConsumerService. Uses real channel implementations (WhatsApp, Email)
// with dev-mode console fallbacks when credentials are absent.

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job }                   from 'bullmq';
import { ConsoleLogger }         from '@rms/shared-kernel';
import { WhatsAppChannel }       from '../../infrastructure/channels/whatsapp.channel';
import { EmailChannel }          from '../../infrastructure/channels/email.channel';

// ── Job payload types ─────────────────────────────────────────────────────────

interface OrderConfirmationPayload {
  orderId:     string;
  branchId:    string;
  totalAmount: number;
  /** Optional: resolved by a lookup in real impl */
  customerPhone?: string;
  customerEmail?: string;
}

interface LowStockAlertPayload {
  itemId:        string;
  itemName?:     string;
  branchId:      string;
  currentQty:    number;
  reorderLevel:  number;
  managerPhone?: string;
  managerEmail?: string;
}

interface OrderCancelledPayload {
  orderId:     string;
  branchId:    string;
  reason:      string;
  customerPhone?: string;
  customerEmail?: string;
}

interface ReservationCreatedPayload {
  reservationId: string;
  branchId:      string;
  guestName:     string;
  guestPhone:    string;
  tableNumber:   number;
  scheduledAt:   string;
}

// ── Worker ────────────────────────────────────────────────────────────────────

@Processor('notifications-queue')
export class NotificationWorker extends WorkerHost {
  private readonly logger = new ConsoleLogger({ service: 'NotificationWorker' });

  constructor(
    private readonly whatsapp: WhatsAppChannel,
    private readonly email:    EmailChannel,
  ) { super(); }

  async process(job: Job<unknown, unknown, string>): Promise<void> {
    this.logger.info(`Processing notification job`, { jobId: job.id, name: job.name });

    switch (job.name) {
      case 'send-order-confirmation':
        await this.handleOrderConfirmation(job.data as OrderConfirmationPayload);
        break;
      case 'send-low-stock-alert':
        await this.handleLowStockAlert(job.data as LowStockAlertPayload);
        break;
      case 'send-order-cancelled':
        await this.handleOrderCancelled(job.data as OrderCancelledPayload);
        break;
      case 'send-reservation-confirmation':
        await this.handleReservationCreated(job.data as ReservationCreatedPayload);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  private async handleOrderConfirmation(data: OrderConfirmationPayload): Promise<void> {
    const msg = `✅ Your order has been placed! Order #${data.orderId.slice(-6).toUpperCase()} | Total: ₹${data.totalAmount.toFixed(2)}. Thank you!`;

    if (data.customerPhone) {
      await this.whatsapp.sendText({ to: data.customerPhone, body: msg });
    }
    if (data.customerEmail) {
      await this.email.send({
        to:      data.customerEmail,
        subject: 'Your order has been placed',
        html:    `<p>${msg}</p>`,
        text:    msg,
      });
    }
    if (!data.customerPhone && !data.customerEmail) {
      this.logger.info(`[MOCK] Order confirmation for ${data.orderId} (no contact info)`);
    }
  }

  private async handleLowStockAlert(data: LowStockAlertPayload): Promise<void> {
    const item = data.itemName ?? data.itemId;
    const msg  = `⚠️ LOW STOCK ALERT: ${item} is at ${data.currentQty} units (reorder level: ${data.reorderLevel}). Please restock immediately.`;

    if (data.managerPhone) {
      await this.whatsapp.sendText({ to: data.managerPhone, body: msg });
    }
    if (data.managerEmail) {
      await this.email.send({
        to:      data.managerEmail,
        subject: `Low Stock Alert: ${item}`,
        html:    `<p>${msg}</p>`,
        text:    msg,
      });
    }
    if (!data.managerPhone && !data.managerEmail) {
      this.logger.info(`[MOCK] Low stock alert for item ${item} in branch ${data.branchId}`);
    }
  }

  private async handleOrderCancelled(data: OrderCancelledPayload): Promise<void> {
    const msg = `❌ Your order #${data.orderId.slice(-6).toUpperCase()} has been cancelled. Reason: ${data.reason}. We apologise for the inconvenience.`;

    if (data.customerPhone) {
      await this.whatsapp.sendText({ to: data.customerPhone, body: msg });
    }
    if (data.customerEmail) {
      await this.email.send({
        to:      data.customerEmail,
        subject: 'Your order has been cancelled',
        html:    `<p>${msg}</p>`,
        text:    msg,
      });
    }
    if (!data.customerPhone && !data.customerEmail) {
      this.logger.info(`[MOCK] Order cancelled notification for ${data.orderId}`);
    }
  }

  private async handleReservationCreated(data: ReservationCreatedPayload): Promise<void> {
    const date = new Date(data.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const msg  = `🍽️ Hi ${data.guestName}! Your reservation is confirmed. Table #${data.tableNumber} on ${date}. We look forward to serving you!`;

    await this.whatsapp.sendText({ to: data.guestPhone, body: msg });
  }
}
