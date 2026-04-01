// apps/reporting-service/src/reporting/infrastructure/analytics.service.ts
//
// Runs MongoDB aggregation pipelines against the rms_orders and rms_inventory
// databases to produce structured data for PDF and API report endpoints.
//
// NOTE: The reporting service reads from the other services' databases
// directly (read-only replica or same DB with read-preference=secondary).
// Connection strings are configured via reporting.config.ts.

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection }   from '@nestjs/mongoose';
import { Connection }         from 'mongoose';

export interface DailySalesSummary {
  date:            string;
  branchId:        string;
  totalOrders:     number;
  totalRevenue:    number;
  averageOrder:    number;
  cancelledOrders: number;
  topItems:        Array<{ name: string; qty: number; revenue: number }>;
  byHour:          Array<{ hour: number; orders: number; revenue: number }>;
}

export interface InventoryStatusSummary {
  branchId:         string;
  generatedAt:      string;
  totalItems:       number;
  lowStockItems:    Array<{ id: string; name: string; currentQty: number; reorderLevel: number; unit: string }>;
  outOfStockCount:  number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectConnection('reporting') private readonly conn: Connection,
  ) {}

  // ── Daily Sales ────────────────────────────────────────────────────────────

  async getDailySales(branchId: string, date: string): Promise<DailySalesSummary> {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay   = new Date(`${date}T23:59:59.999Z`);

    const ordersCol = this.conn.collection('orders');

    // Overall summary
    const [summary] = await ordersCol.aggregate([
      { $match: { branchId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id:             null,
          totalOrders:     { $sum: 1 },
          totalRevenue:    { $sum: { $cond: [{ $ne: ['$status', 'CANCELLED'] }, '$totalAmount', 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
        },
      },
    ]).toArray() as Array<Record<string, unknown>>;

    // Top 10 menu items by quantity
    const topItems = await ordersCol.aggregate([
      { $match: { branchId, createdAt: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: 'CANCELLED' } } },
      { $unwind: '$lines' },
      {
        $group: {
          _id:     '$lines.menuItemId',
          name:    { $first: '$lines.name' },
          qty:     { $sum: '$lines.quantity' },
          revenue: { $sum: { $multiply: ['$lines.unitPrice', '$lines.quantity'] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: 1, qty: 1, revenue: 1 } },
    ]).toArray() as Array<{ name: string; qty: number; revenue: number }>;

    // Revenue by hour
    const byHour = await ordersCol.aggregate([
      { $match: { branchId, createdAt: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: 'CANCELLED' } } },
      {
        $group: {
          _id:     { $hour: '$createdAt' },
          orders:  { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: '$_id', orders: 1, revenue: 1 } },
    ]).toArray() as Array<{ hour: number; orders: number; revenue: number }>;

    const totalOrders  = (summary?.['totalOrders']  as number) ?? 0;
    const totalRevenue = (summary?.['totalRevenue']  as number) ?? 0;

    return {
      date,
      branchId,
      totalOrders,
      totalRevenue,
      averageOrder:    totalOrders > 0 ? totalRevenue / totalOrders : 0,
      cancelledOrders: (summary?.['cancelledOrders'] as number) ?? 0,
      topItems,
      byHour,
    };
  }

  // ── Inventory status ───────────────────────────────────────────────────────

  async getInventoryStatus(branchId: string): Promise<InventoryStatusSummary> {
    const col = this.conn.collection('inventory_items');

    const [counts] = await col.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id:            null,
          totalItems:     { $sum: 1 },
          outOfStockCount: { $sum: { $cond: [{ $lte: ['$stock.quantity', 0] }, 1, 0] } },
        },
      },
    ]).toArray() as Array<Record<string, unknown>>;

    const lowStockItems = await col.aggregate([
      {
        $match: {
          branchId,
          $expr: { $lte: ['$stock.quantity', '$reorderRule.reorderLevel'] },
        },
      },
      { $project: { _id: 1, name: 1, currentQty: '$stock.quantity', unit: '$stock.unit', reorderLevel: '$reorderRule.reorderLevel' } },
      { $sort: { currentQty: 1 } },
    ]).toArray() as Array<{ _id: string; name: string; currentQty: number; unit: string; reorderLevel: number }>;

    return {
      branchId,
      generatedAt:     new Date().toISOString(),
      totalItems:      (counts?.['totalItems']      as number) ?? 0,
      outOfStockCount: (counts?.['outOfStockCount'] as number) ?? 0,
      lowStockItems:   lowStockItems.map((i) => ({
        id:           i._id,
        name:         i.name,
        currentQty:   i.currentQty,
        reorderLevel: i.reorderLevel,
        unit:         i.unit,
      })),
    };
  }

  // ── Monthly revenue roll-up ────────────────────────────────────────────────

  async getMonthlyRevenue(
    branchId: string,
    year:     number,
    month:    number,
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month,     1);

    const col = this.conn.collection('orders');
    return col.aggregate([
      { $match: { branchId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
    ]).toArray() as Promise<Array<{ date: string; revenue: number; orders: number }>>;
  }
}
