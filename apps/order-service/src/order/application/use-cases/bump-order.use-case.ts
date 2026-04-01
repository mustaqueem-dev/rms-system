// apps/order-service/src/order/application/use-cases/bump-order.use-case.ts
//
// KDS "bump" — marks an order READY (food is done). Transitions PREPARING → READY.

import { Inject, Injectable }  from '@nestjs/common';
import {
  TenantContext,
  EVENT_PUBLISHER,
  IEventPublisher,
  NotFoundError,
  BusinessRuleViolationError,
} from '@rms/shared-kernel';
import { IOrderRepository, ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';

@Injectable()
export class BumpOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(orderId: string, tenant: TenantContext): Promise<void> {
    const order = await this.repo.findById(orderId, tenant.branchId);
    if (!order) throw new NotFoundError('Order', orderId);

    // Bump = PREPARING → READY
    const result = order.transitionTo('READY', tenant.userId);
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.update(order);
    await this.eventPublisher.publishAll(order.domainEvents);
    order.clearDomainEvents();
  }
}
