// apps/table-service/src/table/application/use-cases/update-table-status.use-case.ts
import { Inject, Injectable }                 from '@nestjs/common';
import { IsEnum, IsString, IsOptional }       from 'class-validator';
import { TenantContext, NotFoundError, BusinessRuleViolationError, EVENT_PUBLISHER, IEventPublisher } from '@rms/shared-kernel';
import { TableStatus }                        from '../../domain/table.entity';
import { ITableRepository, TABLE_REPOSITORY } from '../../domain/repositories/table.repository.interface';

export class UpdateTableStatusDto {
  @IsEnum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'])
  status!: TableStatus;
}

@Injectable()
export class UpdateTableStatusUseCase {
  constructor(
    @Inject(TABLE_REPOSITORY) private readonly repo: ITableRepository,
    @Inject(EVENT_PUBLISHER)  private readonly ep:   IEventPublisher,
  ) {}

  async execute(id: string, dto: UpdateTableStatusDto, tenant: TenantContext): Promise<void> {
    const table = await this.repo.findById(id, tenant.branchId);
    if (!table) throw new NotFoundError('Table', id);

    const result = table.changeStatus(dto.status, tenant.userId);
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.update(table);
    await this.ep.publishAll(table.domainEvents);
    table.clearDomainEvents();
  }
}
