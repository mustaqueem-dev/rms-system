// packages/shared-kernel/src/infrastructure/in-memory-event-publisher.ts

import { IEventPublisher } from './event-publisher.interface';
import { DomainEvent }     from '../core/domain-event';

export class InMemoryEventPublisher implements IEventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  clear(): void {
    this.published.length = 0;
  }

  getByName(eventName: string): DomainEvent[] {
    return this.published.filter((e) => e.eventName === eventName);
  }
}