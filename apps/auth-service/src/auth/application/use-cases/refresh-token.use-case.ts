// apps/auth-service/src/auth/application/use-cases/refresh-token.use-case.ts

import { Inject, Injectable }   from '@nestjs/common';
import { JwtService }           from '@nestjs/jwt';
import { UnauthorizedError }    from '@rms/shared-kernel';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

export interface RefreshTokenDto {
  userId: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new UnauthorizedError('User not found');
    if (!user.isActive) throw new UnauthorizedError('Account deactivated');

    const accessToken = await this.jwtService.signAsync({
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      franchiseId: user.franchiseId,
      branchId:    user.branchId,
    });

    return { accessToken };
  }
}
