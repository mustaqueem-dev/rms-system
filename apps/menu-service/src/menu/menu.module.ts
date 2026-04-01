// apps/menu-service/src/menu/menu.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

// ── Schemas ──────────────────────────────────────────────────────────────────
import { MenuItemModel, MenuItemSchema }  from './infrastructure/persistence/menu-item.schema';
import { CategoryModel, CategorySchema }  from './infrastructure/persistence/category.schema';

// ── Repositories ──────────────────────────────────────────────────────────────
import { MongoMenuItemRepository }        from './infrastructure/persistence/mongo-menu-item.repository';
import { MongoCategoryRepository }        from './infrastructure/persistence/mongo-category.repository';
import { MENU_ITEM_REPOSITORY }           from './domain/repositories/menu-item.repository.interface';
import { CATEGORY_REPOSITORY }            from './domain/repositories/category.repository.interface';

// ── Cache ──────────────────────────────────────────────────────────────────────
import { MenuCacheService }               from './infrastructure/cache/menu-cache.service';

// ── MenuItem use cases ────────────────────────────────────────────────────────
import { CreateMenuItemUseCase }          from './application/use-cases/create-menu-item.use-case';
import { UpdateMenuItemUseCase }          from './application/use-cases/update-menu-item.use-case';
import { DeleteMenuItemUseCase }          from './application/use-cases/delete-menu-item.use-case';
import { ToggleAvailabilityUseCase }      from './application/use-cases/toggle-availability.use-case';
import { BulkUpdateUseCase }             from './application/use-cases/bulk-update.use-case';

// ── Category use cases ────────────────────────────────────────────────────────
import { CreateCategoryUseCase }          from './application/use-cases/category/create-category.use-case';
import { UpdateCategoryUseCase }          from './application/use-cases/category/update-category.use-case';
import { DeleteCategoryUseCase }          from './application/use-cases/category/delete-category.use-case';

// ── Controllers ───────────────────────────────────────────────────────────────
import { MenuItemController }             from './presentation/menu-item.controller';
import { CategoryController }             from './presentation/category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MenuItemModel.name, schema: MenuItemSchema },
      { name: CategoryModel.name, schema: CategorySchema },
    ]),

    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '15m' }, // access token (SRS NFR-S04)
      }),
    }),
  ],
  controllers: [MenuItemController, CategoryController],
  providers: [
    // Repositories
    { provide: MENU_ITEM_REPOSITORY, useClass: MongoMenuItemRepository },
    { provide: CATEGORY_REPOSITORY,  useClass: MongoCategoryRepository  },

    // Event publisher (swap to KafkaEventPublisher when messaging is wired)
    { provide: EVENT_PUBLISHER, useClass: InMemoryEventPublisher },

    // Cache
    MenuCacheService,

    // MenuItem use cases
    CreateMenuItemUseCase,
    UpdateMenuItemUseCase,
    DeleteMenuItemUseCase,
    ToggleAvailabilityUseCase,
    BulkUpdateUseCase,

    // Category use cases
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
})
export class MenuModule {}
