// apps/menu-service/src/menu/application/dtos/list-menu-items.dto.ts

import { IsOptional, IsString, IsBoolean, IsArray, IsInt, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional }  from '@nestjs/swagger';
import { Transform, Type }      from 'class-transformer';

export class ListMenuItemsDto {
  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional() @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: ['spicy'], type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  tags?: string[];

  @ApiPropertyOptional({ example: 'biryani', description: 'Full-text search across name + description' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  offset?: number = 0;
}
