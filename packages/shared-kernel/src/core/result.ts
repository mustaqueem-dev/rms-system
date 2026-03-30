// packages/shared-kernel/src/core/result.ts

export class Result<T, E = string> {
  private readonly _isSuccess: boolean;
  private readonly _error:     E | null;
  private readonly _value:     T | null;

  private constructor(isSuccess: boolean, error?: E, value?: T) {
    this._isSuccess = isSuccess;
    this._error     = error ?? null;
    this._value     = value ?? null;

    Object.freeze(this);
  }

  get isSuccess(): boolean { return this._isSuccess; }
  get isFailure(): boolean { return !this._isSuccess; }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error(
        'Cannot get value of a failed Result. Check isSuccess before accessing value.'
      );
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error(
        'Cannot get error of a successful Result. Check isFailure before accessing error.'
      );
    }
    return this._error as E;
  }

  static ok<T, E = string>(value?: T): Result<T, E> {
    return new Result<T, E>(true, undefined, value);
  }

  static fail<T, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(false, error);
  }

  // Chain: if success, run fn; if failure, pass through
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) return Result.fail<U, E>(this.error);
    return Result.ok<U, E>(fn(this.value));
  }

  // FlatMap: fn itself returns a Result
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) return Result.fail<U, E>(this.error);
    return fn(this.value);
  }

  // Collect: fail fast on the first failure in an array
  static combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
    for (const r of results) {
      if (r.isFailure) return Result.fail<T[], E>(r.error);
    }
    return Result.ok<T[], E>(results.map((r) => r.value));
  }
}