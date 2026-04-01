// apps/auth-service/src/auth/application/use-cases/update-profile.use-case.ts

import { Inject, Injectable }     from '@nestjs/common';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { NotFoundError }          from '@rms/shared-kernel';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User', userId);

    if (dto.name !== undefined) {
      const result = user.updateName(dto.name);
      if (result.isFailure) throw new Error(result.error);
    }

    await this.userRepo.update(user);
  }
}
