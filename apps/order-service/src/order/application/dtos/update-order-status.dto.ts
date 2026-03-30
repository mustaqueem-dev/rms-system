// apps/order-service/src/order/application/dtos/update-order-status.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional }         from '@nestjs/swagger';
import { OrderStatus }                              from '../../domain/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CLOSED', 'CANCELLED'] })
  @IsEnum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CLOSED', 'CANCELLED'])
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Required if status is CANCELLED' })
  @IsOptional() @IsString()
  reason?: string;
}
