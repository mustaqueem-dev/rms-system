// apps/auth-service/src/auth/application/use-cases/login.use-case.ts

import { Inject, Injectable }     from '@nestjs/common';
import { JwtService }             from '@nestjs/jwt';
import {
  ValidationError,
  UnauthorizedError,
  IEventPublisher,
  EVENT_PUBLISHER,
} from '@rms/shared-kernel';
import { Email }          from '../../domain/value-objects/email.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { LoginDto }       from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)  private readonly userRepo:       IUserRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher: IEventPublisher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    // 1. Validate email format
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) throw new ValidationError(emailResult.error);

    // 2. Find user
    const user = await this.userRepo.findByEmail(emailResult.value.value);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    // 3. Check active state
    if (!user.isActive) throw new UnauthorizedError('Account deactivated');

    // 4. Compare password (constant-time via bcrypt)
    const passwordVO   = HashedPassword.fromHash(user.passwordHash);
    if (passwordVO.isFailure) throw new UnauthorizedError('Invalid credentials');
    const isMatch = await passwordVO.value.compare(dto.password);
    if (!isMatch) throw new UnauthorizedError('Invalid credentials');

    // 5. Sign JWT
    const accessToken = await this.jwtService.signAsync({
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      franchiseId: user.franchiseId,
      branchId:    user.branchId,
    });

    return {
      accessToken,
      user: {
        id:          user.id,
        email:       user.email,
        name:        user.name,
        role:        user.role,
        franchiseId: user.franchiseId,
        branchId:    user.branchId,
      },
    };
  }
}
