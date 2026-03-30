// apps/inventory-service/src/inventory/application/dtos/create-inventory-item.dto.ts

import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Basmati Rice' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Premium 1121 long grain' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 'ING-RICE-01' })
  @IsString() @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 50 })
  @IsNumber() @Min(0)
  initialQuantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString() @IsNotEmpty()
  unit: string;

  @ApiProperty({ example: 10, description: 'Alert when stock falls to this level' })
  @IsNumber() @Min(0)
  reorderLevel: number;

  @ApiProperty({ example: 50, description: 'Amount to reorder when level is reached' })
  @IsNumber() @IsPositive()
  reorderQuantity: number;
}
