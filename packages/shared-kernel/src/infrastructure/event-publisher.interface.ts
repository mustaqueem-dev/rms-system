// packages/shared-kernel/src/infrastructure/event-publisher.interface.ts

import { DomainEvent } from '../core/domain-event';

export const EVENT_PUBLISHER = Symbol('IEventPublisher');

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}