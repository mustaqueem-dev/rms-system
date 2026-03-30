// packages/event-contracts/src/inventory.events.ts

export const INVENTORY_EVENTS = {
  STOCK_UPDATED:   'inventory.stock.updated.v1',
  LOW_STOCK_ALERT: 'inventory.stock.low.v1',
  STOCK_DEPLETED:  'inventory.stock.depleted.v1',
  REORDER_TRIGGERED: 'inventory.reorder.triggered.v1',
} as const;

export interface StockUpdatedPayload {
  itemId:          string;
  branchId:        string;
  previousQuantity: number;
  newQuantity:     number;
  unit:            string;
  updatedBy:       string;
  occurredAt:      string;
}

export interface LowStockAlertPayload {
  itemId:         string;
  branchId:       string;
  currentQuantity: number;
  reorderLevel:   number;
  unit:           string;
  occurredAt:     string;
}