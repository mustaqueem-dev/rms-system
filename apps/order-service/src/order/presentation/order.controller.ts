// apps/order-service/src/order/presentation/order.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import {
  Auth,
  UserRole,
  CurrentTenant,
  TenantContext,
  ok,
  created,
  noContent,
  ApiResponse as ApiEnvelope,
} from '@rms/shared-kernel';

import { CreateOrderUseCase }        from '../application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase }  from '../application/use-cases/update-order-status.use-case';
import { CancelOrderUseCase, CancelOrderDto } from '../application/use-cases/cancel-order.use-case';
import { ListOrdersUseCase }         from '../application/use-cases/list-orders.use-case';
import { AssignKdsStationUseCase, AssignKdsStationDto } from '../application/use-cases/assign-kds-station.use-case';
import { BumpOrderUseCase }          from '../application/use-cases/bump-order.use-case';

import { IOrderRepository, ORDER_REPOSITORY } from '../domain/repositories/order.repository.interface';
import { CreateOrderDto }            from '../application/dtos/create-order.dto';
import { UpdateOrderStatusDto }      from '../application/dtos/update-order-status.dto';
import { ListOrdersDto }             from '../application/dtos/list-orders.dto';
import { Inject }                    from '@nestjs/common';

@ApiTags('Orders')
@ApiBearerAuth()
@Auth()
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createUseCase:        CreateOrderUseCase,
    private readonly updateStatusUseCase:  UpdateOrderStatusUseCase,
    private readonly cancelUseCase:        CancelOrderUseCase,
    private readonly listUseCase:          ListOrdersUseCase,
    private readonly assignKdsUseCase:     AssignKdsStationUseCase,
    private readonly bumpUseCase:          BumpOrderUseCase,
    @Inject(ORDER_REPOSITORY)
    private readonly repo:                 IOrderRepository,
  ) {}

  // ── Create order ──────────────────────────────────────────────────────────

  @Post()
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Place a new order' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.createUseCase.execute(dto, tenant);
    return created({ id });
  }

  // ── List orders ───────────────────────────────────────────────────────────

  @Get()
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List orders with optional status/date filters' })
  async list(
    @Query() query: ListOrdersDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const result = await this.listUseCase.execute(query, tenant);
    return ok(result);
  }

  // ── Get single order ──────────────────────────────────────────────────────

  @Get(':id')
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: String })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const order = await this.repo.findById(id, tenant.branchId);
    if (!order) throw new Error(`Order ${id} not found`);
    return ok(order);
  }

  // ── Update order status ───────────────────────────────────────────────────

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transition order to a new status (state-machine validated)' })
  @ApiParam({ name: 'id', type: String })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.updateStatusUseCase.execute(id, dto, tenant);
  }

  // ── Cancel order ──────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel an order (state-machine validated)' })
  @ApiParam({ name: 'id', type: String })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.cancelUseCase.execute(id, dto, tenant);
  }

  // ── Assign KDS station ────────────────────────────────────────────────────

  @Post(':id/kds')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign order to a KDS station (emits kds:order_assigned)' })
  @ApiParam({ name: 'id', type: String })
  async assignKds(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignKdsStationDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.assignKdsUseCase.execute(id, dto, tenant);
  }

  // ── KDS bump (PREPARING → READY) ─────────────────────────────────────────

  @Post(':id/bump')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'KDS bump — mark order ready (PREPARING → READY)' })
  @ApiParam({ name: 'id', type: String })
  async bump(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.bumpUseCase.execute(id, tenant);
  }
}
