// packages/shared-kernel/src/core/identifier.ts

export class Identifier<T> {
  constructor(private readonly _value: T) {
    this._value = _value;
  }

  equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.value === this.value;
  }

  toString() {
    return String(this._value);
  }

  get value(): T {
    return this._value;
  }
}
