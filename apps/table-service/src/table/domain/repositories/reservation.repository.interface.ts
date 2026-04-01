// apps/table-service/src/table/domain/repositories/reservation.repository.interface.ts

import { Reservation, ReservationStatus } from '../reservation.entity';

export const RESERVATION_REPOSITORY = Symbol('IReservationRepository');

export interface ReservationFilter {
  branchId:    string;
  franchiseId: string;
  tableId?:    string;
  status?:     ReservationStatus;
  fromDate?:   Date;
  toDate?:     Date;
}

export interface IReservationRepository {
  findById(id: string, branchId: string): Promise<Reservation | null>;
  findAll(filter: ReservationFilter): Promise<Reservation[]>;
  save(reservation: Reservation): Promise<void>;
  update(reservation: Reservation): Promise<void>;
}
