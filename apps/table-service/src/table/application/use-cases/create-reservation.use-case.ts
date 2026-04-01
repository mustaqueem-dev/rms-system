// apps/table-service/src/table/application/use-cases/create-reservation.use-case.ts
import { Inject, Injectable }                                from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, IsString, Min }   from 'class-validator';
import { TenantContext, NotFoundError, BusinessRuleViolationError, EVENT_PUBLISHER, IEventPublisher } from '@rms/shared-kernel';
import { Reservation }                                       from '../../domain/reservation.entity';
import { ITableRepository, TABLE_REPOSITORY }                from '../../domain/repositories/table.repository.interface';
import { IReservationRepository, RESERVATION_REPOSITORY }   from '../../domain/repositories/reservation.repository.interface';

export class CreateReservationDto {
  @IsInt() @Min(1)     tableNumber!: number;
  @IsString()          guestName!:   string;
  @IsString()          guestPhone!:  string;
  @IsInt() @Min(1)     partySize!:   number;
  @IsDateString()      scheduledAt!: string;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class CreateReservationUseCase {
  constructor(
    @Inject(TABLE_REPOSITORY)       private readonly tableRepo: ITableRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly resRepo:   IReservationRepository,
    @Inject(EVENT_PUBLISHER)        private readonly ep:        IEventPublisher,
  ) {}

  async execute(dto: CreateReservationDto, tenant: TenantContext): Promise<string> {
    const table = await this.tableRepo.findByNumber(dto.tableNumber, tenant.branchId);
    if (!table) throw new NotFoundError('Table', `number ${dto.tableNumber}`);

    const result = Reservation.create({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      tableId:     table.id,
      tableNumber: dto.tableNumber,
      guestName:   dto.guestName,
      guestPhone:  dto.guestPhone,
      partySize:   dto.partySize,
      scheduledAt: new Date(dto.scheduledAt),
      notes:       dto.notes,
      createdBy:   tenant.userId,
    });
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.resRepo.save(result.value);
    await this.ep.publishAll(result.value.domainEvents);
    result.value.clearDomainEvents();

    return result.value.id;
  }
}
