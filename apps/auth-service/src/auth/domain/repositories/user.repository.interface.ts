// apps/auth-service/src/auth/domain/repositories/user.repository.interface.ts

import { User } from '../user.entity';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}
