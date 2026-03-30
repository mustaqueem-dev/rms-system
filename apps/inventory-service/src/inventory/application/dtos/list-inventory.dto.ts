// apps/inventory-service/src/inventory/application/dtos/list-inventory.dto.ts

import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListInventoryDto {
  @ApiPropertyOptional({ example: 'ING-RICE' })
  @IsOptional() @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isLowStock?: boolean;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  offset?: number = 0;
}
