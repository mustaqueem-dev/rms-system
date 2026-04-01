// packages/event-contracts/src/table.events.ts

export const TABLE_EVENTS = {
  STATUS_CHANGED:    'table.status_changed.v1',
  LAYOUT_SAVED:      'table.layout_saved.v1',
  RESERVATION_CREATED: 'reservation.created.v1',
  RESERVATION_UPDATED: 'reservation.updated.v1',
  RESERVATION_CANCELLED: 'reservation.cancelled.v1',
} as const;

export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED';

// ─── Table Events ─────────────────────────────────────────────────────────────

export interface TableStatusChangedPayload {
  tableId:     string;
  branchId:    string;
  franchiseId: string;
  name:        string;
  previousStatus: TableStatus;
  newStatus:   TableStatus;
  /** Associated orderId when status → OCCUPIED */
  orderId?:    string;
  changedBy:   string;
  occurredAt:  string; // ISO 8601
}

export interface TableLayoutSavedPayload {
  branchId:    string;
  franchiseId: string;
  savedBy:     string;
  tableCount:  number;
  occurredAt:  string;
}

// ─── Reservation Events ───────────────────────────────────────────────────────

export interface ReservationCreatedPayload {
  reservationId: string;
  branchId:      string;
  franchiseId:   string;
  tableId:       string;
  guestName:     string;
  /** Masked for logging — full value available in DB */
  guestPhone:    string;
  partySize:     number;
  scheduledAt:   string; // ISO 8601
  notes?:        string;
  smsConfirm:    boolean;
  createdBy:     string;
  occurredAt:    string;
}

export interface ReservationUpdatedPayload {
  reservationId: string;
  branchId:      string;
  franchiseId:   string;
  previousStatus: ReservationStatus;
  newStatus:     ReservationStatus;
  updatedBy:     string;
  occurredAt:    string;
}

export interface ReservationCancelledPayload {
  reservationId: string;
  branchId:      string;
  franchiseId:   string;
  reason?:       string;
  cancelledBy:   string;
  occurredAt:    string;
}
