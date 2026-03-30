// apps/inventory-service/src/inventory/infrastructure/persistence/mongo-inventory-item.repository.ts

import { Injectable }         from '@nestjs/common';
import { InjectModel }        from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { buildPaginatedResult, PaginationOptions, PaginatedResult } from '@rms/shared-kernel';
import { InventoryItem }      from '../../domain/inventory-item.entity';
import { IInventoryItemRepository, InventoryItemFilter } from '../../domain/repositories/inventory-item.repository.interface';
import { InventoryItemModel, InventoryItemDocument }     from './inventory-item.schema';

@Injectable()
export class MongoInventoryItemRepository implements IInventoryItemRepository {
  constructor(
    @InjectModel(InventoryItemModel.name) private readonly model: Model<InventoryItemDocument>
  ) {}

  async findById(id: string, branchId: string): Promise<InventoryItem | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findBySku(sku: string, branchId: string): Promise<InventoryItem | null> {
    const doc = await this.model.findOne({ sku, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: InventoryItemFilter, pagination: PaginationOptions): Promise<PaginatedResult<InventoryItem>> {
    const query = this.buildQuery(filter);
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ name: 1 }).skip(pagination.offset).limit(pagination.limit).lean().exec(),
      this.model.countDocuments(query),
    ]);
    return buildPaginatedResult(docs.map(d => this.toDomain(d)), total, pagination);
  }

  async save(item: InventoryItem): Promise<void> {
    await this.model.create(this.toPersistence(item));
  }

  async update(item: InventoryItem): Promise<void> {
    const { _id, ...rest } = this.toPersistence(item);
    await this.model.findByIdAndUpdate(_id, rest).exec();
  }

  private toPersistence(item: InventoryItem): Record<string, unknown> {
    return {
      _id:             item.id,
      branchId:        item.branchId,
      franchiseId:     item.franchiseId,
      name:            item.name,
      sku:             item.sku,
      stockQuantity:   item.stock.quantity,
      stockUnit:       item.stock.unit,
      reorderLevel:    item.reorderRule.reorderLevel,
      reorderQuantity: item.reorderRule.reorderQuantity,
      isActive:        item.isActive,
      createdAt:       item.createdAt,
      updatedAt:       item.updatedAt,
      createdBy:       item.createdBy,
      updatedBy:       item.updatedBy,
    };
  }

  private toDomain(doc: Record<string, any>): InventoryItem {
    const r = InventoryItem.create({
      branchId:    doc.branchId,
      franchiseId: doc.franchiseId,
      name:        doc.name,
      sku:         doc.sku,
      stock:       { quantity: doc.stockQuantity, unit: doc.stockUnit },
      reorderRule: { reorderLevel: doc.reorderLevel, reorderQuantity: doc.reorderQuantity },
      createdBy:   doc.createdBy,
    }, doc._id);

    if (r.isFailure) throw new Error(`Model error ${doc._id}: ${r.error}`);
    const agg = r.value;
    (agg as any).props.isActive  = doc.isActive;
    (agg as any).props.createdAt = doc.createdAt;
    (agg as any).props.updatedAt = doc.updatedAt;
    (agg as any).props.updatedBy = doc.updatedBy;
    agg.clearDomainEvents();
    return agg;
  }

  private buildQuery(filter: InventoryItemFilter): FilterQuery<InventoryItemDocument> {
    const q: FilterQuery<InventoryItemDocument> = { branchId: filter.branchId, franchiseId: filter.franchiseId };
    if (filter.sku) q.sku = filter.sku;
    if (filter.isLowStock) q.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
    return q;
  }
}
