// apps/menu-service/src/menu/infrastructure/persistence/menu-item.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document }                    from 'mongoose';

export type MenuItemDocument = MenuItemModel & Document;

@Schema({ collection: 'menu_items', timestamps: false, versionKey: false })
export class MenuItemModel {
  @Prop({ required: true })
  _id: string;  // UUID

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true, index: true })
  franchiseId: string;

  @Prop({ required: true, index: true })
  categoryId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  // ─── Price (embedded document) ────────────────────────────────────────────
  @Prop({ required: true, type: Number })
  priceAmount: number;

  @Prop({ required: true })
  priceCurrency: string;

  @Prop({ required: true, default: 0 })
  priceTaxRate: number;

  // ─── State ───────────────────────────────────────────────────────────────
  @Prop({ required: true, default: true, index: true })
  isAvailable: boolean;

  @Prop({ required: true, default: 15 })
  preparationTimeMinutes: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  imageUrl?: string;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  // ─── Audit ───────────────────────────────────────────────────────────────
  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  updatedBy: string;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItemModel);

// High-impact compound indexes
MenuItemSchema.index({ branchId: 1, categoryId: 1, isAvailable: 1, sortOrder: 1 });
MenuItemSchema.index({ branchId: 1, tags: 1 });
MenuItemSchema.index({ name: 'text', description: 'text' });   // full-text search
