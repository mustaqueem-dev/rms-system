// apps/menu-service/src/menu/presentation/category.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
import { CreateCategoryUseCase, CreateCategoryDto } from '../application/use-cases/category/create-category.use-case';
import { UpdateCategoryUseCase, UpdateCategoryDto } from '../application/use-cases/category/update-category.use-case';
import { DeleteCategoryUseCase }                    from '../application/use-cases/category/delete-category.use-case';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../domain/repositories/category.repository.interface';
import { Inject } from '@nestjs/common';

@ApiTags('Menu Categories')
@ApiBearerAuth()
@Auth()
@Controller('menu/categories')
export class CategoryController {
  constructor(
    private readonly createUseCase: CreateCategoryUseCase,
    private readonly updateUseCase: UpdateCategoryUseCase,
    private readonly deleteUseCase: DeleteCategoryUseCase,
    @Inject(CATEGORY_REPOSITORY)
    private readonly catRepo: ICategoryRepository,
  ) {}

  @Post()
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a menu category' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.createUseCase.execute(dto, tenant);
    return created({ id });
  }

  @Get()
  @ApiOperation({ summary: 'List all active categories for this branch' })
  async list(@CurrentTenant() tenant: TenantContext): Promise<ApiEnvelope> {
    const cats = await this.catRepo.findAll(tenant.branchId, tenant.franchiseId);
    return ok(cats.map((c) => ({
      id:          c.id,
      name:        c.name,
      description: c.description,
      sortOrder:   c.sortOrder,
      isActive:    c.isActive,
    })));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.updateUseCase.execute(id, dto, tenant);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete (deactivate) a category' })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.deleteUseCase.execute(id, tenant);
  }
}
