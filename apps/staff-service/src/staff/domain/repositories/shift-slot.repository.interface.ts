// apps/staff-service/src/staff/domain/repositories/shift-slot.repository.interface.ts

import { ShiftSlot } from '../shift-slot.entity';

export const SHIFT_SLOT_REPOSITORY = Symbol('IShiftSlotRepository');

export interface ShiftSlotFilter {
  branchId:    string;
  franchiseId: string;
  staffId?:    string;
  date?:       string;   // exact date "YYYY-MM-DD"
  fromDate?:   string;
  toDate?:     string;
}

export interface IShiftSlotRepository {
  findById(id: string, branchId: string): Promise<ShiftSlot | null>;
  findAll(filter: ShiftSlotFilter): Promise<ShiftSlot[]>;
  save(slot: ShiftSlot): Promise<void>;
  delete(id: string, branchId: string): Promise<void>;
}
