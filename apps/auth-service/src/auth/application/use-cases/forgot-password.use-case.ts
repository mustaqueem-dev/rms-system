// apps/auth-service/src/auth/application/use-cases/forgot-password.use-case.ts
//
// Generates a 6-digit OTP, stores it in-memory (dev) or Redis (prod),
// and emits a Kafka event so the notification-service can send the email/SMS.

import { Inject, Injectable }    from '@nestjs/common';
import { EVENT_PUBLISHER, IEventPublisher, DomainEvent } from '@rms/shared-kernel';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

export interface ForgotPasswordDto {
  email: string;
}

/** In-memory OTP store — replace with Redis in production */
export const otpStore = new Map<string, { otp: string; expiresAt: number }>();

class PasswordResetRequestedEvent extends DomainEvent {
  readonly eventName   = 'auth.password_reset_requested.v1';
  readonly aggregateId: string;

  constructor(
    userId: string,
    readonly email: string,
    readonly otp: string,
  ) {
    super();
    this.aggregateId = userId;
  }
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)  private readonly userRepo:       IUserRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Always returns success to avoid user enumeration attacks.
   * If the email exists, a reset OTP is generated and the event is published.
   */
  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!user) return; // silent — don't reveal whether email exists

    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1_000; // 10 minutes

    otpStore.set(user.id, { otp, expiresAt });

    await this.eventPublisher.publish(
      new PasswordResetRequestedEvent(user.id, user.email, otp),
    );
  }
}
