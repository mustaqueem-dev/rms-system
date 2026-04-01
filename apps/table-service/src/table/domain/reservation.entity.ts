// apps/table-service/src/table/domain/reservation.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface ReservationProps {
  branchId:     string;
  franchiseId:  string;
  tableId:      string;
  tableNumber:  number;
  guestName:    string;
  guestPhone:   string;
  partySize:    number;
  scheduledAt:  Date;        // the booked time slot
  status:       ReservationStatus;
  notes?:       string;
  createdAt:    Date;
  updatedAt:    Date;
  createdBy:    string;
  updatedBy:    string;
}

// ─── Domain events ─────────────────────────────────────────────────────────────

export class ReservationCreatedEvent extends DomainEvent {
  readonly eventName   = 'reservation.created.v1';
  readonly aggregateId: string;
  constructor(
    id: string,
    readonly branchId:   string,
    readonly franchiseId: string,
    readonly tableId:    string,
    readonly scheduledAt: Date,
  ) { super(); this.aggregateId = id; }
}

export class ReservationUpdatedEvent extends DomainEvent {
  readonly eventName   = 'reservation.updated.v1';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string) {
    super(); this.aggregateId = id;
  }
}

export class ReservationCancelledEvent extends DomainEvent {
  readonly eventName   = 'reservation.cancelled.v1';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly reason: string) {
    super(); this.aggregateId = id;
  }
}

// ─── Reservation aggregate root ────────────────────────────────────────────────

export class Reservation extends BaseEntity<ReservationProps> {
  private constructor(props: ReservationProps, id?: string) { super(props, id); }

  static create(
    props: Omit<ReservationProps, 'status' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
    id?:   string,
  ): Result<Reservation, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.tableId,     argumentName: 'tableId' },
      { argument: props.guestName,   argumentName: 'guestName' },
      { argument: props.guestPhone,  argumentName: 'guestPhone' },
      { argument: props.scheduledAt, argumentName: 'scheduledAt' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);
    if (props.partySize < 1) return Result.fail('partySize must be ≥ 1');

    const now = new Date();
    const res = new Reservation({
      ...props,
      status: 'PENDING',
      createdAt: now, updatedAt: now, updatedBy: props.createdBy,
    }, id);

    if (!id) {
      res.addDomainEvent(new ReservationCreatedEvent(
        res.id, props.branchId, props.franchiseId, props.tableId, props.scheduledAt,
      ));
    }
    return Result.ok(res);
  }

  static reconstitute(props: ReservationProps, id: string): Reservation {
    return new Reservation(props, id);
  }

  get branchId():    string            { return this.props.branchId; }
  get franchiseId(): string            { return this.props.franchiseId; }
  get tableId():     string            { return this.props.tableId; }
  get tableNumber(): number            { return this.props.tableNumber; }
  get guestName():   string            { return this.props.guestName; }
  get guestPhone():  string            { return this.props.guestPhone; }
  get partySize():   number            { return this.props.partySize; }
  get scheduledAt(): Date              { return this.props.scheduledAt; }
  get status():      ReservationStatus { return this.props.status; }
  get notes():       string | undefined{ return this.props.notes; }
  get createdAt():   Date              { return this.props.createdAt; }
  get updatedAt():   Date              { return this.props.updatedAt; }

  update(
    changes: Partial<Pick<ReservationProps, 'scheduledAt' | 'partySize' | 'notes' | 'status'>>,
    updatedBy: string,
  ): Result<void, string> {
    if (this.props.status === 'CANCELLED' || this.props.status === 'COMPLETED') {
      return Result.fail(`Cannot update a ${this.props.status} reservation`);
    }
    if (changes.scheduledAt !== undefined) this.props.scheduledAt = changes.scheduledAt;
    if (changes.partySize   !== undefined) this.props.partySize   = changes.partySize;
    if (changes.notes       !== undefined) this.props.notes       = changes.notes;
    if (changes.status      !== undefined) this.props.status      = changes.status;
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ReservationUpdatedEvent(this.id, this.branchId));
    return Result.ok();
  }

  cancel(reason: string, updatedBy: string): Result<void, string> {
    if (['COMPLETED', 'CANCELLED'].includes(this.props.status)) {
      return Result.fail(`Cannot cancel a ${this.props.status} reservation`);
    }
    this.props.status    = 'CANCELLED';
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ReservationCancelledEvent(this.id, this.branchId, reason));
    return Result.ok();
  }
}
