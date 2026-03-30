// apps/order-service/src/order/presentation/order.controller.ts

import { Controller, Post, Body, Get, Patch, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Auth, UserRole, CurrentTenant, TenantContext } from '@rms/shared-kernel';

import { IOrderRepository, ORDER_REPOSITORY } from '../domain/repositories/order.repository.interface';
import { CreateOrderUseCase }                 from '../application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase }           from '../application/use-cases/update-order-status.use-case';
import { CreateOrderDto }                     from '../application/dtos/create-order.dto';
import { UpdateOrderStatusDto }               from '../application/dtos/update-order-status.dto';
import { ListOrdersDto }                      from '../application/dtos/list-orders.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createUseCase: CreateOrderUseCase,
    private readonly updateUseCase: UpdateOrderStatusUseCase,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo:     IOrderRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Returns the new order ID' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentTenant() tenant: TenantContext
  ): Promise<{ id: string }> {
    const id = await this.createUseCase.execute(dto, tenant);
    return { id };
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  async list(
    @Query() query: ListOrdersDto,
    @CurrentTenant() tenant: TenantContext
  ) {
    return this.orderRepo.findAll(
      {
        branchId:    tenant.branchId,
        franchiseId: tenant.franchiseId,
        status:      query.status,
        customerId:  query.customerId,
        fromDate:    query.fromDate,
        toDate:      query.toDate,
      },
      { limit: query.limit ?? 50, offset: query.offset ?? 0 }
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', type: String })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext
  ) {
    const order = await this.orderRepo.findById(id, tenant.branchId);
    if (!order) throw new Error(`Order ${id} not found`);
    return order;
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentTenant() tenant: TenantContext
  ): Promise<void> {
    return this.updateUseCase.execute(id, dto, tenant);
  }
}
