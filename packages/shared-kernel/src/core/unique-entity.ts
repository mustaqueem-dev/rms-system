// packages/shared-kernel/src/core/unique-entity-id.ts

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class UniqueEntityId {
  private readonly _value: string;

  constructor(id?: string) {
    if (id) {
      if (!uuidValidate(id)) {
        throw new Error(`Invalid UUID provided: ${id}`);
      }
      this._value = id;
    } else {
      this._value = uuidv4();
    }
    Object.freeze(this);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UniqueEntityId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}