// apps/inventory-service/src/inventory/application/use-cases/update-reorder-rule.use-case.ts

import { Inject, Injectable }   from '@nestjs/common';
import { IsInt, Min }           from 'class-validator';
import { NotFoundError, TenantContext } from '@rms/shared-kernel';
import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY } from '../../domain/repositories/inventory-item.repository.interface';

export class UpdateReorderRuleDto {
  @IsInt() @Min(0)
  reorderLevel!: number;

  @IsInt() @Min(1)
  reorderQuantity!: number;
}

@Injectable()
export class UpdateReorderRuleUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY)
    private readonly repo: IInventoryItemRepository,
  ) {}

  async execute(id: string, dto: UpdateReorderRuleDto, tenant: TenantContext): Promise<void> {
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new NotFoundError('InventoryItem', id);

    const result = item.updateReorderRule(
      { reorderLevel: dto.reorderLevel, reorderQuantity: dto.reorderQuantity },
      tenant.userId,
    );
    if (result.isFailure) throw new Error(result.error);

    await this.repo.update(item);
  }
}
