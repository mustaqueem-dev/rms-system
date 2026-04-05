// apps/table-service/src/table/application/use-cases/create-table.use-case.ts
import { Inject, Injectable }               from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TenantContext, BusinessRuleViolationError, EVENT_PUBLISHER, IEventPublisher, ConflictError } from '@rms/shared-kernel';
import { Table }                             from '../../domain/table.entity';
import { ITableRepository, TABLE_REPOSITORY } from '../../domain/repositories/table.repository.interface';

export class CreateTableDto {
  @IsInt() @Min(1) tableNumber!: number;
  @IsInt() @Min(1) capacity!: number;
  @IsOptional() @IsString() section?: string;
}

@Injectable()
export class CreateTableUseCase {
  constructor(
    @Inject(TABLE_REPOSITORY) private readonly repo: ITableRepository,
    @Inject(EVENT_PUBLISHER)  private readonly ep:   IEventPublisher,
  ) {}

  async execute(dto: CreateTableDto, tenant: TenantContext): Promise<string> {
    const existing = await this.repo.findByNumber(dto.tableNumber, tenant.branchId);
    if (existing) throw new Error(`Table number ${dto.tableNumber} already exists in this branch`);

    const result = Table.create({ branchId: tenant.branchId, franchiseId: tenant.franchiseId, tableNumber: dto.tableNumber, capacity: dto.capacity, section: dto.section, createdBy: tenant.userId });
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.save(result.value);
    await this.ep.publishAll(result.value.domainEvents);
    result.value.clearDomainEvents();
    
    return result.value.id;
  }
}
