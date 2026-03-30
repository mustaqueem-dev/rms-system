// apps/auth-service/src/auth/application/dtos/register.dto.ts

import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional }                              from '@nestjs/swagger';
import { UserRole }                                                      from '@rms/shared-kernel';

export class RegisterDto {
  @ApiProperty({ example: 'owner@restaurant.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ahmed Khan' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BRANCH_MANAGER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'franchise-uuid-here' })
  @IsString()
  @IsNotEmpty()
  franchiseId: string;

  @ApiPropertyOptional({ example: 'branch-uuid-here' })
  @IsOptional()
  @IsString()
  branchId?: string;
}
