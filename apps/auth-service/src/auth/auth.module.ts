// apps/auth-service/src/auth/auth.module.ts

import { Module }          from '@nestjs/common';
import { JwtModule }       from '@nestjs/jwt';
import { ConfigService }   from '@nestjs/config';
import { MongooseModule }  from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

import { UserModel, UserSchema }         from './infrastructure/persistence/user.schema';
import { MongoUserRepository }           from './infrastructure/persistence/mongo-user.repository';
import { USER_REPOSITORY }               from './domain/repositories/user.repository.interface';
import { RegisterUseCase }               from './application/use-cases/register.use-case';
import { LoginUseCase }                  from './application/use-cases/login.use-case';
import { ChangePasswordUseCase }         from './application/use-cases/change-password.use-case';
import { AuthController }                from './presentation/auth.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),

    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repositories (DI token → concrete)
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },

    // Event publisher — use InMemory for now; swap to KafkaEventPublisher later
    { provide: EVENT_PUBLISHER, useClass: InMemoryEventPublisher },

    // Use cases
    RegisterUseCase,
    LoginUseCase,
    ChangePasswordUseCase,
  ],
  exports: [JwtModule],  // exported so other modules can verify JWTs
})
export class AuthModule {}
