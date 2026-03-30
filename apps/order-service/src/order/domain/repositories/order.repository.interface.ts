// apps/order-service/src/order/domain/repositories/order.repository.interface.ts

import { Order, OrderStatus } from '../order.entity';
import { PaginatedResult, PaginationOptions } from '@rms/shared-kernel';

export const ORDER_REPOSITORY = Symbol('IOrderRepository');

export interface OrderFilter {
  branchId:    string;
  franchiseId: string;
  status?:     OrderStatus;
  customerId?: string;
  fromDate?:   Date;
  toDate?:     Date;
}

export interface IOrderRepository {
  findById(id: string, branchId: string): Promise<Order | null>;
  findAll(filter: OrderFilter, pagination: PaginationOptions): Promise<PaginatedResult<Order>>;
  save(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
}
