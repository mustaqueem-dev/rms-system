// apps/auth-service/src/auth/application/use-cases/register.use-case.ts

import { Inject, Injectable }          from '@nestjs/common';
import { JwtService }                  from '@nestjs/jwt';
import {
  Result,
  UserRole,
  ConflictError,
  ValidationError,
  BusinessRuleViolationError,
  InternalError,
  IEventPublisher,
  EVENT_PUBLISHER,
} from '@rms/shared-kernel';
import { User }             from '../../domain/user.entity';
import { Email }            from '../../domain/value-objects/email.vo';
import { HashedPassword }   from '../../domain/value-objects/hashed-password.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { RegisterDto }      from '../dtos/register.dto';
import { AuthResponseDto }  from '../dtos/auth-response.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)  private readonly userRepo:        IUserRepository,
    @Inject(EVENT_PUBLISHER)  private readonly eventPublisher:  IEventPublisher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    // 1. Parse & validate email VO
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) throw new ValidationError(emailResult.error);

    // 2. Check for duplicate email
    const exists = await this.userRepo.existsByEmail(emailResult.value.value);
    if (exists) throw new ConflictError(`User with email '${dto.email}' already exists`);

    // 3. Hash password
    const pwResult = await HashedPassword.createFromPlain(dto.password);
    if (pwResult.isFailure) throw new ValidationError(pwResult.error);

    // 4. Create User aggregate
    const userResult = User.create({
      email:       emailResult.value,
      password:    pwResult.value,
      name:        dto.name,
      role:        dto.role as UserRole,
      franchiseId: dto.franchiseId,
      branchId:    dto.branchId,
    });
    if (userResult.isFailure) throw new BusinessRuleViolationError(userResult.error);

    const user = userResult.value;

    // 5. Persist
    await this.userRepo.save(user);

    // 6. Publish domain events
    const events = user.domainEvents;
    await this.eventPublisher.publishAll(events);
    user.clearDomainEvents();

    // 7. Sign JWT
    const token = await this.signJwt(user);
    return this.buildResponse(user, token);
  }

  private async signJwt(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      franchiseId: user.franchiseId,
      branchId:    user.branchId,
    });
  }

  private buildResponse(user: User, accessToken: string): AuthResponseDto {
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
