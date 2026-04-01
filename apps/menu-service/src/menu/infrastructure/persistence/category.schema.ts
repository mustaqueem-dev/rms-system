// apps/menu-service/src/menu/infrastructure/persistence/category.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = CategoryModel & Document;

@Schema({ collection: 'categories', timestamps: false, versionKey: false })
export class CategoryModel {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true, index: true })
  franchiseId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;

  @Prop({ required: true, default: () => new Date() })
  updatedAt: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  updatedBy: string;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);

// Unique name per branch
CategorySchema.index({ branchId: 1, name: 1 }, { unique: true });
// Query by franchise (for cross-branch reports)
CategorySchema.index({ franchiseId: 1, isActive: 1 });
