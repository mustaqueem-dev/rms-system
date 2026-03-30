// apps/menu-service/src/menu/application/use-cases/delete-menu-item.use-case.ts

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
export class DeleteMenuItemUseCase {
  constructor(
    @Inject(MENU_ITEM_REPOSITORY) private readonly repo:           IMenuItemRepository,
    @Inject(EVENT_PUBLISHER)      private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, tenant: TenantContext): Promise<void> {
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new NotFoundError('MenuItem', id);
    if (item.franchiseId !== tenant.franchiseId) throw new ForbiddenError();

    item.markDeleted(tenant.userId);

    await this.repo.delete(id, tenant.branchId);
    await this.eventPublisher.publishAll(item.domainEvents);
    item.clearDomainEvents();
  }
}
