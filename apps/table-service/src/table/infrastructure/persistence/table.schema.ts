// apps/table-service/src/table/infrastructure/persistence/table.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TableDocument = TableModel & Document;

@Schema({ collection: 'tables', timestamps: false, versionKey: false })
export class TableModel {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  franchiseId: string;

  @Prop({ required: true })
  tableNumber: number;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true, enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'], default: 'AVAILABLE' })
  status: string;

  @Prop({ type: Object })
  position?: { x: number; y: number };

  @Prop()
  section?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  updatedBy: string;
}

export const TableSchema = SchemaFactory.createForClass(TableModel);
// Unique table number per branch
TableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });
// Query all tables in a branch by status
TableSchema.index({ branchId: 1, status: 1 });
// Franchise-level layout view
TableSchema.index({ franchiseId: 1, isActive: 1 });
