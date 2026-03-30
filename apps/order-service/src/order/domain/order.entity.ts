// apps/order-service/src/order/domain/order.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';
import { InvalidStateTransitionError }             from '@rms/shared-kernel';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'CLOSED'
  | 'CANCELLED';

// Valid transitions from each status
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY:     ['SERVED'],
  SERVED:    ['CLOSED'],
  CLOSED:    [],
  CANCELLED: [],
};

export interface OrderLineProps {
  menuItemId: string;
  name:       string;
  quantity:   number;
  unitPrice:  number;
  currency:   string;
  notes?:     string;
}

export interface OrderProps {
  branchId:     string;
  franchiseId:  string;
  tableNumber?: number;
  customerId?:  string;
  status:       OrderStatus;
  lines:        OrderLineProps[];
  totalAmount:  number;
  currency:     string;
  createdAt:    Date;
  updatedAt:    Date;
  createdBy:    string;   // staffId
  updatedBy:    string;
}

// ─── Domain Events ────────────────────────────────────────────────────────────

export class OrderPlacedEvent extends DomainEvent {
  readonly eventName   = 'order.placed';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly franchiseId: string, readonly totalAmount: number) {
    super();
    this.aggregateId = id;
  }
}

export class OrderStatusChangedEvent extends DomainEvent {
  readonly eventName   = 'order.status.changed';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly previousStatus: OrderStatus, readonly newStatus: OrderStatus) {
    super();
    this.aggregateId = id;
  }
}

export class OrderCancelledEvent extends DomainEvent {
  readonly eventName   = 'order.cancelled';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly reason: string) {
    super();
    this.aggregateId = id;
  }
}

// ─── Order aggregate root ─────────────────────────────────────────────────────

export class Order extends BaseEntity<OrderProps> {
  private constructor(props: OrderProps, id?: string) { super(props, id); }

  static create(
    props: Omit<OrderProps, 'status' | 'totalAmount' | 'currency' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
    id?:   string
  ): Result<Order, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.lines,       argumentName: 'lines' },
      { argument: props.createdBy,   argumentName: 'createdBy' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);
    if (!props.lines.length) return Result.fail('Order must have at least one line');

    // Compute totals from lines
    const currency    = props.lines[0].currency;
    const totalAmount = props.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const now         = new Date();

    const order = new Order({
      ...props, status: 'PENDING', totalAmount, currency, createdAt: now, updatedAt: now, updatedBy: props.createdBy,
    }, id);

    if (!id) {
      order.addDomainEvent(new OrderPlacedEvent(order.id, props.branchId, props.franchiseId, totalAmount));
    }
    return Result.ok(order);
  }

  get branchId():     string        { return this.props.branchId; }
  get franchiseId():  string        { return this.props.franchiseId; }
  get status():       OrderStatus   { return this.props.status; }
  get lines():        OrderLineProps[] { return [...this.props.lines]; }
  get totalAmount():  number        { return this.props.totalAmount; }
  get currency():     string        { return this.props.currency; }
  get tableNumber():  number | undefined { return this.props.tableNumber; }
  get customerId():   string | undefined { return this.props.customerId; }
  get createdAt():    Date          { return this.props.createdAt; }
  get updatedAt():    Date          { return this.props.updatedAt; }
  get createdBy():    string        { return this.props.createdBy; }
  get updatedBy():    string        { return this.props.updatedBy; }

  transitionTo(newStatus: OrderStatus, updatedBy: string, reason?: string): Result<void, string> {
    const allowed = TRANSITIONS[this.props.status];
    if (!allowed.includes(newStatus)) {
      return Result.fail(
        new InvalidStateTransitionError(this.props.status, newStatus, 'Order').message
      );
    }

    const previousStatus    = this.props.status;
    this.props.status       = newStatus;
    this.props.updatedBy    = updatedBy;
    this.props.updatedAt    = new Date();

    if (newStatus === 'CANCELLED') {
      this.addDomainEvent(new OrderCancelledEvent(this.id, this.branchId, reason ?? 'No reason provided'));
    } else {
      this.addDomainEvent(new OrderStatusChangedEvent(this.id, this.branchId, previousStatus, newStatus));
    }
    return Result.ok();
  }
}
