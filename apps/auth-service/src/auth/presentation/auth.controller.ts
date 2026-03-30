// apps/auth-service/src/auth/presentation/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  Auth,
  CurrentTenant,
  TenantContext,
} from '@rms/shared-kernel';
import { RegisterUseCase }      from '../application/use-cases/register.use-case';
import { LoginUseCase }         from '../application/use-cases/login.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { RegisterDto }          from '../application/dtos/register.dto';
import { LoginDto }             from '../application/dtos/login.dto';
import { AuthResponseDto }      from '../application/dtos/auth-response.dto';
import { ChangePasswordDto }    from '../application/dtos/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase:      RegisterUseCase,
    private readonly loginUseCase:         LoginUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated)' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentTenant() tenant: TenantContext
  ): Promise<void> {
    return this.changePasswordUseCase.execute({
      userId:      tenant.userId,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });
  }

  @Get('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentTenant() tenant: TenantContext) {
    return { ...tenant };
  }
}
