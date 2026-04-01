// apps/staff-service/src/staff/application/use-cases/clock-in.use-case.ts

import { Inject, Injectable }        from '@nestjs/common';
import { IsOptional, IsString }      from 'class-validator';
import { TenantContext, BusinessRuleViolationError } from '@rms/shared-kernel';
import { TimeEntry }                 from '../../domain/time-entry.entity';
import { ITimeEntryRepository, TIME_ENTRY_REPOSITORY } from '../../domain/repositories/time-entry.repository.interface';

export class ClockInDto {
  @IsOptional() @IsString() shiftSlotId?: string;
  @IsOptional() @IsString() notes?:       string;
}

@Injectable()
export class ClockInUseCase {
  constructor(
    @Inject(TIME_ENTRY_REPOSITORY) private readonly repo: ITimeEntryRepository,
  ) {}

  async execute(dto: ClockInDto, tenant: TenantContext): Promise<string> {
    // Guard: no duplicate open session
    const existing = await this.repo.findActive(tenant.userId, tenant.branchId);
    if (existing) throw new BusinessRuleViolationError('Staff member is already clocked in');

    const result = TimeEntry.clockIn({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      staffId:     tenant.userId,
      shiftSlotId: dto.shiftSlotId,
      notes:       dto.notes,
    });
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.save(result.value);
    return result.value.id;
  }
}
