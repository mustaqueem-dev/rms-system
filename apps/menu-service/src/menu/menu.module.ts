// apps/menu-service/src/menu/menu.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

import { MenuItemModel, MenuItemSchema }  from './infrastructure/persistence/menu-item.schema';
import { MongoMenuItemRepository }        from './infrastructure/persistence/mongo-menu-item.repository';
import { MENU_ITEM_REPOSITORY }           from './domain/repositories/menu-item.repository.interface';
import { CreateMenuItemUseCase }          from './application/use-cases/create-menu-item.use-case';
import { UpdateMenuItemUseCase }          from './application/use-cases/update-menu-item.use-case';
import { DeleteMenuItemUseCase }          from './application/use-cases/delete-menu-item.use-case';
import { ToggleAvailabilityUseCase }      from './application/use-cases/toggle-availability.use-case';
import { MenuItemController }             from './presentation/menu-item.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MenuItemModel.name, schema: MenuItemSchema }]),

    // JWT module — validates tokens in JwtAuthGuard (from shared-kernel)
    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [MenuItemController],
  providers: [
    { provide: MENU_ITEM_REPOSITORY, useClass: MongoMenuItemRepository },
    { provide: EVENT_PUBLISHER,      useClass: InMemoryEventPublisher  },
    CreateMenuItemUseCase,
    UpdateMenuItemUseCase,
    DeleteMenuItemUseCase,
    ToggleAvailabilityUseCase,
  ],
})
export class MenuModule {}
