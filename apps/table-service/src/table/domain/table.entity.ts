// apps/table-service/src/table/domain/table.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';

// Valid status transitions
const TABLE_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  AVAILABLE:       ['OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'],
  OCCUPIED:        ['AVAILABLE'],
  RESERVED:        ['OCCUPIED', 'AVAILABLE'],
  OUT_OF_SERVICE:  ['AVAILABLE'],
};

export interface TablePosition { x: number; y: number; }

export interface TableProps {
  branchId:    string;
  franchiseId: string;
  tableNumber: number;
  capacity:    number;
  status:      TableStatus;
  position?:   TablePosition;  // drag-and-drop floor-plan coordinates
  section?:    string;         // e.g. "Indoor", "Terrace"
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
  createdBy:   string;
  updatedBy:   string;
}

// ─── Domain events ────────────────────────────────────────────────────────────

export class TableStatusChangedEvent extends DomainEvent {
  readonly eventName   = 'table.status_changed.v1';
  readonly aggregateId: string;
  constructor(
    id: string,
    readonly branchId:      string,
    readonly franchiseId:   string,
    readonly tableNumber:   number,
    readonly previousStatus: TableStatus,
    readonly newStatus:      TableStatus,
  ) { super(); this.aggregateId = id; }
}

export class TableLayoutSavedEvent extends DomainEvent {
  readonly eventName   = 'table.layout_saved.v1';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string) {
    super(); this.aggregateId = id;
  }
}

// ─── Table aggregate root ─────────────────────────────────────────────────────

export class Table extends BaseEntity<TableProps> {
  private constructor(props: TableProps, id?: string) { super(props, id); }

  static create(
    props: Omit<TableProps, 'status' | 'isActive' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
    id?:   string,
  ): Result<Table, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.tableNumber, argumentName: 'tableNumber' },
      { argument: props.capacity,    argumentName: 'capacity' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);
    if (props.capacity < 1) return Result.fail('capacity must be ≥ 1');
    if (props.tableNumber < 1) return Result.fail('tableNumber must be ≥ 1');

    const now = new Date();
    return Result.ok(new Table({
      ...props,
      status: 'AVAILABLE',
      isActive: true,
      createdAt: now, updatedAt: now, updatedBy: props.createdBy,
    }, id));
  }

  static reconstitute(props: TableProps, id: string): Result<Table, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);
    return Result.ok(new Table(props, id));
  }

  get branchId():    string      { return this.props.branchId; }
  get franchiseId(): string      { return this.props.franchiseId; }
  get tableNumber(): number      { return this.props.tableNumber; }
  get capacity():    number      { return this.props.capacity; }
  get status():      TableStatus { return this.props.status; }
  get position():    TablePosition | undefined { return this.props.position; }
  get section():     string | undefined        { return this.props.section; }
  get isActive():    boolean     { return this.props.isActive; }
  get createdAt():   Date        { return this.props.createdAt; }
  get updatedAt():   Date        { return this.props.updatedAt; }
  get createdBy():   string      { return this.props.createdBy; }
  get updatedBy():   string      { return this.props.updatedBy; }

  changeStatus(newStatus: TableStatus, updatedBy: string): Result<void, string> {
    const allowed = TABLE_TRANSITIONS[this.props.status];
    if (!allowed.includes(newStatus)) {
      return Result.fail(`Cannot transition table from ${this.props.status} to ${newStatus}`);
    }
    const prev = this.props.status;
    this.props.status    = newStatus;
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TableStatusChangedEvent(
      this.id, this.branchId, this.franchiseId,
      this.tableNumber, prev, newStatus,
    ));
    return Result.ok();
  }

  saveLayout(position: TablePosition, updatedBy: string): void {
    this.props.position  = position;
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TableLayoutSavedEvent(this.id, this.branchId));
  }
}
