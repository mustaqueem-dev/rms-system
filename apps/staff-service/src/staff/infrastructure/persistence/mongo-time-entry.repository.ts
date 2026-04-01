// apps/staff-service/src/staff/infrastructure/persistence/mongo-time-entry.repository.ts

import { Injectable }  from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model }       from 'mongoose';
import { TimeEntry, TimeEntryProps } from '../../domain/time-entry.entity';
import { ITimeEntryRepository, TimeEntryFilter } from '../../domain/repositories/time-entry.repository.interface';
import { TimeEntryModel, TimeEntryDocument }      from './time-entry.schema';

@Injectable()
export class MongoTimeEntryRepository implements ITimeEntryRepository {
  constructor(@InjectModel(TimeEntryModel.name) private readonly model: Model<TimeEntryDocument>) {}

  async findById(id: string, branchId: string): Promise<TimeEntry | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? TimeEntry.reconstitute(this.toProps(doc), doc._id as string) : null;
  }

  async findActive(staffId: string, branchId: string): Promise<TimeEntry | null> {
    const doc = await this.model.findOne({ staffId, branchId, clockOutAt: null }).lean().exec();
    return doc ? TimeEntry.reconstitute(this.toProps(doc), doc._id as string) : null;
  }

  async findAll(filter: TimeEntryFilter): Promise<TimeEntry[]> {
    const q: Record<string, unknown> = { branchId: filter.branchId };
    if (filter.staffId)  q['staffId'] = filter.staffId;
    if (filter.activeOnly) q['clockOutAt'] = null;
    if (filter.fromDate || filter.toDate) {
      q['clockInAt'] = {};
      if (filter.fromDate) (q['clockInAt'] as Record<string, unknown>)['$gte'] = filter.fromDate;
      if (filter.toDate)   (q['clockInAt'] as Record<string, unknown>)['$lte'] = filter.toDate;
    }
    const docs = await this.model.find(q).sort({ clockInAt: -1 }).lean().exec();
    return docs.map((d) => TimeEntry.reconstitute(this.toProps(d), d._id as string));
  }

  async save(entry: TimeEntry): Promise<void> {
    await this.model.create({
      _id: entry.id, branchId: entry.branchId, franchiseId: entry.franchiseId,
      staffId: entry.staffId, shiftSlotId: entry.shiftSlotId,
      clockInAt: entry.clockInAt, clockOutAt: entry.clockOutAt,
      totalMinutes: entry.totalMinutes, notes: entry.notes, createdAt: entry.createdAt,
    });
  }

  async update(entry: TimeEntry): Promise<void> {
    await this.model.updateOne({ _id: entry.id }, { $set: {
      clockOutAt: entry.clockOutAt, totalMinutes: entry.totalMinutes, notes: entry.notes,
    }}).exec();
  }

  private toProps(doc: Record<string, unknown>): TimeEntryProps {
    return {
      branchId:     doc.branchId     as string,
      franchiseId:  doc.franchiseId  as string,
      staffId:      doc.staffId      as string,
      shiftSlotId:  doc.shiftSlotId  as string | undefined,
      clockInAt:    doc.clockInAt    as Date,
      clockOutAt:   doc.clockOutAt   as Date | undefined,
      totalMinutes: doc.totalMinutes as number | undefined,
      notes:        doc.notes        as string | undefined,
      createdAt:    doc.createdAt    as Date,
    };
  }
}
