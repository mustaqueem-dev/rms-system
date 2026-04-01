// apps/inventory-service/src/inventory/domain/repositories/stock-adjustment.repository.interface.ts

import { StockAdjustment } from '../stock-adjustment.entity';

export const STOCK_ADJUSTMENT_REPOSITORY = Symbol('IStockAdjustmentRepository');

export interface IStockAdjustmentRepository {
  save(adjustment: StockAdjustment): Promise<void>;
  findByItemId(
    inventoryItemId: string,
    branchId: string,
    options: { limit: number; offset: number },
  ): Promise<StockAdjustment[]>;
}
