// packages/shared-kernel/src/core/unique-entity-id.ts

import { v4 as uuidv4 } from 'uuid';
import { Identifier } from './identifier';

export class UniqueEntityId extends Identifier<string> {
  constructor(id?: string) {
    super(id ? id : uuidv4());
  }
}
