// packages/event-contracts/src/kds.events.ts
// KDS = Kitchen Display System

export const KDS_EVENTS = {
  ORDER_ASSIGNED: 'kds.order_assigned.v1',
  ORDER_READY:    'kds.order_ready.v1',
  ORDER_BUMPED:   'kds.order_bumped.v1',
  ITEM_STARTED:   'kds.item_started.v1',
  ITEM_COMPLETED: 'kds.item_completed.v1',
} as const;

export type KdsStation =
  | 'GRILL'
  | 'FRYER'
  | 'SALADS'
  | 'DESSERTS'
  | 'DRINKS'
  | 'PACKAGING'
  | 'GENERAL';

// ─── KDS Events ──────────────────────────────────────────────────────────────

export interface KdsOrderAssignedPayload {
  orderId:     string;
  branchId:    string;
  franchiseId: string;
  station:     KdsStation;
  assignedBy:  string;
  assignedAt:  string; // ISO 8601
  items: {
    menuItemId: string;
    name:        string;
    quantity:    number;
    notes?:      string;
  }[];
  occurredAt:  string;
}

export interface KdsOrderReadyPayload {
  orderId:     string;
  branchId:    string;
  franchiseId: string;
  station:     KdsStation;
  readyAt:     string; // ISO 8601
  /** Total cook time in seconds from ASSIGNED → READY */
  cookTimeSeconds: number;
  occurredAt:  string;
}

export interface KdsOrderBumpedPayload {
  orderId:     string;
  branchId:    string;
  franchiseId: string;
  station:     KdsStation;
  bumpedBy:    string;
  bumpedAt:    string; // ISO 8601
  occurredAt:  string;
}

export interface KdsItemStartedPayload {
  orderId:    string;
  branchId:   string;
  menuItemId: string;
  name:       string;
  quantity:   number;
  station:    KdsStation;
  startedAt:  string; // ISO 8601
  occurredAt: string;
}

export interface KdsItemCompletedPayload {
  orderId:    string;
  branchId:   string;
  menuItemId: string;
  name:       string;
  quantity:   number;
  station:    KdsStation;
  completedAt: string; // ISO 8601
  cookTimeSeconds: number;
  occurredAt:  string;
}
