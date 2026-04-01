// apps/inventory-service/src/inventory/inventory.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

// ── Schemas ───────────────────────────────────────────────────────────────────
import { InventoryItemModel, InventoryItemSchema }        from './infrastructure/persistence/inventory-item.schema';
import { StockAdjustmentModel, StockAdjustmentSchema }   from './infrastructure/persistence/stock-adjustment.schema';

// ── Repositories ──────────────────────────────────────────────────────────────
import { MongoInventoryItemRepository }       from './infrastructure/persistence/mongo-inventory-item.repository';
import { MongoStockAdjustmentRepository }     from './infrastructure/persistence/mongo-stock-adjustment.repository';
import { INVENTORY_ITEM_REPOSITORY }          from './domain/repositories/inventory-item.repository.interface';
import { STOCK_ADJUSTMENT_REPOSITORY }        from './domain/repositories/stock-adjustment.repository.interface';

// ── Kafka consumers ───────────────────────────────────────────────────────────
import { OrderPlacedConsumer }                from './infrastructure/kafka/order-placed.consumer';

// ── Use cases ─────────────────────────────────────────────────────────────────
import { CreateInventoryItemUseCase }         from './application/use-cases/create-inventory-item.use-case';
import { AdjustStockUseCase }                 from './application/use-cases/adjust-stock.use-case';
import { DeductStockUseCase }                 from './application/use-cases/deduct-stock.use-case';
import { ListLowStockUseCase }               from './application/use-cases/list-low-stock.use-case';
import { UpdateReorderRuleUseCase }           from './application/use-cases/update-reorder-rule.use-case';

// ── Controllers ───────────────────────────────────────────────────────────────
import { InventoryController }               from './presentation/inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItemModel.name,    schema: InventoryItemSchema    },
      { name: StockAdjustmentModel.name,  schema: StockAdjustmentSchema  },
    ]),
    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '15m' }, // SRS NFR-S04
      }),
    }),
  ],
  controllers: [InventoryController, OrderPlacedConsumer],
  providers: [
    // Repositories
    { provide: INVENTORY_ITEM_REPOSITORY,   useClass: MongoInventoryItemRepository    },
    { provide: STOCK_ADJUSTMENT_REPOSITORY, useClass: MongoStockAdjustmentRepository  },

    // Event publisher
    { provide: EVENT_PUBLISHER, useClass: InMemoryEventPublisher },

    // Use cases
    CreateInventoryItemUseCase,
    AdjustStockUseCase,
    DeductStockUseCase,
    ListLowStockUseCase,
    UpdateReorderRuleUseCase,
  ],
})
export class InventoryModule {}
