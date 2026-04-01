// apps/reporting-service/src/reporting/presentation/report.controller.ts

import {
  Controller, Get, Post, Param, Query,
  Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Response }       from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Auth, UserRole, CurrentTenant, TenantContext, ok, ApiResponse as ApiEnvelope } from '@rms/shared-kernel';
import { AnalyticsService } from '../infrastructure/analytics.service';
import { PdfService }       from '../infrastructure/pdf.service';
import { ReportCronService } from '../application/cron/report-cron.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
@Controller('reports')
export class ReportController {
  constructor(
    private readonly analytics:  AnalyticsService,
    private readonly pdf:        PdfService,
    private readonly cronSvc:    ReportCronService,
  ) {}

  // ── Daily sales JSON ──────────────────────────────────────────────────────

  @Get('daily-sales')
  @ApiOperation({ summary: 'Get daily sales summary for a branch (JSON)' })
  async dailySalesJson(
    @Query('date') date: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const d = date ?? new Date().toISOString().slice(0, 10);
    const data = await this.analytics.getDailySales(tenant.branchId, d);
    return ok(data);
  }

  // ── Daily sales PDF (download) ────────────────────────────────────────────

  @Get('daily-sales/pdf')
  @ApiOperation({ summary: 'Download daily sales PDF for a branch' })
  async dailySalesPdf(
    @Query('date') date: string,
    @CurrentTenant() tenant: TenantContext,
    @Res() res: Response,
  ): Promise<void> {
    const d      = date ?? new Date().toISOString().slice(0, 10);
    const data   = await this.analytics.getDailySales(tenant.branchId, d);
    const buffer = await this.pdf.generateDailySalesPdf(data);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="daily-sales_${tenant.branchId}_${d}.pdf"`,
      'Content-Length':       buffer.length.toString(),
    }).send(buffer);
  }

  // ── Inventory status JSON ─────────────────────────────────────────────────

  @Get('inventory-status')
  @ApiOperation({ summary: 'Get inventory status (low stock items) for a branch (JSON)' })
  async inventoryStatusJson(
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const data = await this.analytics.getInventoryStatus(tenant.branchId);
    return ok(data);
  }

  // ── Inventory status PDF ──────────────────────────────────────────────────

  @Get('inventory-status/pdf')
  @ApiOperation({ summary: 'Download inventory status PDF for a branch' })
  async inventoryStatusPdf(
    @CurrentTenant() tenant: TenantContext,
    @Res() res: Response,
  ): Promise<void> {
    const data   = await this.analytics.getInventoryStatus(tenant.branchId);
    const buffer = await this.pdf.generateInventoryStatusPdf(data);
    const today  = new Date().toISOString().slice(0, 10);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="inventory-status_${tenant.branchId}_${today}.pdf"`,
      'Content-Length':       buffer.length.toString(),
    }).send(buffer);
  }

  // ── Monthly revenue roll-up ───────────────────────────────────────────────

  @Get('monthly-revenue')
  @ApiOperation({ summary: 'Monthly revenue roll-up (daily bars for chart)' })
  async monthlyRevenue(
    @Query('year')  yearStr:  string,
    @Query('month') monthStr: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const year  = parseInt(yearStr,  10) || new Date().getFullYear();
    const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
    const data  = await this.analytics.getMonthlyRevenue(tenant.branchId, year, month);
    return ok(data);
  }

  // ── Manual trigger (queue a job immediately) ──────────────────────────────

  @Post('trigger/daily-sales')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Manually trigger daily-sales report job' })
  async triggerDailySales(
    @Query('date') date: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const d     = date ?? new Date().toISOString().slice(0, 10);
    const jobId = await this.cronSvc.triggerDailySales(tenant.branchId, d);
    return ok({ jobId, queued: true });
  }

  @Post('trigger/inventory-status')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Manually trigger inventory-status report job' })
  async triggerInventoryStatus(
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const jobId = await this.cronSvc.triggerInventoryStatus(tenant.branchId);
    return ok({ jobId, queued: true });
  }
}
