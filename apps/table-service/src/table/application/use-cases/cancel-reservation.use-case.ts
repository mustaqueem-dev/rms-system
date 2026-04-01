// apps/table-service/src/table/application/use-cases/cancel-reservation.use-case.ts
import { Inject, Injectable }                              from '@nestjs/common';
import { IsOptional, IsString }                           from 'class-validator';
import { TenantContext, NotFoundError, BusinessRuleViolationError, EVENT_PUBLISHER, IEventPublisher } from '@rms/shared-kernel';
import { IReservationRepository, RESERVATION_REPOSITORY } from '../../domain/repositories/reservation.repository.interface';

export class CancelReservationDto {
  @IsOptional() @IsString() reason?: string;
}

@Injectable()
export class CancelReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY) private readonly repo: IReservationRepository,
    @Inject(EVENT_PUBLISHER)        private readonly ep:   IEventPublisher,
  ) {}

  async execute(id: string, dto: CancelReservationDto, tenant: TenantContext): Promise<void> {
    const res = await this.repo.findById(id, tenant.branchId);
    if (!res) throw new NotFoundError('Reservation', id);

    const result = res.cancel(dto.reason ?? 'Cancelled by staff', tenant.userId);
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.update(res);
    await this.ep.publishAll(res.domainEvents);
    res.clearDomainEvents();
  }
}
