// apps/notification-service/src/notifications/infrastructure/channels/email.channel.ts
//
// Email delivery via SMTP (nodemailer).  Falls back to console log in dev when
// no SMTP host is configured.
// Config keys: notification.smtpHost, notification.smtpPort,
//              notification.smtpUser, notification.smtpPass,
//              notification.emailFrom

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';

export interface EmailMessage {
  to:      string | string[];
  subject: string;
  html:    string;
  text?:   string;
}

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private readonly enabled: boolean;
  private readonly smtpConfig: {
    host: string; port: number; user: string; pass: string; from: string;
  };

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('notification.smtpHost', '');
    this.enabled = !!host;
    this.smtpConfig = {
      host,
      port: config.get<number>('notification.smtpPort', 587),
      user: config.get<string>('notification.smtpUser', ''),
      pass: config.get<string>('notification.smtpPass', ''),
      from: config.get<string>('notification.emailFrom', 'noreply@rms.local'),
    };
  }

  async send(msg: EmailMessage): Promise<void> {
    if (!this.enabled) {
      const to = Array.isArray(msg.to) ? msg.to.join(', ') : msg.to;
      this.logger.log(`[DEV] Email → ${to} | ${msg.subject}`);
      return;
    }

    // Lazy-require nodemailer to avoid import cost when disabled
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   this.smtpConfig.host,
      port:   this.smtpConfig.port,
      secure: this.smtpConfig.port === 465,
      auth:   { user: this.smtpConfig.user, pass: this.smtpConfig.pass },
    });

    await transporter.sendMail({
      from:    this.smtpConfig.from,
      to:      msg.to,
      subject: msg.subject,
      html:    msg.html,
      text:    msg.text,
    });

    const to = Array.isArray(msg.to) ? msg.to.join(', ') : msg.to;
    this.logger.log(`Email sent to ${to}: ${msg.subject}`);
  }
}
