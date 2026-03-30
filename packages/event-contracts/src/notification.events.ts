// packages/event-contracts/src/notification.events.ts

export const NOTIFICATION_EVENTS = {
  SENT:    'notification.sent.v1',
  FAILED:  'notification.failed.v1',
} as const;

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'PUSH' | 'EMAIL';

export interface NotificationSentPayload {
  notificationId: string;
  channel:        NotificationChannel;
  recipientId:    string;
  recipientPhone?: string;
  recipientEmail?: string;
  templateId:     string;
  branchId:       string;
  franchiseId:    string;
  occurredAt:     string;
}

export interface NotificationFailedPayload {
  notificationId: string;
  channel:        NotificationChannel;
  recipientId:    string;
  reason:         string;
  retryCount:     number;
  occurredAt:     string;
}
