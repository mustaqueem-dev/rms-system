// apps/menu-service/src/menu/presentation/menu-item.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  Auth,
  UserRole,
  CurrentTenant,
  TenantContext,
} from '@rms/shared-kernel';

import { CreateMenuItemUseCase }    from '../application/use-cases/create-menu-item.use-case';
import { UpdateMenuItemUseCase }    from '../application/use-cases/update-menu-item.use-case';
import { DeleteMenuItemUseCase }    from '../application/use-cases/delete-menu-item.use-case';
import { ToggleAvailabilityUseCase } from '../application/use-cases/toggle-availability.use-case';
import { IMenuItemRepository, MENU_ITEM_REPOSITORY } from '../domain/repositories/menu-item.repository.interface';
import { CreateMenuItemDto }        from '../application/dtos/create-menu-item.dto';
import { UpdateMenuItemDto }        from '../application/dtos/update-menu-item.dto';
import { ListMenuItemsDto }         from '../application/dtos/list-menu-items.dto';
import { Inject }                   from '@nestjs/common';

@ApiTags('Menu Items')
@ApiBearerAuth()
@Auth()
@Controller('menu/items')
export class MenuItemController {
  constructor(
    private readonly createUseCase:          CreateMenuItemUseCase,
    private readonly updateUseCase:          UpdateMenuItemUseCase,
    private readonly deleteUseCase:          DeleteMenuItemUseCase,
    private readonly toggleUseCase:          ToggleAvailabilityUseCase,
    @Inject(MENU_ITEM_REPOSITORY)
    private readonly menuItemRepo:           IMenuItemRepository,
  ) {}

  @Post()
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiResponse({ status: 201, description: 'Returns the new item ID' })
  async create(
    @Body() dto: CreateMenuItemDto,
    @CurrentTenant() tenant: TenantContext
  ): Promise<{ id: string }> {
    const id = await this.createUseCase.execute(dto, tenant);
    return { id };
  }

  @Get()
  @ApiOperation({ summary: 'List menu items for the authenticated branch' })
  async list(
    @Query() query: ListMenuItemsDto,
    @CurrentTenant() tenant: TenantContext
  ) {
    return this.menuItemRepo.findAll(
      {
        branchId:    tenant.branchId,
        franchiseId: tenant.franchiseId,
        categoryId:  query.categoryId,
        isAvailable: query.isAvailable,
        tags:        query.tags,
        search:      query.search,
      },
      { limit: query.limit ?? 50, offset: query.offset ?? 0 }
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single menu item by ID' })
  @ApiParam({ name: 'id', type: String })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext
  ) {
    const item = await this.menuItemRepo.findById(id, tenant.branchId);
    if (!item) throw new Error(`MenuItem ${id} not found`);
    return item;
  }

  @Patch(':id')
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a menu item (partial)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentTenant() tenant: TenantContext
  ): Promise<void> {
    return this.updateUseCase.execute(id, dto, tenant);
  }

  @Delete(':id')
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a menu item' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext
  ): Promise<void> {
    return this.deleteUseCase.execute(id, tenant);
  }

  @Patch(':id/availability')
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Toggle menu item availability (available ↔ unavailable)' })
  async toggleAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext
  ): Promise<{ isAvailable: boolean }> {
    const isAvailable = await this.toggleUseCase.execute(id, tenant);
    return { isAvailable };
  }
}
