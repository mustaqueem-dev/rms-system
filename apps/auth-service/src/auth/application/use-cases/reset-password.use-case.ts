// apps/auth-service/src/auth/application/use-cases/reset-password.use-case.ts

import { Inject, Injectable }     from '@nestjs/common';
import { IsString, MinLength }    from 'class-validator';
import {
  IEventPublisher,
  EVENT_PUBLISHER,
  ValidationError,
  UnauthorizedError,
} from '@rms/shared-kernel';
import { HashedPassword }         from '../../domain/value-objects/hashed-password.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { otpStore }               from './forgot-password.use-case';

export class ResetPasswordDto {
  @IsString()
  userId!: string;

  @IsString()
  otp!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)  private readonly userRepo:       IUserRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    // 1. Validate OTP
    const stored = otpStore.get(dto.userId);
    if (!stored || stored.otp !== dto.otp) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(dto.userId);
      throw new UnauthorizedError('OTP has expired');
    }

    // 2. Load user
    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new UnauthorizedError('User not found');

    // 3. Hash new password
    const pwResult = await HashedPassword.createFromPlain(dto.newPassword);
    if (pwResult.isFailure) throw new ValidationError(pwResult.error);

    // 4. Apply domain behaviour (also emits PasswordChangedEvent)
    user.changePassword(pwResult.value);

    // 5. Persist + publish events
    await this.userRepo.update(user);
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearDomainEvents();

    // 6. Invalidate OTP
    otpStore.delete(dto.userId);
  }
}
