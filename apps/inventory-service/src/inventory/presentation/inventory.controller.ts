// apps/inventory-service/src/inventory/presentation/inventory.controller.ts

import {
  Controller, Post, Body, Get, Patch, Param,
  Query, HttpCode, HttpStatus, ParseUUIDPipe, Inject,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam,
} from '@nestjs/swagger';
import {
  Auth, UserRole, CurrentTenant, TenantContext,
  ok, created, ApiResponse as ApiEnvelope,
} from '@rms/shared-kernel';

import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY } from '../domain/repositories/inventory-item.repository.interface';
import { CreateInventoryItemUseCase }                          from '../application/use-cases/create-inventory-item.use-case';
import { AdjustStockUseCase }                                 from '../application/use-cases/adjust-stock.use-case';
import { ListLowStockUseCase }                                from '../application/use-cases/list-low-stock.use-case';
import { UpdateReorderRuleUseCase, UpdateReorderRuleDto }     from '../application/use-cases/update-reorder-rule.use-case';

import { CreateInventoryItemDto }  from '../application/dtos/create-inventory-item.dto';
import { AdjustStockDto }          from '../application/dtos/adjust-stock.dto';
import { ListInventoryDto }        from '../application/dtos/list-inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly createUseCase:      CreateInventoryItemUseCase,
    private readonly adjustUseCase:      AdjustStockUseCase,
    private readonly listLowStockUseCase: ListLowStockUseCase,
    private readonly updateReorderUseCase: UpdateReorderRuleUseCase,
    @Inject(INVENTORY_ITEM_REPOSITORY)
    private readonly repo:               IInventoryItemRepository,
  ) {}

  // ─── Create inventory item ────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  async create(
    @Body() dto: CreateInventoryItemDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.createUseCase.execute(dto, tenant);
    return created({ id });
  }

  // ─── List inventory ───────────────────────────────────────────────────────

  @Get()
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List inventory items (supports filters: sku, isLowStock)' })
  async list(
    @Query() query: ListInventoryDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const result = await this.repo.findAll(
      {
        branchId:    tenant.branchId,
        franchiseId: tenant.franchiseId,
        sku:         query.sku,
        isLowStock:  query.isLowStock,
      },
      { limit: query.limit ?? 50, offset: query.offset ?? 0 },
    );
    return ok(result);
  }

  // ─── Low-stock dashboard ──────────────────────────────────────────────────

  @Get('low-stock')
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all items at or below their reorder level' })
  async lowStock(@CurrentTenant() tenant: TenantContext): Promise<ApiEnvelope> {
    const items = await this.listLowStockUseCase.execute(tenant);
    return ok(items);
  }

  // ─── Get single item ──────────────────────────────────────────────────────

  @Get(':id')
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiParam({ name: 'id', type: String })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new Error(`Inventory item ${id} not found`);
    return ok(item);
  }

  // ─── Adjust stock (manual IN/OUT) ────────────────────────────────────────

  @Patch(':id/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually adjust stock level (MANUAL_IN or MANUAL_OUT)' })
  @ApiParam({ name: 'id', type: String })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const result = await this.adjustUseCase.execute(id, dto, tenant);
    return ok(result);
  }

  // ─── Update reorder rule ──────────────────────────────────────────────────

  @Patch(':id/reorder-rule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update the reorder level and reorder quantity for an item' })
  @ApiParam({ name: 'id', type: String })
  async updateReorderRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReorderRuleDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.updateReorderUseCase.execute(id, dto, tenant);
  }
}
