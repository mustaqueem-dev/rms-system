// apps/staff-service/src/staff/infrastructure/persistence/shift-slot.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftSlotDocument = ShiftSlotModel & Document;

@Schema({ collection: 'shift_slots', timestamps: false, versionKey: false })
export class ShiftSlotModel {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  franchiseId: string;

  @Prop({ required: true, index: true })
  staffId: string;

  @Prop({ required: true })
  staffName: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  updatedBy: string;
}

export const ShiftSlotSchema = SchemaFactory.createForClass(ShiftSlotModel);
ShiftSlotSchema.index({ branchId: 1, date: 1 });
ShiftSlotSchema.index({ branchId: 1, staffId: 1, date: 1 });
