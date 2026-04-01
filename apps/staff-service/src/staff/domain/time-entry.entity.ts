// apps/staff-service/src/staff/domain/time-entry.entity.ts
//
// Immutable record of a single clock-in/clock-out pair.

import { BaseEntity, Result, Guard } from '@rms/shared-kernel';

export interface TimeEntryProps {
  branchId:      string;
  franchiseId:   string;
  staffId:       string;
  shiftSlotId?:  string;          // linked shift slot (optional for ad-hoc entries)
  clockInAt:     Date;
  clockOutAt?:   Date;            // null until clocked out
  totalMinutes?: number;          // computed on clock-out
  notes?:        string;
  createdAt:     Date;
}

export class TimeEntry extends BaseEntity<TimeEntryProps> {
  private constructor(props: TimeEntryProps, id?: string) { super(props, id); }

  static clockIn(
    props: Pick<TimeEntryProps, 'branchId' | 'franchiseId' | 'staffId' | 'shiftSlotId' | 'notes'>,
    id?:   string,
  ): Result<TimeEntry, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,  argumentName: 'branchId' },
      { argument: props.staffId,   argumentName: 'staffId' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);

    const now = new Date();
    return Result.ok(new TimeEntry({ ...props, clockInAt: now, createdAt: now }, id));
  }

  static reconstitute(props: TimeEntryProps, id: string): TimeEntry {
    return new TimeEntry(props, id);
  }

  get branchId():      string          { return this.props.branchId; }
  get franchiseId():   string          { return this.props.franchiseId; }
  get staffId():       string          { return this.props.staffId; }
  get shiftSlotId():   string | undefined { return this.props.shiftSlotId; }
  get clockInAt():     Date            { return this.props.clockInAt; }
  get clockOutAt():    Date | undefined { return this.props.clockOutAt; }
  get totalMinutes():  number | undefined { return this.props.totalMinutes; }
  get notes():         string | undefined { return this.props.notes; }
  get createdAt():     Date             { return this.props.createdAt; }
  get isActive():      boolean          { return !this.props.clockOutAt; }

  clockOut(notes?: string): Result<void, string> {
    if (this.props.clockOutAt) return Result.fail('Already clocked out');
    const now            = new Date();
    this.props.clockOutAt   = now;
    this.props.totalMinutes = Math.round((now.getTime() - this.props.clockInAt.getTime()) / 60_000);
    if (notes) this.props.notes = notes;
    return Result.ok();
  }
}
