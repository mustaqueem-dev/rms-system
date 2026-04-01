// packages/event-contracts/src/staff.events.ts

export const STAFF_EVENTS = {
  SHIFT_SCHEDULED: 'staff.shift_scheduled.v1',
  SHIFT_STARTED:   'staff.shift_started.v1',
  SHIFT_ENDED:     'staff.shift_ended.v1',
  CLOCKED_IN:      'staff.clocked_in.v1',
  CLOCKED_OUT:     'staff.clocked_out.v1',
} as const;

export type ShiftStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED';

// ─── Shift Events ─────────────────────────────────────────────────────────────

export interface ShiftScheduledPayload {
  shiftId:     string;
  branchId:    string;
  franchiseId: string;
  staffId:     string;
  role:        string;
  date:        string; // ISO 8601 date only (YYYY-MM-DD)
  startTime:   string; // HH:mm
  endTime:     string; // HH:mm
  scheduledBy: string;
  occurredAt:  string;
}

export interface ShiftStartedPayload {
  shiftId:     string;
  branchId:    string;
  franchiseId: string;
  staffId:     string;
  actualStartTime: string; // ISO 8601
  occurredAt:  string;
}

export interface ShiftEndedPayload {
  shiftId:        string;
  branchId:       string;
  franchiseId:    string;
  staffId:        string;
  actualEndTime:  string; // ISO 8601
  durationMinutes: number;
  occurredAt:     string;
}

// ─── Time Entry Events ────────────────────────────────────────────────────────

export interface ClockedInPayload {
  timeEntryId: string;
  branchId:    string;
  franchiseId: string;
  staffId:     string;
  clockIn:     string; // ISO 8601
  occurredAt:  string;
}

export interface ClockedOutPayload {
  timeEntryId:    string;
  branchId:       string;
  franchiseId:    string;
  staffId:        string;
  clockIn:        string;
  clockOut:       string; // ISO 8601
  totalMinutes:   number;
  occurredAt:     string;
}
