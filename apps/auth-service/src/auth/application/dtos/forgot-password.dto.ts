// apps/auth-service/src/auth/application/dtos/forgot-password.dto.ts

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'owner@franchise.com' })
  @IsEmail()
  email!: string;
}
