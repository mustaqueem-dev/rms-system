// apps/table-service/src/table/infrastructure/persistence/mongo-reservation.repository.ts

import { Injectable }  from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model }       from 'mongoose';
import { Reservation, ReservationStatus, ReservationProps } from '../../domain/reservation.entity';
import { IReservationRepository, ReservationFilter }         from '../../domain/repositories/reservation.repository.interface';
import { ReservationModel, ReservationDocument }             from './reservation.schema';

@Injectable()
export class MongoReservationRepository implements IReservationRepository {
  constructor(
    @InjectModel(ReservationModel.name)
    private readonly model: Model<ReservationDocument>,
  ) {}

  async findById(id: string, branchId: string): Promise<Reservation | null> {
    const doc = await this.model.findOne({ _id: id, branchId }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter: ReservationFilter): Promise<Reservation[]> {
    const query: Record<string, unknown> = {
      branchId:    filter.branchId,
      franchiseId: filter.franchiseId,
    };
    if (filter.tableId)  query['tableId']  = filter.tableId;
    if (filter.status)   query['status']   = filter.status;
    if (filter.fromDate || filter.toDate) {
      query['scheduledAt'] = {};
      if (filter.fromDate) (query['scheduledAt'] as Record<string, unknown>)['$gte'] = filter.fromDate;
      if (filter.toDate)   (query['scheduledAt'] as Record<string, unknown>)['$lte'] = filter.toDate;
    }
    const docs = await this.model.find(query).sort({ scheduledAt: 1 }).lean().exec();
    return docs.map((d) => this.toDomain(d));
  }

  async save(reservation: Reservation): Promise<void> {
    await this.model.create(this.toDoc(reservation));
  }

  async update(reservation: Reservation): Promise<void> {
    await this.model.updateOne({ _id: reservation.id }, { $set: this.toDoc(reservation) }).exec();
  }

  private toDoc(r: Reservation): Record<string, unknown> {
    return {
      _id:         r.id,
      branchId:    r.branchId,
      franchiseId: r.franchiseId,
      tableId:     r.tableId,
      tableNumber: r.tableNumber,
      guestName:   r.guestName,
      guestPhone:  r.guestPhone,
      partySize:   r.partySize,
      scheduledAt: r.scheduledAt,
      status:      r.status,
      notes:       r.notes,
      createdAt:   r.createdAt,
      updatedAt:   r.updatedAt,
    };
  }

  private toDomain(doc: Record<string, unknown>): Reservation {
    return Reservation.reconstitute(
      {
        branchId:    doc.branchId    as string,
        franchiseId: doc.franchiseId as string,
        tableId:     doc.tableId     as string,
        tableNumber: doc.tableNumber  as number,
        guestName:   doc.guestName   as string,
        guestPhone:  doc.guestPhone  as string,
        partySize:   doc.partySize   as number,
        scheduledAt: doc.scheduledAt as Date,
        status:      doc.status      as ReservationStatus,
        notes:       doc.notes       as string | undefined,
        createdAt:   doc.createdAt   as Date,
        updatedAt:   doc.updatedAt   as Date,
        createdBy:   (doc.createdBy  as string) ?? 'system',
        updatedBy:   (doc.updatedBy  as string) ?? 'system',
      },
      doc._id as string,
    );
  }
}
