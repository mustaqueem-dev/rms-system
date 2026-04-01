// apps/notification-service/src/notifications/infrastructure/channels/whatsapp.channel.ts
//
// WhatsApp Business Cloud API integration (Meta Graph API).
// Config keys: notification.whatsappToken, notification.whatsappPhoneId
// Falls back to console log when no token is configured (dev mode).

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';

export interface WhatsAppTextMessage {
  to:      string;   // E.164 phone number
  body:    string;
  preview?: boolean;
}

@Injectable()
export class WhatsAppChannel {
  private readonly logger  = new Logger(WhatsAppChannel.name);
  private readonly token:   string;
  private readonly phoneId: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.token   = config.get<string>('notification.whatsappToken', '');
    this.phoneId = config.get<string>('notification.whatsappPhoneId', '');
    this.enabled = !!this.token && !!this.phoneId;
  }

  async sendText(msg: WhatsAppTextMessage): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[DEV] WhatsApp → ${msg.to}: ${msg.body}`);
      return;
    }

    const url  = `https://graph.facebook.com/v18.0/${this.phoneId}/messages`;
    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      to:                msg.to,
      type:              'text',
      text:              { body: msg.body, preview_url: msg.preview ?? false },
    });

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`WhatsApp send failed for ${msg.to}: ${error}`);
      throw new Error(`WhatsApp API error: ${res.status}`);
    }

    this.logger.log(`WhatsApp message sent to ${msg.to}`);
  }
}
