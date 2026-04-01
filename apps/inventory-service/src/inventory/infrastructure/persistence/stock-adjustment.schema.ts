// apps/inventory-service/src/inventory/infrastructure/persistence/stock-adjustment.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StockAdjustmentDocument = StockAdjustmentModel & Document;

@Schema({ collection: 'stock_adjustments', timestamps: false, versionKey: false })
export class StockAdjustmentModel {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, index: true })
  inventoryItemId: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  franchiseId: string;

  @Prop({ required: true })
  delta: number;

  @Prop({ required: true })
  quantityBefore: number;

  @Prop({ required: true })
  quantityAfter: number;

  @Prop({
    required: true,
    enum: ['MANUAL_IN', 'MANUAL_OUT', 'ORDER_DEDUCTION', 'WASTE', 'SUPPLIER_RETURN', 'OPENING_STOCK'],
  })
  reason: string;

  @Prop()
  reference?: string;

  @Prop()
  note?: string;

  @Prop({ required: true })
  performedBy: string;

  @Prop({ required: true, default: () => new Date() })
  performedAt: Date;
}

export const StockAdjustmentSchema = SchemaFactory.createForClass(StockAdjustmentModel);

// Query: all adjustments for an item (most recent first)
StockAdjustmentSchema.index({ inventoryItemId: 1, performedAt: -1 });
// Query: all adjustments in a branch by date range
StockAdjustmentSchema.index({ branchId: 1, performedAt: -1 });
