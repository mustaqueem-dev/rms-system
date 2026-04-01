// apps/auth-service/src/auth/presentation/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
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
  ok,
  created,
  noContent,
  ApiResponse as ApiEnvelope,
} from '@rms/shared-kernel';

import { RegisterUseCase }        from '../application/use-cases/register.use-case';
import { LoginUseCase }           from '../application/use-cases/login.use-case';
import { ChangePasswordUseCase }  from '../application/use-cases/change-password.use-case';
import { RefreshTokenUseCase }    from '../application/use-cases/refresh-token.use-case';
import { GetProfileUseCase }      from '../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase }   from '../application/use-cases/update-profile.use-case';
import { ForgotPasswordUseCase }  from '../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase }   from '../application/use-cases/reset-password.use-case';

import { RegisterDto }            from '../application/dtos/register.dto';
import { LoginDto }               from '../application/dtos/login.dto';
import { ChangePasswordDto }      from '../application/dtos/change-password.dto';
import { ForgotPasswordDto }      from '../application/dtos/forgot-password.dto';
import { ResetPasswordDto }       from '../application/dtos/reset-password.dto';
import { UpdateProfileDto }       from '../application/dtos/update-profile.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase:       RegisterUseCase,
    private readonly loginUseCase:          LoginUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly refreshTokenUseCase:   RefreshTokenUseCase,
    private readonly getProfileUseCase:     GetProfileUseCase,
    private readonly updateProfileUseCase:  UpdateProfileUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase:  ResetPasswordUseCase,
  ) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created, access token returned' })
  async register(@Body() dto: RegisterDto): Promise<ApiEnvelope> {
    const result = await this.registerUseCase.execute(dto);
    return created(result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiResponse({ status: 200, description: 'Access token returned' })
  async login(@Body() dto: LoginDto): Promise<ApiEnvelope> {
    const result = await this.loginUseCase.execute(dto);
    return ok(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a new access token using authenticated session' })
  async refresh(@CurrentTenant() tenant: TenantContext): Promise<ApiEnvelope> {
    const result = await this.refreshTokenUseCase.execute({ userId: tenant.userId });
    return ok(result);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset OTP (sent via notification-service)' })
  @ApiResponse({ status: 204, description: 'OTP dispatched if email exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.forgotPasswordUseCase.execute(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using OTP received via email/SMS' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.resetPasswordUseCase.execute(dto);
  }

  // ── Authenticated endpoints ────────────────────────────────────────────────

  @Get('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentTenant() tenant: TenantContext): Promise<ApiEnvelope> {
    const profile = await this.getProfileUseCase.execute(tenant.userId);
    return ok(profile);
  }

  @Patch('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (name)' })
  @ApiResponse({ status: 204, description: 'Profile updated' })
  async updateMe(
    @Body() dto: UpdateProfileDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.updateProfileUseCase.execute(tenant.userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (requires current password)' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.changePasswordUseCase.execute({
      userId:      tenant.userId,
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — client should discard tokens' })
  @ApiResponse({ status: 204 })
  async logout(): Promise<void> {
    // Stateless JWT — client is responsible for discarding the token.
    // In production: add token to a Redis denylist (jti-based revocation).
  }
}
