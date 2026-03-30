// apps/auth-service/src/auth/application/use-cases/change-password.use-case.ts

import { Inject, Injectable }  from '@nestjs/common';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  IEventPublisher,
  EVENT_PUBLISHER,
} from '@rms/shared-kernel';
import { HashedPassword }      from '../../domain/value-objects/hashed-password.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

export interface ChangePasswordCommand {
  userId:      string;
  oldPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)  private readonly userRepo:       IUserRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(cmd: ChangePasswordCommand): Promise<void> {
    // 1. Load user
    const user = await this.userRepo.findById(cmd.userId);
    if (!user) throw new NotFoundError('User', cmd.userId);
    if (!user.isActive) throw new UnauthorizedError('Account deactivated');

    // 2. Verify old password
    const oldPwVO = HashedPassword.fromHash(user.passwordHash);
    if (oldPwVO.isFailure) throw new UnauthorizedError('Invalid credentials');
    const isOldValid = await oldPwVO.value.compare(cmd.oldPassword);
    if (!isOldValid) throw new UnauthorizedError('Current password is incorrect');

    // 3. Hash new password
    const newPwResult = await HashedPassword.createFromPlain(cmd.newPassword);
    if (newPwResult.isFailure) throw new ValidationError(newPwResult.error);

    // 4. Mutate aggregate
    user.changePassword(newPwResult.value);

    // 5. Persist + publish events
    await this.userRepo.update(user);
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearDomainEvents();
  }
}
