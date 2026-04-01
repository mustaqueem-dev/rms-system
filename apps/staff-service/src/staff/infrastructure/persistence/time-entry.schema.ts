// apps/staff-service/src/staff/infrastructure/persistence/time-entry.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TimeEntryDocument = TimeEntryModel & Document;

@Schema({ collection: 'time_entries', timestamps: false, versionKey: false })
export class TimeEntryModel {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  franchiseId: string;

  @Prop({ required: true, index: true })
  staffId: string;

  @Prop()
  shiftSlotId?: string;

  @Prop({ required: true })
  clockInAt: Date;

  @Prop()
  clockOutAt?: Date;

  @Prop()
  totalMinutes?: number;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntryModel);
TimeEntrySchema.index({ branchId: 1, staffId: 1, clockInAt: -1 });
// Partial index so findActive is fast (open sessions have no clockOutAt)
TimeEntrySchema.index({ branchId: 1, staffId: 1, clockOutAt: 1 }, { sparse: true });
