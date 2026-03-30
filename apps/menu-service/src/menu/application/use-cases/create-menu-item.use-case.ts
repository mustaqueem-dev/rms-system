// apps/menu-service/src/menu/application/use-cases/create-menu-item.use-case.ts

import { Inject, Injectable }         from '@nestjs/common';
import {
  ValidationError,
  ConflictError,
  BusinessRuleViolationError,
  IEventPublisher,
  EVENT_PUBLISHER,
  TenantContext,
} from '@rms/shared-kernel';
import { MenuItem }        from '../../domain/menu-item.entity';
import { Price }           from '../../domain/value-objects/price.vo';
import { Tag }             from '../../domain/value-objects/tag.vo';
import { Result }          from '@rms/shared-kernel';
import { MENU_ITEM_REPOSITORY, IMenuItemRepository } from '../../domain/repositories/menu-item.repository.interface';
import { CreateMenuItemDto } from '../dtos/create-menu-item.dto';

@Injectable()
export class CreateMenuItemUseCase {
  constructor(
    @Inject(MENU_ITEM_REPOSITORY) private readonly repo:           IMenuItemRepository,
    @Inject(EVENT_PUBLISHER)      private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateMenuItemDto, tenant: TenantContext): Promise<string> {
    // 1. Build Price VO
    const priceResult = Price.create(dto.priceAmount, dto.priceCurrency, dto.priceTaxRate ?? 0);
    if (priceResult.isFailure) throw new ValidationError(priceResult.error);

    // 2. Build Tag VOs
    const tagResults  = dto.tags.map(t => Tag.create(t));
    const tagCombined = Result.combine(tagResults);
    if (tagCombined.isFailure) throw new ValidationError(tagCombined.error);

    // 3. Duplicate name check (within same category+branch)
    const duplicate = await this.repo.existsByName(dto.name, tenant.branchId, dto.categoryId);
    if (duplicate) throw new ConflictError(`Menu item '${dto.name}' already exists in this category`);

    // 4. Create aggregate
    const itemResult = MenuItem.create({
      branchId:               tenant.branchId,
      franchiseId:            tenant.franchiseId,
      categoryId:             dto.categoryId,
      name:                   dto.name,
      description:            dto.description,
      price:                  priceResult.value,
      preparationTimeMinutes: dto.preparationTimeMinutes,
      tags:                   tagCombined.value,
      imageUrl:               dto.imageUrl,
      sortOrder:              dto.sortOrder ?? 0,
      createdBy:              tenant.userId,
      updatedBy:              tenant.userId,
    });
    if (itemResult.isFailure) throw new BusinessRuleViolationError(itemResult.error);

    const item = itemResult.value;

    // 5. Persist + publish events
    await this.repo.save(item);
    await this.eventPublisher.publishAll(item.domainEvents);
    item.clearDomainEvents();

    return item.id;
  }
}
