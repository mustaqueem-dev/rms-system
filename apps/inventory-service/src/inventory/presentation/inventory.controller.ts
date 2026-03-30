// apps/inventory-service/src/inventory/presentation/inventory.controller.ts

import { Controller, Post, Body, Get, Patch, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Auth, UserRole, CurrentTenant, TenantContext } from '@rms/shared-kernel';

import { IInventoryItemRepository, INVENTORY_ITEM_REPOSITORY } from '../domain/repositories/inventory-item.repository.interface';
import { CreateInventoryItemUseCase } from '../application/use-cases/create-inventory-item.use-case';
import { AdjustStockUseCase }         from '../application/use-cases/adjust-stock.use-case';
import { CreateInventoryItemDto }     from '../application/dtos/create-inventory-item.dto';
import { AdjustStockDto }             from '../application/dtos/adjust-stock.dto';
import { ListInventoryDto }           from '../application/dtos/list-inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly createUseCase: CreateInventoryItemUseCase,
    private readonly adjustUseCase: AdjustStockUseCase,
    @Inject(INVENTORY_ITEM_REPOSITORY)
    private readonly repo:          IInventoryItemRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateInventoryItemDto,
    @CurrentTenant() tenant: TenantContext
  ): Promise<{ id: string }> {
    const id = await this.createUseCase.execute(dto, tenant);
    return { id };
  }

  @Get()
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List inventory items (supports low-stock filter)' })
  async list(
    @Query() query: ListInventoryDto,
    @CurrentTenant() tenant: TenantContext
  ) {
    return this.repo.findAll(
      {
        branchId:    tenant.branchId,
        franchiseId: tenant.franchiseId,
        sku:         query.sku,
        isLowStock:  query.isLowStock,
      },
      { limit: query.limit ?? 50, offset: query.offset ?? 0 }
    );
  }

  @Get(':id')
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext
  ) {
    const item = await this.repo.findById(id, tenant.branchId);
    if (!item) throw new Error(`Inventory item ${id} not found`);
    return item;
  }

  @Patch(':id/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust stock levels' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentTenant() tenant: TenantContext
  ) {
    return this.adjustUseCase.execute(id, dto, tenant);
  }
}
