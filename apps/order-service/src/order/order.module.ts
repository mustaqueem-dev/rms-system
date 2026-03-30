// apps/order-service/src/order/order.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

import { OrderModel, OrderSchema }  from './infrastructure/persistence/order.schema';
import { MongoOrderRepository }     from './infrastructure/persistence/mongo-order.repository';
import { ORDER_REPOSITORY }         from './domain/repositories/order.repository.interface';
import { CreateOrderUseCase }       from './application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { OrderController }          from './presentation/order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrderModel.name, schema: OrderSchema }]),
    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: MongoOrderRepository   },
    { provide: EVENT_PUBLISHER,  useClass: InMemoryEventPublisher },
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class OrderModule {}
