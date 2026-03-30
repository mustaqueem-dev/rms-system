// packages/shared-kernel/src/core/base-entity.ts

import { UniqueEntityId } from './unique-entity-id';
import { DomainEvent }    from './domain-event';

export abstract class BaseEntity<TProps> {
  private readonly _id:           UniqueEntityId;
  private readonly _domainEvents: DomainEvent[] = [];
  protected props:                TProps;

  protected constructor(props: TProps, id?: string) {
    this._id    = new UniqueEntityId(id);
    this.props  = props;
  }

  get id(): string {
    return this._id.value;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];   // return a copy — never expose the mutable array
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  equals(other?: BaseEntity<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this._id.equals(other._id);
  }
}