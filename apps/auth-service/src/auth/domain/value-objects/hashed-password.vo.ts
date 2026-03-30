// apps/auth-service/src/auth/domain/value-objects/hashed-password.vo.ts

import { ValueObject, Result, Guard } from '@rms/shared-kernel';
import * as bcrypt                    from 'bcrypt';

interface HashedPasswordProps {
  value: string; // bcrypt hash string
}

export class HashedPassword extends ValueObject<HashedPasswordProps> {
  private static readonly SALT_ROUNDS = 12;

  /** Min length enforced on the RAW plaintext before hashing */
  private static readonly MIN_LENGTH = 8;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: HashedPasswordProps) {
    super(props);
  }

  /**
   * Hash a raw plaintext password and return a HashedPassword VO.
   * Use this on registration / password-change.
   */
  static async createFromPlain(plain: string): Promise<Result<HashedPassword, string>> {
    const lengthCheck = Guard.minLength(plain, HashedPassword.MIN_LENGTH, 'password');
    if (lengthCheck.isFailure) return Result.fail(lengthCheck.error);

    // Basic complexity: at least 1 digit and 1 uppercase
    if (!/\d/.test(plain)) {
      return Result.fail('password must contain at least one digit');
    }
    if (!/[A-Z]/.test(plain)) {
      return Result.fail('password must contain at least one uppercase letter');
    }

    const hash = await bcrypt.hash(plain, HashedPassword.SALT_ROUNDS);
    return Result.ok(new HashedPassword({ value: hash }));
  }

  /**
   * Wrap an already-hashed value (e.g. loaded from DB).
   */
  static fromHash(hash: string): Result<HashedPassword, string> {
    const check = Guard.againstEmptyString(hash, 'passwordHash');
    if (check.isFailure) return Result.fail(check.error);
    return Result.ok(new HashedPassword({ value: hash }));
  }

  async compare(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.props.value);
  }
}
