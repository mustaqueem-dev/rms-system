// apps/table-service/src/table/infrastructure/persistence/mongo-table.repository.ts

import { Injectable }  from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model }       from 'mongoose';
import { Table, TableProps, TableStatus, TablePosition } from '../../domain/table.entity';
import { ITableRepository, TableFilter }                 from '../../domain/repositories/table.repository.interface';
import { TableModel, TableDocument }                     from './table.schema';

@Injectable()
export class MongoTableRepository implements ITableRepository {
  constructor(@InjectModel(TableModel.name) private readonly model: Model<TableDocument>) {}

  async findById(id: string, branchId: string): Promise<Table | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByNumber(tableNumber: number, branchId: string): Promise<Table | null> {
    const doc = await this.model.findOne({ tableNumber, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: TableFilter): Promise<Table[]> {
    const query: Record<string, unknown> = {
      branchId:    filter.branchId,
      franchiseId: filter.franchiseId,
    };
    if (filter.status)  query['status']  = filter.status;
    if (filter.section) query['section'] = filter.section;
    const docs = await this.model.find(query).sort({ tableNumber: 1 }).lean().exec();
    return docs.map((d) => this.toDomain(d));
  }

  async save(table: Table): Promise<void> {
    await this.model.create(this.toDoc(table));
  }

  async update(table: Table): Promise<void> {
    await this.model.updateOne({ _id: table.id }, { $set: this.toDoc(table) }).exec();
  }

  private toDoc(table: Table): Record<string, unknown> {
    return {
      _id:         table.id,
      branchId:    table.branchId,
      franchiseId: table.franchiseId,
      tableNumber: table.tableNumber,
      capacity:    table.capacity,
      status:      table.status,
      position:    table.position,
      section:     table.section,
      isActive:    table.isActive,
      createdAt:   table.createdAt,
      updatedAt:   table.updatedAt,
      createdBy:   table.createdBy,
      updatedBy:   table.updatedBy,
    };
  }

  private toDomain(doc: Record<string, unknown>): Table {
    const result = Table.reconstitute(
      {
        branchId:    doc.branchId    as string,
        franchiseId: doc.franchiseId as string,
        tableNumber: doc.tableNumber  as number,
        capacity:    doc.capacity     as number,
        status:      doc.status       as TableStatus,
        position:    doc.position     as TablePosition | undefined,
        section:     doc.section      as string | undefined,
        isActive:    doc.isActive     as boolean,
        createdAt:   doc.createdAt    as Date,
        updatedAt:   doc.updatedAt    as Date,
        createdBy:   doc.createdBy    as string,
        updatedBy:   doc.updatedBy    as string,
      },
      doc._id as string,
    );
    if (result.isFailure) throw new Error(`Cannot reconstitute Table ${doc._id}: ${result.error}`);
    return result.value;
  }
}
