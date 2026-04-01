// apps/staff-service/src/staff/application/use-cases/schedule-shift.use-case.ts

import { Inject, Injectable }                  from '@nestjs/common';
import { IsDateString, IsString }              from 'class-validator';
import { TenantContext, BusinessRuleViolationError, EVENT_PUBLISHER, IEventPublisher } from '@rms/shared-kernel';
import { ShiftSlot }                           from '../../domain/shift-slot.entity';
import { IShiftSlotRepository, SHIFT_SLOT_REPOSITORY } from '../../domain/repositories/shift-slot.repository.interface';

export class ScheduleShiftDto {
  @IsString()     staffId!:   string;
  @IsString()     staffName!: string;
  @IsString()     role!:      string;
  @IsDateString() date!:      string;   // "YYYY-MM-DD"
  @IsString()     startTime!: string;   // "HH:mm"
  @IsString()     endTime!:   string;   // "HH:mm"
}

@Injectable()
export class ScheduleShiftUseCase {
  constructor(
    @Inject(SHIFT_SLOT_REPOSITORY) private readonly repo: IShiftSlotRepository,
    @Inject(EVENT_PUBLISHER)       private readonly ep:   IEventPublisher,
  ) {}

  async execute(dto: ScheduleShiftDto, tenant: TenantContext): Promise<string> {
    const result = ShiftSlot.create({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      staffId:     dto.staffId,
      staffName:   dto.staffName,
      role:        dto.role,
      date:        dto.date,
      startTime:   dto.startTime,
      endTime:     dto.endTime,
      createdBy:   tenant.userId,
    });
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.save(result.value);
    await this.ep.publishAll(result.value.domainEvents);
    result.value.clearDomainEvents();
    return result.value.id;
  }
}
