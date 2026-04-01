// apps/table-service/src/table/infrastructure/persistence/reservation.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReservationDocument = ReservationModel & Document;

@Schema({ collection: 'reservations', timestamps: false, versionKey: false })
export class ReservationModel {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  franchiseId: string;

  @Prop({ required: true, index: true })
  tableId: string;

  @Prop({ required: true })
  tableNumber: number;

  @Prop({ required: true })
  guestName: string;

  @Prop({ required: true })
  guestPhone: string;

  @Prop({ required: true })
  partySize: number;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({
    required: true,
    enum: ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'PENDING',
  })
  status: string;

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

export const ReservationSchema = SchemaFactory.createForClass(ReservationModel);
// Query reservations by branch + date window
ReservationSchema.index({ branchId: 1, scheduledAt: 1 });
// Query reservations by table
ReservationSchema.index({ tableId: 1, status: 1 });
// Query by status for confirmation workflows
ReservationSchema.index({ branchId: 1, status: 1 });
