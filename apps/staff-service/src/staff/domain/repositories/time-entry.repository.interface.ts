// apps/staff-service/src/staff/domain/repositories/time-entry.repository.interface.ts

import { TimeEntry } from '../time-entry.entity';

export const TIME_ENTRY_REPOSITORY = Symbol('ITimeEntryRepository');

export interface TimeEntryFilter {
  branchId:    string;
  franchiseId: string;
  staffId?:    string;
  fromDate?:   Date;
  toDate?:     Date;
  activeOnly?: boolean;  // clockOutAt is null
}

export interface ITimeEntryRepository {
  findById(id: string, branchId: string): Promise<TimeEntry | null>;
  findActive(staffId: string, branchId: string): Promise<TimeEntry | null>;
  findAll(filter: TimeEntryFilter): Promise<TimeEntry[]>;
  save(entry: TimeEntry): Promise<void>;
  update(entry: TimeEntry): Promise<void>;
}
