// apps/notification-service/src/notifications/infrastructure/kafka/kafka-consumer.service.ts
//
// Kafka consumer — subscribes to domain events and enqueues BullMQ jobs
// for the NotificationWorker to dispatch via WhatsApp / Email channels.

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService }     from '@nestjs/config';
import { InjectQueue }       from '@nestjs/bullmq';
import { Queue }             from 'bullmq';
import { Kafka, Consumer }   from 'kafkajs';
import { ConsoleLogger }     from '@rms/shared-kernel';

const RETRY_OPTIONS = { attempts: 3, backoff: { type: 'exponential', delay: 2000 } } as const;

const TOPICS = [
  'order.placed',
  'order.cancelled',
  'inventory.stock.low',
  'reservation.created.v1',
] as const;

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka:    Kafka;
  private consumer: Consumer;
  private logger = new ConsoleLogger({ service: 'KafkaConsumer' });

  constructor(
    private config: ConfigService,
    @InjectQueue('notifications-queue') private notificationQueue: Queue,
  ) {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers:  this.config.get<string[]>('notification.kafkaBrokers')!,
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-group' });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    this.logger.info('Connected to Kafka');

    // Ensure topics exist (no-op if already present)
    const admin = this.kafka.admin();
    await admin.connect();
    try {
      await admin.createTopics({ topics: TOPICS.map((topic) => ({ topic })) });
      this.logger.info('Kafka topics ready');
    } catch {
      this.logger.info('Topics likely already exist');
    } finally {
      await admin.disconnect();
    }

    for (const topic of TOPICS) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;
        const ev = JSON.parse(message.value.toString());
        this.logger.info(`Received event`, { topic, eventId: ev.eventId });
        await this.dispatch(topic, ev);
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  // ── Job dispatch ────────────────────────────────────────────────────────────

  private async dispatch(topic: string, ev: Record<string, unknown>): Promise<void> {
    switch (topic) {
      case 'order.placed':
        await this.notificationQueue.add(
          'send-order-confirmation',
          {
            orderId:     ev['aggregateId'],
            branchId:    ev['branchId'],
            totalAmount: ev['totalAmount'],
            customerPhone: ev['customerPhone'],
            customerEmail: ev['customerEmail'],
          },
          RETRY_OPTIONS,
        );
        break;

      case 'order.cancelled':
        await this.notificationQueue.add(
          'send-order-cancelled',
          {
            orderId:       ev['aggregateId'],
            branchId:      ev['branchId'],
            reason:        ev['reason'] ?? 'No reason provided',
            customerPhone: ev['customerPhone'],
            customerEmail: ev['customerEmail'],
          },
          RETRY_OPTIONS,
        );
        break;

      case 'inventory.stock.low':
        await this.notificationQueue.add(
          'send-low-stock-alert',
          {
            itemId:        ev['aggregateId'],
            itemName:      ev['itemName'],
            branchId:      ev['branchId'],
            currentQty:    ev['currentQty'],
            reorderLevel:  ev['reorderLevel'],
            managerPhone:  ev['managerPhone'],
            managerEmail:  ev['managerEmail'],
          },
          RETRY_OPTIONS,
        );
        break;

      case 'reservation.created.v1':
        await this.notificationQueue.add(
          'send-reservation-confirmation',
          {
            reservationId: ev['aggregateId'],
            branchId:      ev['branchId'],
            guestName:     ev['guestName'],
            guestPhone:    ev['guestPhone'],
            tableNumber:   ev['tableNumber'],
            scheduledAt:   ev['scheduledAt'],
          },
          RETRY_OPTIONS,
        );
        break;

      default:
        this.logger.warn(`Unhandled topic: ${topic}`);
    }
  }
}
