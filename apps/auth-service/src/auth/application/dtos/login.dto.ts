// apps/auth-service/src/auth/application/dtos/login.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty }                  from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@restaurant.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
