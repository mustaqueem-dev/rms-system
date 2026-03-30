// packages/shared-kernel/src/core/domain-event.ts

import { UniqueEntityId } from './unique-entity-id';

export interface IDomainEvent {
  readonly occurredAt: Date;
  readonly eventId:    string;
  readonly eventName:  string;
  readonly aggregateId: string;
  readonly version:    number;
}

export abstract class DomainEvent implements IDomainEvent {
  readonly occurredAt:  Date;
  readonly eventId:     string;
  readonly version:     number = 1;

  abstract readonly eventName: string;
  abstract readonly aggregateId: string;

  constructor() {
    this.occurredAt = new Date();
    this.eventId    = new UniqueEntityId().value;
  }
}