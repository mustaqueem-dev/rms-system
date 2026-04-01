// apps/inventory-service/src/inventory/application/use-cases/deduct-stock.use-case.ts
//
// Triggered by Kafka `order.placed` event — deducts ordered quantities from inventory
// and records a StockAdjustment audit entry per item.

import { Inject, Injectable }   from '@nestjs/common';
import {
  IEventPublisher,
  EVENT_PUBLISHER,
} from '@rms/shared-kernel';
import { InventoryItem }                    from '../../domain/inventory-item.entity';
import { StockAdjustment }                  from '../../domain/stock-adjustment.entity';
import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY }     from '../../domain/repositories/inventory-item.repository.interface';
import { IStockAdjustmentRepository, STOCK_ADJUSTMENT_REPOSITORY } from '../../domain/repositories/stock-adjustment.repository.interface';

export interface DeductStockItem {
  menuItemId: string;  // used as sku lookup key
  quantity:   number;
}

export interface DeductStockCommand {
  orderId:     string;
  branchId:    string;
  franchiseId: string;
  items:       DeductStockItem[];
}

export interface DeductStockResult {
  deducted: DeductStockItem[];
  failed:   Array<{ menuItemId: string; reason: string }>;
}

@Injectable()
export class DeductStockUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY)
    private readonly itemRepo: IInventoryItemRepository,
    @Inject(STOCK_ADJUSTMENT_REPOSITORY)
    private readonly adjRepo: IStockAdjustmentRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(cmd: DeductStockCommand): Promise<DeductStockResult> {
    const deducted: DeductStockItem[] = [];
    const failed:   Array<{ menuItemId: string; reason: string }> = [];

    await Promise.all(
      cmd.items.map(async (orderItem) => {
        try {
          // Look up inventory item by SKU (menuItemId is used as SKU)
          const invItem = await this.itemRepo.findBySku(orderItem.menuItemId, cmd.branchId);
          if (!invItem) {
            failed.push({ menuItemId: orderItem.menuItemId, reason: 'Inventory item not found' });
            return;
          }

          const quantityBefore = invItem.stock.quantity;
          const result = invItem.adjustStock(-orderItem.quantity, 'SYSTEM');
          if (result.isFailure) {
            failed.push({ menuItemId: orderItem.menuItemId, reason: result.error });
            return;
          }

          // Persist updated item
          await this.itemRepo.update(invItem);

          // Record audit trail
          const adjResult = StockAdjustment.create({
            inventoryItemId: invItem.id,
            branchId:        cmd.branchId,
            franchiseId:     cmd.franchiseId,
            delta:           -orderItem.quantity,
            quantityBefore,
            quantityAfter:   invItem.stock.quantity,
            reason:          'ORDER_DEDUCTION',
            reference:       cmd.orderId,
            performedBy:     'system',
          });
          if (adjResult.isSuccess) {
            await this.adjRepo.save(adjResult.value);
          }

          // Publish domain events (LowStockAlertEvent, StockDepletedEvent, etc.)
          await this.eventPublisher.publishAll(invItem.domainEvents);
          invItem.clearDomainEvents();

          deducted.push(orderItem);
        } catch (err) {
          failed.push({ menuItemId: orderItem.menuItemId, reason: (err as Error).message });
        }
      }),
    );

    return { deducted, failed };
  }
}
