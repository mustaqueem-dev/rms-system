// apps/inventory-service/src/inventory/application/use-cases/list-low-stock.use-case.ts

import { Inject, Injectable }  from '@nestjs/common';
import { TenantContext }       from '@rms/shared-kernel';
import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY } from '../../domain/repositories/inventory-item.repository.interface';

export interface LowStockItemDto {
  id:           string;
  name:         string;
  sku:          string;
  currentQty:   number;
  unit:         string;
  reorderLevel: number;
  reorderQty:   number;
  branchId:     string;
}

@Injectable()
export class ListLowStockUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY)
    private readonly repo: IInventoryItemRepository,
  ) {}

  async execute(tenant: TenantContext): Promise<LowStockItemDto[]> {
    const result = await this.repo.findAll(
      { branchId: tenant.branchId, franchiseId: tenant.franchiseId, isLowStock: true },
      { limit: 200, offset: 0 },
    );

    return result.data.map((item) => ({
      id:           item.id,
      name:         item.name,
      sku:          item.sku,
      currentQty:   item.stock.quantity,
      unit:         item.stock.unit,
      reorderLevel: item.reorderRule.reorderLevel,
      reorderQty:   item.reorderRule.reorderQuantity,
      branchId:     item.branchId,
    }));
  }
}
