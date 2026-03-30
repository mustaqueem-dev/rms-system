// apps/auth-service/src/auth/application/dtos/change-password.dto.ts

import { IsString, MinLength } from 'class-validator';
import { ApiProperty }         from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123' })
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({ example: 'NewPass456!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
