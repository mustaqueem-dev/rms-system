// apps/table-service/src/table/application/use-cases/update-reservation.use-case.ts
import { Inject, Injectable }                              from '@nestjs/common';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TenantContext, NotFoundError, BusinessRuleViolationError } from '@rms/shared-kernel';
import { ReservationStatus }                               from '../../domain/reservation.entity';
import { IReservationRepository, RESERVATION_REPOSITORY } from '../../domain/repositories/reservation.repository.interface';

export class UpdateReservationDto {
  @IsOptional() @IsDateString()   scheduledAt?: string;
  @IsOptional() @IsInt() @Min(1)  partySize?:   number;
  @IsOptional() @IsString()       notes?:       string;
  @IsOptional() @IsEnum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'NO_SHOW'])
  status?: ReservationStatus;
}

@Injectable()
export class UpdateReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY) private readonly repo: IReservationRepository,
  ) {}

  async execute(id: string, dto: UpdateReservationDto, tenant: TenantContext): Promise<void> {
    const res = await this.repo.findById(id, tenant.branchId);
    if (!res) throw new NotFoundError('Reservation', id);

    const result = res.update({
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      partySize:   dto.partySize,
      notes:       dto.notes,
      status:      dto.status,
    }, tenant.userId);
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.update(res);
  }
}
