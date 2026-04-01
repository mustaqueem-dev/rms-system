// apps/auth-service/src/auth/auth.module.ts

import { Module }          from '@nestjs/common';
import { JwtModule }       from '@nestjs/jwt';
import { PassportModule }  from '@nestjs/passport';
import { ConfigService }   from '@nestjs/config';
import { MongooseModule }  from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

import { UserModel, UserSchema }             from './infrastructure/persistence/user.schema';
import { MongoUserRepository }               from './infrastructure/persistence/mongo-user.repository';
import { JwtStrategy }                       from './infrastructure/jwt.strategy';
import { USER_REPOSITORY }                   from './domain/repositories/user.repository.interface';

import { RegisterUseCase }                   from './application/use-cases/register.use-case';
import { LoginUseCase }                      from './application/use-cases/login.use-case';
import { ChangePasswordUseCase }             from './application/use-cases/change-password.use-case';
import { RefreshTokenUseCase }               from './application/use-cases/refresh-token.use-case';
import { GetProfileUseCase }                 from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase }              from './application/use-cases/update-profile.use-case';
import { ForgotPasswordUseCase }             from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase }              from './application/use-cases/reset-password.use-case';

import { AuthController }                    from './presentation/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),

    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        // Access tokens: 15 min (SRS NFR-S04)
        signOptions: { expiresIn: config.get<string>('app.jwtExpiresIn', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repositories (DI token → concrete)
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },

    // Passport JWT strategy
    JwtStrategy,

    // Event publisher — swap to KafkaEventPublisher when messaging is wired
    { provide: EVENT_PUBLISHER, useClass: InMemoryEventPublisher },

    // Use cases
    RegisterUseCase,
    LoginUseCase,
    ChangePasswordUseCase,
    RefreshTokenUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
