// apps/inventory-service/src/inventory/infrastructure/persistence/inventory-item.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document }                    from 'mongoose';

export type InventoryItemDocument = InventoryItemModel & Document;

@Schema({ collection: 'inventory_items', timestamps: false, versionKey: false })
export class InventoryItemModel {
  @Prop({ required: true }) _id: string;
  @Prop({ required: true, index: true }) branchId: string;
  @Prop({ required: true, index: true }) franchiseId: string;
  @Prop({ required: true }) name: string;
  @Prop() description?: string;
  @Prop({ required: true }) sku: string;

  @Prop({ required: true, default: 0, min: 0 }) stockQuantity: number;
  @Prop({ required: true }) stockUnit: string;

  @Prop({ required: true, default: 10 }) reorderLevel: number;
  @Prop({ required: true, default: 50 }) reorderQuantity: number;

  @Prop({ required: true, default: true }) isActive: boolean;
  @Prop({ required: true }) createdAt: Date;
  @Prop({ required: true }) updatedAt: Date;
  @Prop({ required: true }) createdBy: string;
  @Prop({ required: true }) updatedBy: string;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItemModel);
InventoryItemSchema.index({ branchId: 1, sku: 1 }, { unique: true });
InventoryItemSchema.index({ branchId: 1, stockQuantity: 1 }); // for low-stock queries
