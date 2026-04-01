// packages/shared-kernel/src/infrastructure/kafka-publisher.ts
//
// Kafka-backed implementation of IEventPublisher.
// Uses a generic emit client so we avoid needing @nestjs/microservices at compile time.

import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { DomainEvent } from '../core/domain-event';
import { IEventPublisher } from './event-publisher.interface';
import { ConsoleLogger } from './logger';

/**
 * Minimal interface for a Kafka emit client.
 * Compatible with ClientKafka from @nestjs/microservices.
 */
export interface IKafkaClient {
  connect(): Promise<void>;
  close(): Promise<void>;
  emit(pattern: string, data: unknown): { subscribe(observer: { complete: () => void; error: (err: Error) => void }): void };
}

export class KafkaEventPublisher
  implements IEventPublisher, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new ConsoleLogger({ service: 'KafkaEventPublisher' });

  constructor(private readonly client: IKafkaClient) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.info('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
    this.logger.info('Kafka producer disconnected');
  }

  /**
   * Publish a single DomainEvent onto its Kafka topic.
   * The topic name is taken from `event.eventName`.
   */
  async publish(event: DomainEvent): Promise<void> {
    const topic = event.eventName;
    const message = {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      version: event.version,
    };

    await new Promise<void>((resolve, reject) => {
      this.client.emit(topic, { value: JSON.stringify(message) }).subscribe({
        complete: () => {
          this.logger.debug(`Event published`, { event: topic, aggregateId: event.aggregateId });
          resolve();
        },
        error: (err: Error) => {
          this.logger.error(`Failed to publish event`, err, {
            event: topic,
            aggregateId: event.aggregateId,
          });
          reject(err);
        },
      });
    });
  }

  /**
   * Publish multiple DomainEvents concurrently.
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e)));
  }
}
