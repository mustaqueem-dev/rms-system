// apps/inventory-service/src/inventory/infrastructure/persistence/mongo-stock-adjustment.repository.ts

import { Injectable }    from '@nestjs/common';
import { InjectModel }   from '@nestjs/mongoose';
import { Model }         from 'mongoose';
import { StockAdjustment, AdjustmentReason } from '../../domain/stock-adjustment.entity';
import { IStockAdjustmentRepository }        from '../../domain/repositories/stock-adjustment.repository.interface';
import { StockAdjustmentModel, StockAdjustmentDocument } from './stock-adjustment.schema';

@Injectable()
export class MongoStockAdjustmentRepository implements IStockAdjustmentRepository {
  constructor(
    @InjectModel(StockAdjustmentModel.name)
    private readonly model: Model<StockAdjustmentDocument>,
  ) {}

  async save(adj: StockAdjustment): Promise<void> {
    await this.model.create({
      _id:             adj.id,
      inventoryItemId: adj.inventoryItemId,
      branchId:        adj.branchId,
      franchiseId:     adj.franchiseId,
      delta:           adj.delta,
      quantityBefore:  adj.quantityBefore,
      quantityAfter:   adj.quantityAfter,
      reason:          adj.reason,
      reference:       adj.reference,
      note:            adj.note,
      performedBy:     adj.performedBy,
      performedAt:     adj.performedAt,
    });
  }

  async findByItemId(
    inventoryItemId: string,
    branchId: string,
    options: { limit: number; offset: number },
  ): Promise<StockAdjustment[]> {
    const docs = await this.model
      .find({ inventoryItemId, branchId })
      .sort({ performedAt: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .lean()
      .exec();

    return docs.map((d) => {
      const result = StockAdjustment.create(
        {
          inventoryItemId: d.inventoryItemId,
          branchId:        d.branchId,
          franchiseId:     d.franchiseId,
          delta:           d.delta,
          quantityBefore:  d.quantityBefore,
          quantityAfter:   d.quantityAfter,
          reason:          d.reason as AdjustmentReason,
          reference:       d.reference,
          note:            d.note,
          performedBy:     d.performedBy,
        },
        d._id as string,
      );
      if (result.isFailure) throw new Error(`Cannot reconstitute StockAdjustment ${d._id}: ${result.error}`);
      return result.value;
    });
  }
}
