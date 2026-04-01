// apps/table-service/src/table/domain/repositories/table.repository.interface.ts

import { Table, TableStatus } from '../table.entity';

export const TABLE_REPOSITORY = Symbol('ITableRepository');

export interface TableFilter {
  branchId:    string;
  franchiseId: string;
  status?:     TableStatus;
  section?:    string;
}

export interface ITableRepository {
  findById(id: string, branchId: string): Promise<Table | null>;
  findByNumber(tableNumber: number, branchId: string): Promise<Table | null>;
  findAll(filter: TableFilter): Promise<Table[]>;
  save(table: Table): Promise<void>;
  update(table: Table): Promise<void>;
}
