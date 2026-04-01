// apps/staff-service/src/staff/application/use-cases/clock-out.use-case.ts

import { Inject, Injectable }        from '@nestjs/common';
import { IsOptional, IsString }      from 'class-validator';
import { TenantContext, NotFoundError, BusinessRuleViolationError, EVENT_PUBLISHER, IEventPublisher } from '@rms/shared-kernel';
import { ShiftEndedEvent }           from '../../domain/shift-slot.entity';
import { ITimeEntryRepository, TIME_ENTRY_REPOSITORY } from '../../domain/repositories/time-entry.repository.interface';

export class ClockOutDto {
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class ClockOutUseCase {
  constructor(
    @Inject(TIME_ENTRY_REPOSITORY) private readonly repo: ITimeEntryRepository,
    @Inject(EVENT_PUBLISHER)       private readonly ep:   IEventPublisher,
  ) {}

  async execute(dto: ClockOutDto, tenant: TenantContext): Promise<{ totalMinutes: number }> {
    const entry = await this.repo.findActive(tenant.userId, tenant.branchId);
    if (!entry) throw new NotFoundError('Active time entry', 'no active clock-in found');

    const result = entry.clockOut(dto.notes);
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.update(entry);

    // Emit shift ended event if linked to a shift slot
    if (entry.shiftSlotId && entry.totalMinutes !== undefined) {
      await this.ep.publish(
        new ShiftEndedEvent(entry.shiftSlotId, entry.branchId, entry.staffId, entry.totalMinutes),
      );
    }

    return { totalMinutes: entry.totalMinutes ?? 0 };
  }
}
