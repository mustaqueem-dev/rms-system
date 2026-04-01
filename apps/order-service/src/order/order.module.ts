// apps/order-service/src/order/order.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

// ── Persistence ───────────────────────────────────────────────────────────────
import { OrderModel, OrderSchema }    from './infrastructure/persistence/order.schema';
import { MongoOrderRepository }       from './infrastructure/persistence/mongo-order.repository';
import { ORDER_REPOSITORY }           from './domain/repositories/order.repository.interface';

// ── WebSocket ─────────────────────────────────────────────────────────────────
import { OrderGateway }               from './infrastructure/websocket/order.gateway';

// ── Use cases ─────────────────────────────────────────────────────────────────
import { CreateOrderUseCase }         from './application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase }   from './application/use-cases/update-order-status.use-case';
import { CancelOrderUseCase }         from './application/use-cases/cancel-order.use-case';
import { ListOrdersUseCase }          from './application/use-cases/list-orders.use-case';
import { AssignKdsStationUseCase }    from './application/use-cases/assign-kds-station.use-case';
import { BumpOrderUseCase }           from './application/use-cases/bump-order.use-case';

// ── Controller ─────────────────────────────────────────────────────────────────
import { OrderController }            from './presentation/order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrderModel.name, schema: OrderSchema }]),

    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '15m' }, // SRS NFR-S04
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [
    // Repository
    { provide: ORDER_REPOSITORY, useClass: MongoOrderRepository },

    // Event publisher (swap to KafkaEventPublisher when wired)
    { provide: EVENT_PUBLISHER, useClass: InMemoryEventPublisher },

    // WebSocket gateway
    OrderGateway,

    // Use cases
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    CancelOrderUseCase,
    ListOrdersUseCase,
    AssignKdsStationUseCase,
    BumpOrderUseCase,
  ],
})
export class OrderModule {}
