// apps/menu-service/src/menu/application/use-cases/bulk-update.use-case.ts
//
// Activates or deactivates multiple menu items at once (bulk availability toggle).

import { Inject, Injectable }    from '@nestjs/common';
import { IsArray, IsBoolean, IsUUID } from 'class-validator';
import {
  IEventPublisher,
  EVENT_PUBLISHER,
  TenantContext,
  NotFoundError,
} from '@rms/shared-kernel';
import { IMenuItemRepository, MENU_ITEM_REPOSITORY } from '../../domain/repositories/menu-item.repository.interface';

export class BulkUpdateDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsBoolean()
  isAvailable!: boolean;
}

export interface BulkUpdateResult {
  updated: number;
  failed:  Array<{ id: string; reason: string }>;
}

@Injectable()
export class BulkUpdateUseCase {
  constructor(
    @Inject(MENU_ITEM_REPOSITORY) private readonly itemRepo:        IMenuItemRepository,
    @Inject(EVENT_PUBLISHER)      private readonly eventPublisher:  IEventPublisher,
  ) {}

  async execute(dto: BulkUpdateDto, tenant: TenantContext): Promise<BulkUpdateResult> {
    let updated = 0;
    const failed: Array<{ id: string; reason: string }> = [];

    await Promise.all(
      dto.ids.map(async (id) => {
        try {
          const item = await this.itemRepo.findById(id, tenant.branchId);
          if (!item) {
            failed.push({ id, reason: 'Not found' });
            return;
          }
          // Only toggle if state actually needs to change
          if (item.isAvailable !== dto.isAvailable) {
            item.toggleAvailability(tenant.userId);
            await this.itemRepo.update(item);
            await this.eventPublisher.publishAll(item.domainEvents);
            item.clearDomainEvents();
          }
          updated += 1;
        } catch (err) {
          failed.push({ id, reason: (err as Error).message });
        }
      }),
    );

    return { updated, failed };
  }
}
