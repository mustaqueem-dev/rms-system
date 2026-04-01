// apps/menu-service/src/menu/infrastructure/persistence/mongo-category.repository.ts

import { Injectable }    from '@nestjs/common';
import { InjectModel }   from '@nestjs/mongoose';
import { Model }         from 'mongoose';
import { Category }      from '../../domain/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CategoryModel, CategoryDocument } from './category.schema';

@Injectable()
export class MongoCategoryRepository implements ICategoryRepository {
  constructor(
    @InjectModel(CategoryModel.name)
    private readonly model: Model<CategoryDocument>,
  ) {}

  async findById(id: string, branchId: string): Promise<Category | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(branchId: string, franchiseId: string): Promise<Category[]> {
    const docs = await this.model
      .find({ branchId, franchiseId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((d) => this.toDomain(d));
  }

  async save(cat: Category): Promise<void> {
    await this.model.create({
      _id:         cat.id,
      branchId:    cat.branchId,
      franchiseId: cat.franchiseId,
      name:        cat.name,
      description: cat.description,
      sortOrder:   cat.sortOrder,
      isActive:    cat.isActive,
      createdAt:   cat.createdAt,
      updatedAt:   cat.updatedAt,
      createdBy:   cat.createdBy,
      updatedBy:   cat.updatedBy,
    });
  }

  async update(cat: Category): Promise<void> {
    await this.model.findByIdAndUpdate(cat.id, {
      name:        cat.name,
      description: cat.description,
      sortOrder:   cat.sortOrder,
      isActive:    cat.isActive,
      updatedAt:   cat.updatedAt,
      updatedBy:   cat.updatedBy,
    }).exec();
  }

  async existsByName(name: string, branchId: string): Promise<boolean> {
    const count = await this.model.countDocuments({ name, branchId, isActive: true });
    return count > 0;
  }

  private toDomain(doc: Record<string, unknown>): Category {
    const result = Category.reconstitute(
      {
        branchId:    doc.branchId    as string,
        franchiseId: doc.franchiseId as string,
        name:        doc.name        as string,
        description: doc.description as string | undefined,
        sortOrder:   doc.sortOrder   as number,
        isActive:    doc.isActive    as boolean,
        createdAt:   doc.createdAt   as Date,
        updatedAt:   doc.updatedAt   as Date,
        createdBy:   doc.createdBy   as string,
        updatedBy:   doc.updatedBy   as string,
      },
      doc._id as string,
    );
    if (result.isFailure) throw new Error(`Cannot reconstitute Category ${doc._id}: ${result.error}`);
    return result.value;
  }
}
