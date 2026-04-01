// apps/inventory-service/src/inventory/domain/stock-adjustment.entity.ts
//
// Value-object-like entity that records an immutable audit trail of every stock
// change (who did it, why, and how much).  Not an aggregate root — it's
// created and immediately persisted by the use-case; it never changes after.

import { BaseEntity, Result, Guard } from '@rms/shared-kernel';

export type AdjustmentReason =
  | 'MANUAL_IN'
  | 'MANUAL_OUT'
  | 'ORDER_DEDUCTION'
  | 'WASTE'
  | 'SUPPLIER_RETURN'
  | 'OPENING_STOCK';

export interface StockAdjustmentProps {
  inventoryItemId: string;
  branchId:        string;
  franchiseId:     string;
  delta:           number;          // positive = stock IN, negative = stock OUT
  quantityBefore:  number;
  quantityAfter:   number;
  reason:          AdjustmentReason;
  reference?:      string;          // e.g. orderId for ORDER_DEDUCTION
  note?:           string;
  performedBy:     string;          // userId
  performedAt:     Date;
}

export class StockAdjustment extends BaseEntity<StockAdjustmentProps> {
  private constructor(props: StockAdjustmentProps, id?: string) {
    super(props, id);
  }

  static create(
    props: Omit<StockAdjustmentProps, 'performedAt'>,
    id?: string,
  ): Result<StockAdjustment, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.inventoryItemId, argumentName: 'inventoryItemId' },
      { argument: props.branchId,        argumentName: 'branchId' },
      { argument: props.performedBy,     argumentName: 'performedBy' },
      { argument: props.reason,          argumentName: 'reason' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);

    return Result.ok(
      new StockAdjustment({ ...props, performedAt: new Date() }, id)
    );
  }

  get inventoryItemId(): string              { return this.props.inventoryItemId; }
  get branchId():        string              { return this.props.branchId; }
  get franchiseId():     string              { return this.props.franchiseId; }
  get delta():           number              { return this.props.delta; }
  get quantityBefore():  number              { return this.props.quantityBefore; }
  get quantityAfter():   number              { return this.props.quantityAfter; }
  get reason():          AdjustmentReason   { return this.props.reason; }
  get reference():       string | undefined  { return this.props.reference; }
  get note():            string | undefined  { return this.props.note; }
  get performedBy():     string              { return this.props.performedBy; }
  get performedAt():     Date               { return this.props.performedAt; }
}
