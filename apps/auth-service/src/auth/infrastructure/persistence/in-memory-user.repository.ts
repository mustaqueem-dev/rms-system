// apps/auth-service/src/auth/infrastructure/persistence/in-memory-user.repository.ts
//
// In-memory implementation of IUserRepository — used exclusively in unit tests.
// Zero infrastructure dependencies — all state lives in a Map.

import { User }           from '../../domain/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email === email.toLowerCase()) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }

  async update(user: User): Promise<void> {
    if (!this.store.has(user.id)) {
      throw new Error(`InMemoryUserRepository: user ${user.id} not found for update`);
    }
    this.store.set(user.id, user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  /** Test helper — reset state between tests */
  clear(): void {
    this.store.clear();
  }

  /** Test helper — seed a user directly */
  seed(user: User): void {
    this.store.set(user.id, user);
  }
}
