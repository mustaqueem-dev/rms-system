// apps/inventory-service/src/inventory/domain/repositories/inventory-item.repository.interface.ts

import { InventoryItem } from '../inventory-item.entity';
import { PaginatedResult, PaginationOptions } from '@rms/shared-kernel';

export const INVENTORY_ITEM_REPOSITORY = Symbol('IInventoryItemRepository');

export interface InventoryItemFilter {
  branchId:    string;
  franchiseId: string;
  sku?:        string;
  isLowStock?: boolean;
}

export interface IInventoryItemRepository {
  findById(id: string, branchId: string): Promise<InventoryItem | null>;
  findBySku(sku: string, branchId: string): Promise<InventoryItem | null>;
  findAll(filter: InventoryItemFilter, pagination: PaginationOptions): Promise<PaginatedResult<InventoryItem>>;
  save(item: InventoryItem): Promise<void>;
  update(item: InventoryItem): Promise<void>;
}
