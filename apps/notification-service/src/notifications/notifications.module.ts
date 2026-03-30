// apps/notification-service/src/notifications/notifications.module.ts

import { Module }               from '@nestjs/common';
import { BullModule }           from '@nestjs/bullmq';
import { KafkaConsumerService } from './infrastructure/kafka/kafka-consumer.service';
import { NotificationWorker }   from './application/workers/notification.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications-queue',
    }),
  ],
  providers: [
    KafkaConsumerService,
    NotificationWorker,
  ],
})
export class NotificationsModule {}
