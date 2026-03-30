// apps/auth-service/src/auth/domain/value-objects/email.vo.ts

import { ValueObject, Result, Guard } from '@rms/shared-kernel';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Result<Email, string> {
    const notEmpty = Guard.againstEmptyString(email, 'email');
    if (notEmpty.isFailure) return Result.fail(notEmpty.error);

    const normalized = email.toLowerCase().trim();

    if (!Email.EMAIL_REGEX.test(normalized)) {
      return Result.fail(`'${email}' is not a valid email address`);
    }

    return Result.ok(new Email({ value: normalized }));
  }
}
