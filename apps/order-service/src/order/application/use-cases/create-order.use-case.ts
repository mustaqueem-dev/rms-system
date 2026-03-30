// apps/order-service/src/order/application/use-cases/create-order.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { TenantContext, EVENT_PUBLISHER, IEventPublisher, BusinessRuleViolationError } from '@rms/shared-kernel';
import { Order } from '../../domain/order.entity';
import { IOrderRepository, ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { CreateOrderDto } from '../dtos/create-order.dto';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateOrderDto, tenant: TenantContext): Promise<string> {
    const result = Order.create({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      tableNumber: dto.tableNumber,
      customerId:  dto.customerId,
      lines:       dto.lines,
      createdBy:   tenant.userId,
    });

    if (result.isFailure) throw new BusinessRuleViolationError(result.error);
    const order = result.value;

    await this.repo.save(order);
    await this.eventPublisher.publishAll(order.domainEvents);
    order.clearDomainEvents();

    return order.id;
  }
}
