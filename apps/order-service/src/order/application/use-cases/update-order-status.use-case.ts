// apps/order-service/src/order/application/use-cases/update-order-status.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  TenantContext,
  EVENT_PUBLISHER,
  IEventPublisher,
  NotFoundError,
  ForbiddenError,
  BusinessRuleViolationError
} from '@rms/shared-kernel';
import { IOrderRepository, ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { UpdateOrderStatusDto }               from '../dtos/update-order-status.dto';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(orderId: string, dto: UpdateOrderStatusDto, tenant: TenantContext): Promise<void> {
    const order = await this.repo.findById(orderId, tenant.branchId);
    if (!order) throw new NotFoundError('Order', orderId);
    if (order.franchiseId !== tenant.franchiseId) throw new ForbiddenError();

    const transitionResult = order.transitionTo(dto.status, tenant.userId, dto.reason);
    if (transitionResult.isFailure) throw new BusinessRuleViolationError(transitionResult.error);

    await this.repo.update(order);
    await this.eventPublisher.publishAll(order.domainEvents);
    order.clearDomainEvents();
  }
}
