// apps/inventory-service/src/inventory/application/dtos/adjust-stock.dto.ts

import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: -5, description: 'Positive to add, negative to subtract stock' })
  @IsNumber()
  @IsNotEmpty()
  delta: number;

  @ApiProperty({ example: 'Delivery arrived / Recipe deduction' })
  @IsString()
  reason: string;
}
