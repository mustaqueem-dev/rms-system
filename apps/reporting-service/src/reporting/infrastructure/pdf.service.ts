// apps/reporting-service/src/reporting/infrastructure/pdf.service.ts
//
// Generates PDF reports using pdfkit.
// Falls back to a plain text buffer if pdfkit isn't available (test mode).
// Output: Buffer (in-memory) returned to caller.

import { Injectable, Logger } from '@nestjs/common';
import { DailySalesSummary, InventoryStatusSummary } from './analytics.service';

// pdfkit is an optional runtime dep — we lazy-require it so typecheck
// doesn't fail when @types/pdfkit are absent.
type PDFDoc = {
  on(event: string, cb: (chunk?: Buffer) => void): void;
  end(): void;
  text(str: string, opts?: Record<string, unknown>): void;
  moveDown(): void;
};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  // ── Daily Sales PDF ────────────────────────────────────────────────────────

  async generateDailySalesPdf(data: DailySalesSummary): Promise<Buffer> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFDocument = require('pdfkit') as new (opts: object) => PDFDoc;
      return this.buildDailySalesPdf(PDFDocument, data);
    } catch {
      this.logger.warn('pdfkit not available — returning plain text buffer');
      return Buffer.from(this.dailySalesText(data), 'utf-8');
    }
  }

  // ── Inventory Status PDF ───────────────────────────────────────────────────

  async generateInventoryStatusPdf(data: InventoryStatusSummary): Promise<Buffer> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFDocument = require('pdfkit') as new (opts: object) => PDFDoc;
      return this.buildInventoryPdf(PDFDocument, data);
    } catch {
      this.logger.warn('pdfkit not available — returning plain text buffer');
      return Buffer.from(this.inventoryText(data), 'utf-8');
    }
  }

  // ── Private builders ───────────────────────────────────────────────────────

  private buildDailySalesPdf(
    PDFDocument: new (opts: object) => PDFDoc,
    data: DailySalesSummary,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data',  (c) => { if (c) chunks.push(c); });
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', (e: unknown) => reject(e as Error));

      doc.text('DAILY SALES REPORT', { align: 'center' });
      doc.text(`Date: ${data.date}  |  Branch: ${data.branchId}`, { align: 'center' });
      doc.moveDown();
      doc.text(`Total Orders   : ${data.totalOrders}`);
      doc.text(`Total Revenue  : ₹${data.totalRevenue.toFixed(2)}`);
      doc.text(`Average Order  : ₹${data.averageOrder.toFixed(2)}`);
      doc.text(`Cancelled      : ${data.cancelledOrders}`);
      doc.moveDown();
      doc.text('Top Items:');
      data.topItems.forEach((item, i) => {
        doc.text(`  ${i + 1}. ${item.name} — ${item.qty} pcs — ₹${item.revenue.toFixed(2)}`);
      });
      doc.moveDown();
      doc.text('Revenue by Hour:');
      data.byHour.forEach((h) => {
        doc.text(`  ${String(h.hour).padStart(2, '0')}:00 — ${h.orders} orders — ₹${h.revenue.toFixed(2)}`);
      });
      doc.end();
    });
  }

  private buildInventoryPdf(
    PDFDocument: new (opts: object) => PDFDoc,
    data: InventoryStatusSummary,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data',  (c) => { if (c) chunks.push(c); });
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', (e: unknown) => reject(e as Error));

      doc.text('INVENTORY STATUS REPORT', { align: 'center' });
      doc.text(`Branch: ${data.branchId}  |  Generated: ${new Date(data.generatedAt).toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.text(`Total Items     : ${data.totalItems}`);
      doc.text(`Out of Stock    : ${data.outOfStockCount}`);
      doc.text(`Low Stock Items : ${data.lowStockItems.length}`);
      doc.moveDown();
      if (data.lowStockItems.length) {
        doc.text('Low Stock Details:');
        data.lowStockItems.forEach((item) => {
          doc.text(`  • ${item.name}: ${item.currentQty} ${item.unit} (reorder at ${item.reorderLevel})`);
        });
      }
      doc.end();
    });
  }

  private dailySalesText(data: DailySalesSummary): string {
    return [
      `DAILY SALES REPORT — ${data.date} — Branch: ${data.branchId}`,
      `Total Orders: ${data.totalOrders} | Revenue: ₹${data.totalRevenue.toFixed(2)} | Cancelled: ${data.cancelledOrders}`,
      '',
      'Top Items:',
      ...data.topItems.map((i, n) => `  ${n + 1}. ${i.name} — ${i.qty} pcs — ₹${i.revenue.toFixed(2)}`),
    ].join('\n');
  }

  private inventoryText(data: InventoryStatusSummary): string {
    return [
      `INVENTORY STATUS — Branch: ${data.branchId}`,
      `Total: ${data.totalItems} | Out of Stock: ${data.outOfStockCount} | Low: ${data.lowStockItems.length}`,
      '',
      ...data.lowStockItems.map((i) => `  • ${i.name}: ${i.currentQty} ${i.unit} (min ${i.reorderLevel})`),
    ].join('\n');
  }
}
