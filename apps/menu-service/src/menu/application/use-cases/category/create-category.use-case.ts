// apps/menu-service/src/menu/application/use-cases/category/create-category.use-case.ts

import { Inject, Injectable }     from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import {
  IEventPublisher,
  EVENT_PUBLISHER,
  ConflictError,
  BusinessRuleViolationError,
  TenantContext,
} from '@rms/shared-kernel';
import { Category }              from '../../../domain/category.entity';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../../domain/repositories/category.repository.interface';

export class CreateCategoryDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly catRepo:         ICategoryRepository,
    @Inject(EVENT_PUBLISHER)     private readonly eventPublisher:  IEventPublisher,
  ) {}

  async execute(dto: CreateCategoryDto, tenant: TenantContext): Promise<string> {
    const exists = await this.catRepo.existsByName(dto.name, tenant.branchId);
    if (exists) throw new ConflictError(`Category '${dto.name}' already exists`);

    const result = Category.create({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      name:        dto.name,
      description: dto.description,
      sortOrder:   dto.sortOrder ?? 0,
      createdBy:   tenant.userId,
    });
    if (result.isFailure) throw new BusinessRuleViolationError(result.error);

    const cat = result.value;
    await this.catRepo.save(cat);
    await this.eventPublisher.publishAll(cat.domainEvents);
    cat.clearDomainEvents();

    return cat.id;
  }
}
