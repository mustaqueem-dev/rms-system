// apps/inventory-service/src/inventory/application/use-cases/create-inventory-item.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { TenantContext, EVENT_PUBLISHER, IEventPublisher, ConflictError, BusinessRuleViolationError } from '@rms/shared-kernel';
import { InventoryItem } from '../../domain/inventory-item.entity';
import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY } from '../../domain/repositories/inventory-item.repository.interface';
import { CreateInventoryItemDto } from '../dtos/create-inventory-item.dto';

@Injectable()
export class CreateInventoryItemUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly repo: IInventoryItemRepository,
    @Inject(EVENT_PUBLISHER)           private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateInventoryItemDto, tenant: TenantContext): Promise<string> {
    const duplicate = await this.repo.findBySku(dto.sku, tenant.branchId);
    if (duplicate) throw new ConflictError(`SKU ${dto.sku} already exists for this branch`);

    const result = InventoryItem.create({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      name:        dto.name,
      description: dto.description,
      sku:         dto.sku,
      stock:       { quantity: dto.initialQuantity, unit: dto.unit },
      reorderRule: { reorderLevel: dto.reorderLevel, reorderQuantity: dto.reorderQuantity },
      createdBy:   tenant.userId,
    });

    if (result.isFailure) throw new BusinessRuleViolationError(result.error);
    const item = result.value;

    await this.repo.save(item);
    await this.eventPublisher.publishAll(item.domainEvents);
    item.clearDomainEvents();

    return item.id;
  }
}
