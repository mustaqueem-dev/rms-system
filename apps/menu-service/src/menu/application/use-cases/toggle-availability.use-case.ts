// apps/menu-service/src/menu/application/use-cases/toggle-availability.use-case.ts

import { Inject, Injectable }      from '@nestjs/common';
import {
  NotFoundError,
  ForbiddenError,
  IEventPublisher,
  EVENT_PUBLISHER,
  TenantContext,
} from '@rms/shared-kernel';
import { MENU_ITEM_REPOSITORY, IMenuItemRepository } from '../../domain/repositories/menu-item.repository.interface';

@Injectable()
export class ToggleAvailabilityUseCase {
  constructor(
    @Inject(MENU_ITEM_REPOSITORY) private readonly repo:           IMenuItemRepository,
    @Inject(EVENT_PUBLISHER)      private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, tenant: TenantContext): Promise<boolean> {
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new NotFoundError('MenuItem', id);
    if (item.franchiseId !== tenant.franchiseId) throw new ForbiddenError();

    item.toggleAvailability(tenant.userId);

    await this.repo.update(item);
    await this.eventPublisher.publishAll(item.domainEvents);
    item.clearDomainEvents();

    return item.isAvailable;
  }
}
