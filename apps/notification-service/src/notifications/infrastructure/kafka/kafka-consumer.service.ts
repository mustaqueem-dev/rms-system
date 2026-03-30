// apps/notification-service/src/notifications/infrastructure/kafka/kafka-consumer.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService }     from '@nestjs/config';
import { InjectQueue }       from '@nestjs/bullmq';
import { Queue }             from 'bullmq';
import { Kafka, Consumer }   from 'kafkajs';
import { ConsoleLogger }     from '@rms/shared-kernel';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka:    Kafka;
  private consumer: Consumer;
  private logger = new ConsoleLogger({ service: 'KafkaConsumer' });

  constructor(
    private config: ConfigService,
    @InjectQueue('notifications-queue') private notificationQueue: Queue
  ) {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers:  this.config.get<string[]>('notification.kafkaBrokers')!,
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    this.logger.info('Connected to Kafka');

    // Ensure topics exist before subscribing
    const admin = this.kafka.admin();
    await admin.connect();
    try {
      await admin.createTopics({
        topics: [
          { topic: 'order.placed' },
          { topic: 'inventory.stock.low' }
        ]
      });
      this.logger.info('Created required Kafka topics');
    } catch (error) {
       this.logger.info('Topics likely already exist', { error });
    } finally {
      await admin.disconnect();
    }

    // Subscribe to domain events we care about
    await this.consumer.subscribe({ topic: 'order.placed', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'inventory.stock.low', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        const eventData = JSON.parse(message.value.toString());

        this.logger.info(`Received event`, { topic, eventId: eventData.eventId });

        if (topic === 'order.placed') {
          // Enqueue job for background processing + retries
          await this.notificationQueue.add('send-order-confirmation', {
            orderId:     eventData.aggregateId,
            branchId:    eventData.branchId,
            totalAmount: eventData.totalAmount,
          }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
        }

        if (topic === 'inventory.stock.low') {
          await this.notificationQueue.add('send-low-stock-alert', {
            itemId:       eventData.aggregateId,
            branchId:     eventData.branchId,
            currentQty:   eventData.currentQty,
            reorderLevel: eventData.reorderLevel,
          });
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
