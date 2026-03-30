// apps/menu-service/src/menu/application/use-cases/update-menu-item.use-case.ts

import { Inject, Injectable }       from '@nestjs/common';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  BusinessRuleViolationError,
  IEventPublisher,
  EVENT_PUBLISHER,
  TenantContext,
} from '@rms/shared-kernel';
import { Price }  from '../../domain/value-objects/price.vo';
import { Tag }    from '../../domain/value-objects/tag.vo';
import { Result } from '@rms/shared-kernel';
import { MENU_ITEM_REPOSITORY, IMenuItemRepository } from '../../domain/repositories/menu-item.repository.interface';
import { UpdateMenuItemDto } from '../dtos/update-menu-item.dto';

@Injectable()
export class UpdateMenuItemUseCase {
  constructor(
    @Inject(MENU_ITEM_REPOSITORY) private readonly repo:           IMenuItemRepository,
    @Inject(EVENT_PUBLISHER)      private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, dto: UpdateMenuItemDto, tenant: TenantContext): Promise<void> {
    // 1. Load the item scoped to the tenant's branch
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new NotFoundError('MenuItem', id);

    // 2. Ownership check — tenant must belong to the same franchise
    if (item.franchiseId !== tenant.franchiseId) throw new ForbiddenError();

    // 3. Resolve partial updates
    let price: Price | undefined;
    let tags:  Tag[]  | undefined;

    if (dto.priceAmount !== undefined) {
      const r = Price.create(dto.priceAmount, dto.priceCurrency ?? item.price.currency, dto.priceTaxRate ?? item.price.taxRate);
      if (r.isFailure) throw new ValidationError(r.error);
      price = r.value;
    }

    if (dto.tags !== undefined) {
      const results  = dto.tags.map(t => Tag.create(t));
      const combined = Result.combine(results);
      if (combined.isFailure) throw new ValidationError(combined.error);
      tags = combined.value;
    }

    // 4. Delegate mutation to aggregate
    const updateResult = item.update(
      {
        name:                   dto.name,
        description:            dto.description,
        categoryId:             dto.categoryId,
        preparationTimeMinutes: dto.preparationTimeMinutes,
        imageUrl:               dto.imageUrl,
        sortOrder:              dto.sortOrder,
        price,
        tags,
      },
      tenant.userId
    );
    if (updateResult.isFailure) throw new BusinessRuleViolationError(updateResult.error);

    // 5. Persist + publish events
    await this.repo.update(item);
    await this.eventPublisher.publishAll(item.domainEvents);
    item.clearDomainEvents();
  }
}
