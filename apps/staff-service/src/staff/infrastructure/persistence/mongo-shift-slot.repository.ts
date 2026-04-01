// apps/staff-service/src/staff/infrastructure/persistence/mongo-shift-slot.repository.ts

import { Injectable }  from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model }       from 'mongoose';
import { ShiftSlot, ShiftSlotProps } from '../../domain/shift-slot.entity';
import { IShiftSlotRepository, ShiftSlotFilter } from '../../domain/repositories/shift-slot.repository.interface';
import { ShiftSlotModel, ShiftSlotDocument }      from './shift-slot.schema';

@Injectable()
export class MongoShiftSlotRepository implements IShiftSlotRepository {
  constructor(@InjectModel(ShiftSlotModel.name) private readonly model: Model<ShiftSlotDocument>) {}

  async findById(id: string, branchId: string): Promise<ShiftSlot | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? ShiftSlot.reconstitute(this.toProps(doc), doc._id as string) : null;
  }

  async findAll(filter: ShiftSlotFilter): Promise<ShiftSlot[]> {
    const q: Record<string, unknown> = { branchId: filter.branchId };
    if (filter.staffId)  q['staffId'] = filter.staffId;
    if (filter.date)     q['date']    = filter.date;
    if (filter.fromDate || filter.toDate) {
      q['date'] = {};
      if (filter.fromDate) (q['date'] as Record<string, unknown>)['$gte'] = filter.fromDate;
      if (filter.toDate)   (q['date'] as Record<string, unknown>)['$lte'] = filter.toDate;
    }
    const docs = await this.model.find(q).sort({ date: 1, startTime: 1 }).lean().exec();
    return docs.map((d) => ShiftSlot.reconstitute(this.toProps(d), d._id as string));
  }

  async save(slot: ShiftSlot): Promise<void> {
    await this.model.create({
      _id: slot.id, branchId: slot.branchId, franchiseId: slot.franchiseId,
      staffId: slot.staffId, staffName: slot.staffName, role: slot.role,
      date: slot.date, startTime: slot.startTime, endTime: slot.endTime,
      notes: slot.notes, createdAt: slot.createdAt, updatedAt: slot.updatedAt,
      createdBy: slot.createdBy, updatedBy: slot.createdBy,
    });
  }

  async delete(id: string, branchId: string): Promise<void> {
    await this.model.deleteOne({ _id: id, branchId }).exec();
  }

  private toProps(doc: Record<string, unknown>): ShiftSlotProps {
    return {
      branchId:    doc.branchId    as string,
      franchiseId: doc.franchiseId as string,
      staffId:     doc.staffId     as string,
      staffName:   doc.staffName   as string,
      role:        doc.role        as string,
      date:        doc.date        as string,
      startTime:   doc.startTime   as string,
      endTime:     doc.endTime     as string,
      notes:       doc.notes       as string | undefined,
      createdAt:   doc.createdAt   as Date,
      updatedAt:   doc.updatedAt   as Date,
      createdBy:   doc.createdBy   as string,
      updatedBy:   doc.updatedBy   as string,
    };
  }
}
