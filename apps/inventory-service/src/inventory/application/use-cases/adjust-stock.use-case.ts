// apps/inventory-service/src/inventory/application/use-cases/adjust-stock.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  TenantContext, EVENT_PUBLISHER, IEventPublisher, NotFoundError, ForbiddenError, BusinessRuleViolationError
} from '@rms/shared-kernel';
import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY } from '../../domain/repositories/inventory-item.repository.interface';
import { AdjustStockDto } from '../dtos/adjust-stock.dto';

@Injectable()
export class AdjustStockUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly repo: IInventoryItemRepository,
    @Inject(EVENT_PUBLISHER)           private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, dto: AdjustStockDto, tenant: TenantContext): Promise<{ previousQty: number, newQty: number }> {
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new NotFoundError('InventoryItem', id);
    if (item.franchiseId !== tenant.franchiseId) throw new ForbiddenError();

    const previousQty = item.stock.quantity;

    const adjustResult = item.adjustStock(dto.delta, tenant.userId);
    if (adjustResult.isFailure) throw new BusinessRuleViolationError(adjustResult.error);

    await this.repo.update(item);
    await this.eventPublisher.publishAll(item.domainEvents);
    item.clearDomainEvents();

    return { previousQty, newQty: item.stock.quantity };
  }
}
