// apps/order-service/src/order/application/use-cases/list-orders.use-case.ts

import { Inject, Injectable }           from '@nestjs/common';
import { TenantContext, PaginatedResult } from '@rms/shared-kernel';
import { Order, OrderStatus }            from '../../domain/order.entity';
import { IOrderRepository, ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { ListOrdersDto }                 from '../dtos/list-orders.dto';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
  ) {}

  async execute(dto: ListOrdersDto, tenant: TenantContext): Promise<PaginatedResult<Order>> {
    return this.repo.findAll(
      {
        branchId:    tenant.branchId,
        franchiseId: tenant.franchiseId,
        status:      dto.status as OrderStatus | undefined,
        customerId:  dto.customerId,
        fromDate:    dto.fromDate ? new Date(dto.fromDate) : undefined,
        toDate:      dto.toDate   ? new Date(dto.toDate)   : undefined,
      },
      { limit: dto.limit ?? 50, offset: dto.offset ?? 0 },
    );
  }
}
