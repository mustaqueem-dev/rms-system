// apps/notification-service/src/notifications/notifications.module.ts

import { Module }               from '@nestjs/common';
import { BullModule }           from '@nestjs/bullmq';
import { KafkaConsumerService } from './infrastructure/kafka/kafka-consumer.service';
import { NotificationWorker }   from './application/workers/notification.worker';
import { WhatsAppChannel }      from './infrastructure/channels/whatsapp.channel';
import { EmailChannel }         from './infrastructure/channels/email.channel';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications-queue' }),
  ],
  providers: [
    // Channels
    WhatsAppChannel,
    EmailChannel,

    // Kafka infrastructure
    KafkaConsumerService,

    // BullMQ worker
    NotificationWorker,
  ],
})
export class NotificationsModule {}
