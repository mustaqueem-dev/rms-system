// apps/table-service/src/table/application/use-cases/save-layout.use-case.ts
import { Inject, Injectable }                 from '@nestjs/common';
import { IsNumber }                           from 'class-validator';
import { TenantContext, NotFoundError, EVENT_PUBLISHER, IEventPublisher } from '@rms/shared-kernel';
import { ITableRepository, TABLE_REPOSITORY } from '../../domain/repositories/table.repository.interface';

export class SaveLayoutDto {
  @IsNumber() x!: number;
  @IsNumber() y!: number;
}

@Injectable()
export class SaveLayoutUseCase {
  constructor(
    @Inject(TABLE_REPOSITORY) private readonly repo: ITableRepository,
    @Inject(EVENT_PUBLISHER)  private readonly ep:   IEventPublisher,
  ) {}

  async execute(id: string, dto: SaveLayoutDto, tenant: TenantContext): Promise<void> {
    const table = await this.repo.findById(id, tenant.branchId);
    if (!table) throw new NotFoundError('Table', id);

    table.saveLayout({ x: dto.x, y: dto.y }, tenant.userId);
    await this.repo.update(table);
    await this.ep.publishAll(table.domainEvents);
    table.clearDomainEvents();
  }
}
