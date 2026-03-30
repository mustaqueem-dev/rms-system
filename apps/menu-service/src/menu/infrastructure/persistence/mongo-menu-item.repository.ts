// apps/menu-service/src/menu/infrastructure/persistence/mongo-menu-item.repository.ts

import { Injectable }         from '@nestjs/common';
import { InjectModel }        from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '@rms/shared-kernel';
import { MenuItem }           from '../../domain/menu-item.entity';
import { Price }              from '../../domain/value-objects/price.vo';
import { Tag }                from '../../domain/value-objects/tag.vo';
import {
  IMenuItemRepository,
  MenuItemFilter,
}  from '../../domain/repositories/menu-item.repository.interface';
import { MenuItemModel, MenuItemDocument } from './menu-item.schema';

@Injectable()
export class MongoMenuItemRepository implements IMenuItemRepository {
  constructor(
    @InjectModel(MenuItemModel.name) private readonly model: Model<MenuItemDocument>
  ) {}

  async findById(id: string, branchId: string): Promise<MenuItem | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: MenuItemFilter, pagination: PaginationOptions): Promise<PaginatedResult<MenuItem>> {
    const query = this.buildQuery(filter);
    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ sortOrder: 1, name: 1 })
        .skip(pagination.offset)
        .limit(pagination.limit)
        .lean()
        .exec(),
      this.model.countDocuments(query),
    ]);
    return buildPaginatedResult(docs.map(d => this.toDomain(d)), total, pagination);
  }

  async findByCategory(categoryId: string, branchId: string): Promise<MenuItem[]> {
    const docs = await this.model
      .find({ categoryId, branchId, isAvailable: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
    return docs.map(d => this.toDomain(d));
  }

  async save(item: MenuItem): Promise<void> {
    await this.model.create(this.toPersistence(item));
  }

  async update(item: MenuItem): Promise<void> {
    const { _id, ...rest } = this.toPersistence(item);
    await this.model.findByIdAndUpdate(_id, rest).exec();
  }

  async delete(id: string, branchId: string): Promise<void> {
    await this.model.findOneAndDelete({ _id: id, branchId }).exec();
  }

  async existsByName(name: string, branchId: string, categoryId: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      branchId, categoryId, name: new RegExp(`^${name}$`, 'i')
    });
    return count > 0;
  }

  // ─── Mapper: domain → persistence ────────────────────────────────────────

  private toPersistence(item: MenuItem): Record<string, unknown> {
    return {
      _id:                    item.id,
      branchId:               item.branchId,
      franchiseId:            item.franchiseId,
      categoryId:             item.categoryId,
      name:                   item.name,
      description:            item.description,
      priceAmount:            item.price.amount,
      priceCurrency:          item.price.currency,
      priceTaxRate:           item.price.taxRate,
      isAvailable:            item.isAvailable,
      preparationTimeMinutes: item.preparationTimeMinutes,
      tags:                   item.tags.map(t => t.value),
      imageUrl:               item.imageUrl,
      sortOrder:              item.sortOrder,
      createdAt:              item.createdAt,
      updatedAt:              item.updatedAt,
      createdBy:              item.createdBy,
      updatedBy:              item.updatedBy,
    };
  }

  // ─── Mapper: persistence → domain ────────────────────────────────────────

  private toDomain(doc: Record<string, any>): MenuItem {
    const priceResult = Price.create(doc.priceAmount, doc.priceCurrency, doc.priceTaxRate);
    if (priceResult.isFailure) throw new Error(`Corrupt price in DB for item ${doc._id}`);

    const tags = (doc.tags as string[]).map(t => {
      const r = Tag.create(t);
      if (r.isFailure) throw new Error(`Corrupt tag '${t}' in DB for item ${doc._id}`);
      return r.value;
    });

    const result = MenuItem.create(
      {
        branchId:               doc.branchId,
        franchiseId:            doc.franchiseId,
        categoryId:             doc.categoryId,
        name:                   doc.name,
        description:            doc.description,
        price:                  priceResult.value,
        isAvailable:            doc.isAvailable,
        preparationTimeMinutes: doc.preparationTimeMinutes,
        tags,
        imageUrl:               doc.imageUrl,
        sortOrder:              doc.sortOrder,
        createdBy:              doc.createdBy,
        updatedBy:              doc.updatedBy,
      },
      doc._id
    );
    if (result.isFailure) throw new Error(`Cannot reconstitute MenuItem ${doc._id}: ${result.error}`);
    return result.value;
  }

  private buildQuery(filter: MenuItemFilter): FilterQuery<MenuItemDocument> {
    const query: FilterQuery<MenuItemDocument> = {
      branchId:    filter.branchId,
      franchiseId: filter.franchiseId,
    };
    if (filter.categoryId  !== undefined) query.categoryId  = filter.categoryId;
    if (filter.isAvailable !== undefined) query.isAvailable = filter.isAvailable;
    if (filter.tags?.length)              query.tags         = { $in: filter.tags };
    if (filter.search)                    query.$text        = { $search: filter.search };
    return query;
  }
}
