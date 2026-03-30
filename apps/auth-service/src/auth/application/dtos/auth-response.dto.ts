// apps/auth-service/src/auth/application/dtos/auth-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole }                         from '@rms/shared-kernel';

export class UserProfileDto {
  @ApiProperty() id:          string;
  @ApiProperty() email:       string;
  @ApiProperty() name:        string;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty() franchiseId: string;
  @ApiPropertyOptional() branchId?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Bearer token' })
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
