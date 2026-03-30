// apps/order-service/src/order/application/dtos/create-order.dto.ts

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderLineDto {
  @ApiProperty({ example: 'menu-item-uuid' })
  @IsString() @IsNotEmpty()
  menuItemId: string;

  @ApiProperty({ example: 'Chicken Biryani' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2 })
  @IsNumber() @IsPositive()
  quantity: number;

  @ApiProperty({ example: 25000, description: 'Unit price in current currency' })
  @IsNumber() @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 'INR' })
  @IsString() @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({ example: 'Less spicy' })
  @IsOptional() @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsNumber() @IsPositive()
  tableNumber?: number;

  @ApiPropertyOptional({ example: 'customer-uuid' })
  @IsOptional() @IsString()
  customerId?: string;

  @ApiProperty({ type: [OrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines: OrderLineDto[];
}
