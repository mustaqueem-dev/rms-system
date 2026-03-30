// apps/inventory-service/src/inventory/inventory.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

import { InventoryItemModel, InventoryItemSchema }  from './infrastructure/persistence/inventory-item.schema';
import { MongoInventoryItemRepository }             from './infrastructure/persistence/mongo-inventory-item.repository';
import { INVENTORY_ITEM_REPOSITORY }                from './domain/repositories/inventory-item.repository.interface';
import { CreateInventoryItemUseCase }               from './application/use-cases/create-inventory-item.use-case';
import { AdjustStockUseCase }                       from './application/use-cases/adjust-stock.use-case';
import { InventoryController }                      from './presentation/inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InventoryItemModel.name, schema: InventoryItemSchema }]),
    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [InventoryController],
  providers: [
    { provide: INVENTORY_ITEM_REPOSITORY, useClass: MongoInventoryItemRepository },
    { provide: EVENT_PUBLISHER,           useClass: InMemoryEventPublisher },
    CreateInventoryItemUseCase,
    AdjustStockUseCase,
  ],
})
export class InventoryModule {}
