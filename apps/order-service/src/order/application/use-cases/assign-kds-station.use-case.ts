// apps/order-service/src/order/application/use-cases/assign-kds-station.use-case.ts
//
// Assigns a KDS (Kitchen Display System) station to an order after it's confirmed.
// Emits kds.order_assigned event which the KDS screen listens to.

import { Inject, Injectable }   from '@nestjs/common';
import { IsString }             from 'class-validator';
import {
  TenantContext,
  EVENT_PUBLISHER,
  IEventPublisher,
  NotFoundError,
  BusinessRuleViolationError,
  DomainEvent,
} from '@rms/shared-kernel';
import { IOrderRepository, ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';

export class AssignKdsStationDto {
  @IsString()
  kdsStationId!: string;
}

class KdsOrderAssignedEvent extends DomainEvent {
  readonly eventName   = 'kds.order_assigned.v1';
  readonly aggregateId: string;
  constructor(
    orderId: string,
    readonly branchId:     string,
    readonly kdsStationId: string,
    readonly lines:        Array<{ menuItemId: string; name: string; quantity: number }>,
  ) {
    super();
    this.aggregateId = orderId;
  }
}

@Injectable()
export class AssignKdsStationUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(orderId: string, dto: AssignKdsStationDto, tenant: TenantContext): Promise<void> {
    const order = await this.repo.findById(orderId, tenant.branchId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (!['CONFIRMED', 'PREPARING'].includes(order.status)) {
      throw new BusinessRuleViolationError(
        `Cannot assign KDS station to order in status ${order.status}`,
      );
    }

    await this.eventPublisher.publish(
      new KdsOrderAssignedEvent(
        order.id,
        order.branchId,
        dto.kdsStationId,
        order.lines.map((l) => ({
          menuItemId: l.menuItemId,
          name:       l.name,
          quantity:   l.quantity,
        })),
      ),
    );
  }
}
