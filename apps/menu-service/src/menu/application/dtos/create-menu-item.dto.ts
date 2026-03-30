// apps/menu-service/src/menu/application/dtos/create-menu-item.dto.ts

import {
  IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsUrl, IsInt, Min, Max, MinLength, IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Chicken Biryani' })
  @IsString() @IsNotEmpty() @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Aromatic basmati rice cooked with tender chicken' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsString() @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 25000, description: 'Amount in smallest denomination (paise)' })
  @IsNumber() @IsPositive()
  priceAmount: number;

  @ApiProperty({ example: 'INR' })
  @IsString() @IsNotEmpty()
  priceCurrency: string;

  @ApiPropertyOptional({ example: 0.05, description: 'Tax rate e.g. 0.05 = 5%' })
  @IsOptional() @IsNumber() @Min(0) @Max(1)
  priceTaxRate?: number;

  @ApiProperty({ example: 25, description: 'Preparation time in minutes (1-300)' })
  @IsInt() @Min(1) @Max(300)
  preparationTimeMinutes: number;

  @ApiPropertyOptional({ example: ['spicy', 'non-veg'], type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags: string[] = [];

  @ApiPropertyOptional({ example: 'https://cdn.restaurant.com/biryani.jpg' })
  @IsOptional() @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 0, description: 'Sort order within category' })
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}
