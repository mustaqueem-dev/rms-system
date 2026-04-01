// apps/order-service/src/order/application/use-cases/cancel-order.use-case.ts

import { Inject, Injectable }  from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import {
  TenantContext,
  EVENT_PUBLISHER,
  IEventPublisher,
  NotFoundError,
  ForbiddenError,
  BusinessRuleViolationError,
} from '@rms/shared-kernel';
import { IOrderRepository, ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';

export class CancelOrderDto {
  @IsOptional() @IsString()
  reason?: string;
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(orderId: string, dto: CancelOrderDto, tenant: TenantContext): Promise<void> {
    const order = await this.repo.findById(orderId, tenant.branchId);
    if (!order) throw new NotFoundError('Order', orderId);
    if (order.franchiseId !== tenant.franchiseId) throw new ForbiddenError();

    const result = order.transitionTo('CANCELLED', tenant.userId, dto.reason ?? 'Cancelled by staff');
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    await this.repo.update(order);
    await this.eventPublisher.publishAll(order.domainEvents);
    order.clearDomainEvents();
  }
}
