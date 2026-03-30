// apps/menu-service/src/menu/domain/repositories/menu-item.repository.interface.ts

import { MenuItem }         from '../menu-item.entity';
import { PaginationOptions, PaginatedResult } from '@rms/shared-kernel';

export const MENU_ITEM_REPOSITORY = Symbol('IMenuItemRepository');

export interface MenuItemFilter {
  branchId:    string;
  franchiseId: string;
  categoryId?: string;
  isAvailable?: boolean;
  tags?:        string[];
  search?:      string;   // name full-text search
}

export interface IMenuItemRepository {
  findById(id: string, branchId: string): Promise<MenuItem | null>;
  findAll(filter: MenuItemFilter, pagination: PaginationOptions): Promise<PaginatedResult<MenuItem>>;
  findByCategory(categoryId: string, branchId: string): Promise<MenuItem[]>;
  save(item: MenuItem): Promise<void>;
  update(item: MenuItem): Promise<void>;
  delete(id: string, branchId: string): Promise<void>;
  existsByName(name: string, branchId: string, categoryId: string): Promise<boolean>;
}
