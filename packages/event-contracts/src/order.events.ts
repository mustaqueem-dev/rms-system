// packages/event-contracts/src/order.events.ts

export const ORDER_EVENTS = {
  PLACED:          'order.placed.v1',
  STATUS_CHANGED:  'order.status.changed.v1',
  CANCELLED:       'order.cancelled.v1',
  LINE_ADDED:      'order.line.added.v1',
  LINE_REMOVED:    'order.line.removed.v1',
} as const;

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface OrderPlacedPayload {
  orderId:       string;
  branchId:      string;
  franchiseId:   string;
  tableNumber?:  number;
  customerId?:   string;
  lines: {
    menuItemId:  string;
    quantity:    number;
    unitPrice:   number;
    currency:    string;
    notes?:      string;
  }[];
  totalAmount:   number;
  currency:      string;
  placedBy:      string;   // staffId
  occurredAt:    string;   // ISO 8601
}

export interface OrderStatusChangedPayload {
  orderId:      string;
  branchId:     string;
  franchiseId:  string;
  previousStatus: OrderStatus;
  newStatus:    OrderStatus;
  changedBy:    string;
  reason?:      string;
  occurredAt:   string;
}

export interface OrderCancelledPayload {
  orderId:      string;
  branchId:     string;
  franchiseId:  string;
  reason:       string;
  cancelledBy:  string;
  refundable:   boolean;
  occurredAt:   string;
}
