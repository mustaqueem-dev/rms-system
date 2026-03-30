// packages/shared-kernel/src/core/guard.ts

import { Result } from './result';

export interface GuardArgument {
  argument: unknown;
  argumentName: string;
}

export class Guard {
  static againstNullOrUndefined(
    argument: unknown,
    argumentName: string
  ): Result<void, string> {
    if (argument === null || argument === undefined) {
      return Result.fail(`${argumentName} is null or undefined`);
    }
    return Result.ok();
  }

  static againstNullOrUndefinedBulk(
    args: GuardArgument[]
  ): Result<void, string> {
    for (const { argument, argumentName } of args) {
      const result = Guard.againstNullOrUndefined(argument, argumentName);
      if (result.isFailure) return result;
    }
    return Result.ok();
  }

  static isOneOf<T>(
    value: T,
    validValues: T[],
    argumentName: string
  ): Result<void, string> {
    if (!validValues.includes(value)) {
      return Result.fail(
        `${argumentName} is not one of the allowed values: ${validValues.join(', ')}`
      );
    }
    return Result.ok();
  }

  static inRange(
    num: number,
    min: number,
    max: number,
    argumentName: string
  ): Result<void, string> {
    if (num < min || num > max) {
      return Result.fail(
        `${argumentName} must be between ${min} and ${max}. Got: ${num}`
      );
    }
    return Result.ok();
  }

  static againstEmptyString(
    value: string,
    argumentName: string
  ): Result<void, string> {
    if (!value || value.trim().length === 0) {
      return Result.fail(`${argumentName} must not be empty`);
    }
    return Result.ok();
  }

  static minLength(
    value: string,
    min: number,
    argumentName: string
  ): Result<void, string> {
    if (value.trim().length < min) {
      return Result.fail(
        `${argumentName} must be at least ${min} characters`
      );
    }
    return Result.ok();
  }

  static maxLength(
    value: string,
    max: number,
    argumentName: string
  ): Result<void, string> {
    if (value.trim().length > max) {
      return Result.fail(
        `${argumentName} must be at most ${max} characters`
      );
    }
    return Result.ok();
  }
}