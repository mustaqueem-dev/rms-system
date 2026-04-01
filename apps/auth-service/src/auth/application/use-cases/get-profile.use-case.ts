// apps/auth-service/src/auth/application/use-cases/get-profile.use-case.ts

import { Inject, Injectable }  from '@nestjs/common';
import { NotFoundError }       from '@rms/shared-kernel';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

export interface UserProfileDto {
  id:          string;
  email:       string;
  name:        string;
  role:        string;
  franchiseId: string;
  branchId?:   string;
  isActive:    boolean;
  createdAt:   Date;
}

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return {
      id:          user.id,
      email:       user.email,
      name:        user.name,
      role:        user.role,
      franchiseId: user.franchiseId,
      branchId:    user.branchId,
      isActive:    user.isActive,
      createdAt:   user.createdAt,
    };
  }
}
