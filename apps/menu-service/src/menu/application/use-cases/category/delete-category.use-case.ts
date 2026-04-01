// apps/menu-service/src/menu/application/use-cases/category/delete-category.use-case.ts

import { Inject, Injectable }  from '@nestjs/common';
import {
  IEventPublisher,
  EVENT_PUBLISHER,
  NotFoundError,
  TenantContext,
} from '@rms/shared-kernel';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../../domain/repositories/category.repository.interface';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly catRepo:        ICategoryRepository,
    @Inject(EVENT_PUBLISHER)     private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, tenant: TenantContext): Promise<void> {
    const cat = await this.catRepo.findById(id, tenant.branchId);
    if (!cat) throw new NotFoundError('Category', id);

    cat.deactivate(tenant.userId);
    await this.catRepo.update(cat);
    await this.eventPublisher.publishAll(cat.domainEvents);
    cat.clearDomainEvents();
  }
}
