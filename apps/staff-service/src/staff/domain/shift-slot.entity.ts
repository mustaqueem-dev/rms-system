// apps/staff-service/src/staff/domain/shift-slot.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';

export interface ShiftSlotProps {
  branchId:    string;
  franchiseId: string;
  staffId:     string;   // userId of the staff member
  staffName:   string;
  role:        string;   // e.g. "WAITER", "CHEF", "CASHIER"
  date:        string;   // ISO date "YYYY-MM-DD"
  startTime:   string;   // "HH:mm" 24-h
  endTime:     string;   // "HH:mm" 24-h
  notes?:      string;
  createdAt:   Date;
  updatedAt:   Date;
  createdBy:   string;
  updatedBy:   string;
}

// ─── Domain events ─────────────────────────────────────────────────────────────

export class ShiftScheduledEvent extends DomainEvent {
  readonly eventName   = 'shift.scheduled.v1';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly staffId: string, readonly date: string) {
    super(); this.aggregateId = id;
  }
}

export class ShiftStartedEvent extends DomainEvent {
  readonly eventName   = 'shift.started.v1';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly staffId: string) {
    super(); this.aggregateId = id;
  }
}

export class ShiftEndedEvent extends DomainEvent {
  readonly eventName   = 'shift.ended.v1';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly staffId: string, readonly totalMinutes: number) {
    super(); this.aggregateId = id;
  }
}

// ─── ShiftSlot aggregate root ──────────────────────────────────────────────────

export class ShiftSlot extends BaseEntity<ShiftSlotProps> {
  private constructor(props: ShiftSlotProps, id?: string) { super(props, id); }

  static create(
    props: Omit<ShiftSlotProps, 'createdAt' | 'updatedAt' | 'updatedBy'>,
    id?:   string,
  ): Result<ShiftSlot, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,  argumentName: 'branchId' },
      { argument: props.staffId,   argumentName: 'staffId' },
      { argument: props.date,      argumentName: 'date' },
      { argument: props.startTime, argumentName: 'startTime' },
      { argument: props.endTime,   argumentName: 'endTime' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);

    const now  = new Date();
    const slot = new ShiftSlot({ ...props, createdAt: now, updatedAt: now, updatedBy: props.createdBy }, id);
    if (!id) slot.addDomainEvent(new ShiftScheduledEvent(slot.id, props.branchId, props.staffId, props.date));
    return Result.ok(slot);
  }

  static reconstitute(props: ShiftSlotProps, id: string): ShiftSlot {
    return new ShiftSlot(props, id);
  }

  get branchId():    string          { return this.props.branchId; }
  get franchiseId(): string          { return this.props.franchiseId; }
  get staffId():     string          { return this.props.staffId; }
  get staffName():   string          { return this.props.staffName; }
  get role():        string          { return this.props.role; }
  get date():        string          { return this.props.date; }
  get startTime():   string          { return this.props.startTime; }
  get endTime():     string          { return this.props.endTime; }
  get notes():       string | undefined { return this.props.notes; }
  get createdAt():   Date            { return this.props.createdAt; }
  get updatedAt():   Date            { return this.props.updatedAt; }
  get createdBy():   string          { return this.props.createdBy; }
}
