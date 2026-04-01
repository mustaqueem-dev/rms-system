// apps/menu-service/src/menu/application/use-cases/category/update-category.use-case.ts

import { Inject, Injectable }      from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import {
  IEventPublisher,
  EVENT_PUBLISHER,
  NotFoundError,
  TenantContext,
} from '@rms/shared-kernel';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../../domain/repositories/category.repository.interface';

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly catRepo:        ICategoryRepository,
    @Inject(EVENT_PUBLISHER)     private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, dto: UpdateCategoryDto, tenant: TenantContext): Promise<void> {
    const cat = await this.catRepo.findById(id, tenant.branchId);
    if (!cat) throw new NotFoundError('Category', id);

    const result = cat.update(dto, tenant.userId);
    if (result.isFailure) throw new Error(result.error);

    await this.catRepo.update(cat);
    await this.eventPublisher.publishAll(cat.domainEvents);
    cat.clearDomainEvents();
  }
}
