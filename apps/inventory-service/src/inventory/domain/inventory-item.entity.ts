// apps/inventory-service/src/inventory/domain/inventory-item.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';
import { InvalidQuantityError, InvalidStateTransitionError } from '@rms/shared-kernel';

export interface StockLevelProps { quantity: number; unit: string; }
export interface ReorderRuleProps { reorderLevel: number; reorderQuantity: number; }

export interface InventoryItemProps {
  branchId:       string;
  franchiseId:    string;
  name:           string;
  description?:   string;
  sku:            string;      // stock-keeping unit code
  stock:          StockLevelProps;
  reorderRule:    ReorderRuleProps;
  isActive:       boolean;
  createdAt:      Date;
  updatedAt:      Date;
  createdBy:      string;
  updatedBy:      string;
}

// ─── Domain events ────────────────────────────────────────────────────────────

export class StockUpdatedEvent extends DomainEvent {
  readonly eventName   = 'inventory.stock.updated';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly previousQty: number, readonly newQty: number) {
    super();
    this.aggregateId = id;
  }
}

export class LowStockAlertEvent extends DomainEvent {
  readonly eventName   = 'inventory.stock.low';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string, readonly currentQty: number, readonly reorderLevel: number) {
    super();
    this.aggregateId = id;
  }
}

export class StockDepletedEvent extends DomainEvent {
  readonly eventName   = 'inventory.stock.depleted';
  readonly aggregateId: string;
  constructor(id: string, readonly branchId: string) { super(); this.aggregateId = id; }
}

// ─── Aggregate root ───────────────────────────────────────────────────────────

export class InventoryItem extends BaseEntity<InventoryItemProps> {
  private constructor(props: InventoryItemProps, id?: string) { super(props, id); }

  static create(
    props: Omit<InventoryItemProps, 'isActive' | 'createdAt' | 'updatedAt'>,
    id?:   string
  ): Result<InventoryItem, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.name,        argumentName: 'name' },
      { argument: props.sku,         argumentName: 'sku' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);

    if (props.stock.quantity < 0) return Result.fail(new InvalidQuantityError(props.stock.quantity).message);

    const now  = new Date();
    return Result.ok(new InventoryItem(
      { ...props, isActive: true, createdAt: now, updatedAt: now, updatedBy: props.createdBy },
      id
    ));
  }

  get branchId():       string { return this.props.branchId; }
  get franchiseId():    string { return this.props.franchiseId; }
  get name():           string { return this.props.name; }
  get sku():            string { return this.props.sku; }
  get stock():          StockLevelProps  { return { ...this.props.stock }; }
  get reorderRule():    ReorderRuleProps { return { ...this.props.reorderRule }; }
  get isActive():       boolean { return this.props.isActive; }
  get createdAt():      Date   { return this.props.createdAt; }
  get updatedAt():      Date   { return this.props.updatedAt; }
  get createdBy():      string { return this.props.createdBy; }
  get updatedBy():      string { return this.props.updatedBy; }

  adjustStock(delta: number, updatedBy: string): Result<void, string> {
    const previousQty = this.props.stock.quantity;
    const newQty      = previousQty + delta;
    if (newQty < 0) return Result.fail(new InvalidQuantityError(newQty, { delta, previousQty }).message);

    this.props.stock.quantity = newQty;
    this.props.updatedBy      = updatedBy;
    this.props.updatedAt      = new Date();

    this.addDomainEvent(new StockUpdatedEvent(this.id, this.branchId, previousQty, newQty));

    if (newQty === 0) {
      this.addDomainEvent(new StockDepletedEvent(this.id, this.branchId));
    } else if (newQty <= this.props.reorderRule.reorderLevel) {
      this.addDomainEvent(new LowStockAlertEvent(this.id, this.branchId, newQty, this.props.reorderRule.reorderLevel));
    }

    return Result.ok();
  }

  updateReorderRule(rule: ReorderRuleProps, updatedBy: string): Result<void, string> {
    if (rule.reorderLevel < 0 || rule.reorderQuantity < 1) {
      return Result.fail('Invalid reorder rule values');
    }
    this.props.reorderRule = { ...rule };
    this.props.updatedBy   = updatedBy;
    this.props.updatedAt   = new Date();
    return Result.ok();
  }

  isLowStock(): boolean {
    return this.props.stock.quantity <= this.props.reorderRule.reorderLevel;
  }
}
