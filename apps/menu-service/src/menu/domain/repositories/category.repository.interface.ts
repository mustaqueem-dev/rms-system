// apps/menu-service/src/menu/domain/repositories/category.repository.interface.ts

import { Category } from '../category.entity';

export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');

export interface ICategoryRepository {
  findById(id: string, branchId: string): Promise<Category | null>;
  findAll(branchId: string, franchiseId: string): Promise<Category[]>;
  save(cat: Category): Promise<void>;
  update(cat: Category): Promise<void>;
  existsByName(name: string, branchId: string): Promise<boolean>;
}
