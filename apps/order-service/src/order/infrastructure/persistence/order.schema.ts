// apps/order-service/src/order/infrastructure/persistence/order.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document }                    from 'mongoose';

export type OrderDocument = OrderModel & Document;

@Schema({ _id: false })
export class OrderLineModel {
  @Prop({ required: true }) menuItemId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) quantity: number;
  @Prop({ required: true }) unitPrice: number;
  @Prop({ required: true }) currency: string;
  @Prop() notes?: string;
}

const OrderLineSchema = SchemaFactory.createForClass(OrderLineModel);

@Schema({ collection: 'orders', timestamps: false, versionKey: false })
export class OrderModel {
  @Prop({ required: true }) _id: string; // UUID
  @Prop({ required: true, index: true }) branchId: string;
  @Prop({ required: true, index: true }) franchiseId: string;

  @Prop() tableNumber?: number;
  @Prop() customerId?: string;

  @Prop({ required: true, index: true }) status: string;
  @Prop({ type: [OrderLineSchema], required: true }) lines: OrderLineModel[];

  @Prop({ required: true }) totalAmount: number;
  @Prop({ required: true }) currency: string;

  @Prop({ required: true, index: true }) createdAt: Date;
  @Prop({ required: true }) updatedAt: Date;
  @Prop({ required: true }) createdBy: string;
  @Prop({ required: true }) updatedBy: string;
}

export const OrderSchema = SchemaFactory.createForClass(OrderModel);
OrderSchema.index({ branchId: 1, status: 1 });
OrderSchema.index({ branchId: 1, createdAt: -1 });
