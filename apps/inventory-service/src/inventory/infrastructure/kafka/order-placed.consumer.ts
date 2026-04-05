// apps/inventory-service/src/inventory/infrastructure/kafka/order-placed.consumer.ts
//
// Handles the `order.placed` Kafka event by deducting stock from inventory.
//
// NOTE: This consumer is wired as an NestJS microservice MessagePattern in
// app.module.ts (hybrid app). The decorators come from @nestjs/microservices
// which is registered at the app-module level. To keep this file importable
// without that dependency we expose a plain service with a `handle()` method
// that the microservice transport calls via NestJS dependency injection.

import { Controller, Logger } from '@nestjs/common';
import {
  DeductStockUseCase,
  DeductStockCommand,
} from '../../application/use-cases/deduct-stock.use-case';

export interface OrderPlacedPayload {
  orderId: string;
  branchId: string;
  franchiseId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

/**
 * OrderPlacedConsumer
 *
 * Kafka binding is registered in app.module.ts as:
 *   @MessagePattern('order.placed')
 *   async onOrderPlaced(@Payload() payload: OrderPlacedPayload) {
 *     return this.consumer.handle(payload);
 *   }
 *
 * This keeps @nestjs/microservices out of the domain/application layers
 * and lets us test handle() without a Kafka broker.
 */
@Controller()
export class OrderPlacedConsumer {
  private readonly logger = new Logger(OrderPlacedConsumer.name);

  constructor(private readonly deductStock: DeductStockUseCase) { }

  async handle(payload: OrderPlacedPayload): Promise<void> {
    this.logger.log(`Processing order.placed for order=${payload.orderId}`);

    const cmd: DeductStockCommand = {
      orderId: payload.orderId,
      branchId: payload.branchId,
      franchiseId: payload.franchiseId,
      items: payload.items,
    };

    const result = await this.deductStock.execute(cmd);

    if (result.failed.length > 0) {
      this.logger.warn(
        `Stock deduction: ${result.deducted.length} deducted, ` +
        `${result.failed.length} failed`,
        { orderId: payload.orderId, failed: result.failed },
      );
    } else {
      this.logger.log(
        `Stock deduction complete: ${result.deducted.length} items deducted`,
        { orderId: payload.orderId },
      );
    }
  }
}
