// apps/order-service/src/order/application/dtos/list-orders.dto.ts

import { IsOptional, IsString, IsEnum, IsDate, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus }         from '../../domain/order.entity';

export class ListOrdersDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CLOSED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CLOSED', 'CANCELLED'])
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 'customer-uuid' })
  @IsOptional() @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z' })
  @IsOptional() @IsDate() @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ example: '2025-01-31T23:59:59Z' })
  @IsOptional() @IsDate() @Type(() => Date)
  toDate?: Date;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  offset?: number = 0;
}
