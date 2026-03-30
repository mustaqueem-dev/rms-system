// apps/order-service/src/order/infrastructure/persistence/mongo-order.repository.ts

import { Injectable }         from '@nestjs/common';
import { InjectModel }        from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '@rms/shared-kernel';
import { Order, OrderStatus } from '../../domain/order.entity';
import { IOrderRepository, OrderFilter } from '../../domain/repositories/order.repository.interface';
import { OrderModel, OrderDocument }     from './order.schema';

@Injectable()
export class MongoOrderRepository implements IOrderRepository {
  constructor(
    @InjectModel(OrderModel.name) private readonly model: Model<OrderDocument>
  ) {}

  async findById(id: string, branchId: string): Promise<Order | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: OrderFilter, pagination: PaginationOptions): Promise<PaginatedResult<Order>> {
    const query = this.buildQuery(filter);
    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(pagination.offset)
        .limit(pagination.limit)
        .lean()
        .exec(),
      this.model.countDocuments(query),
    ]);
    return buildPaginatedResult(docs.map(d => this.toDomain(d)), total, pagination);
  }

  async save(order: Order): Promise<void> {
    await this.model.create(this.toPersistence(order));
  }

  async update(order: Order): Promise<void> {
    const { _id, ...rest } = this.toPersistence(order);
    await this.model.findByIdAndUpdate(_id, rest).exec();
  }

  // ─── Mapper: domain ↔ persistence ────────────────────────────────────────

  private toPersistence(order: Order): Record<string, unknown> {
    return {
      _id:         order.id,
      branchId:    order.branchId,
      franchiseId: order.franchiseId,
      tableNumber: order.tableNumber,
      customerId:  order.customerId,
      status:      order.status,
      totalAmount: order.totalAmount,
      currency:    order.currency,
      lines:       order.lines,
      createdAt:   order.createdAt,
      updatedAt:   order.updatedAt,
      createdBy:   order.createdBy,
      updatedBy:   order.updatedBy,
    };
  }

  private toDomain(doc: Record<string, any>): Order {
    const result = Order.create({
      branchId:    doc.branchId,
      franchiseId: doc.franchiseId,
      tableNumber: doc.tableNumber,
      customerId:  doc.customerId,
      lines:       doc.lines,
      createdBy:   doc.createdBy,
    }, doc._id);

    if (result.isFailure) throw new Error(`Cannot reconstitute Order ${doc._id}: ${result.error}`);

    // Reconstitute state machine internals not settable in create()
    const agg = result.value;
    (agg as any).props.status      = doc.status as OrderStatus;
    (agg as any).props.totalAmount = doc.totalAmount;
    (agg as any).props.currency    = doc.currency;
    (agg as any).props.createdAt   = doc.createdAt;
    (agg as any).props.updatedAt   = doc.updatedAt;
    (agg as any).props.updatedBy   = doc.updatedBy;
    agg.clearDomainEvents(); // Since create() might have queued 'placed'

    return agg;
  }

  private buildQuery(filter: OrderFilter): FilterQuery<OrderDocument> {
    const query: FilterQuery<OrderDocument> = {
      branchId:    filter.branchId,
      franchiseId: filter.franchiseId,
    };
    if (filter.status) query.status = filter.status;
    if (filter.customerId) query.customerId = filter.customerId;
    if (filter.fromDate || filter.toDate) {
      query.createdAt = {};
      if (filter.fromDate) query.createdAt.$gte = filter.fromDate;
      if (filter.toDate)   query.createdAt.$lte = filter.toDate;
    }
    return query;
  }
}
