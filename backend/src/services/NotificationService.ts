export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH'
}

interface NotificationPayload {
  to: string;
  message: string;
  channel: NotificationChannel;
}

/**
 * Abstraction layer for Notification Providers.
 * This ensures we don't hardcode a specific provider (like Twilio or AWS SNS)
 * directly into the business logic.
 */
export class NotificationService {
  
  static async send(payload: NotificationPayload): Promise<boolean> {
    switch (payload.channel) {
      case NotificationChannel.WHATSAPP:
        return this.sendWhatsApp(payload.to, payload.message);
      case NotificationChannel.SMS:
        return this.sendSMS(payload.to, payload.message);
      case NotificationChannel.EMAIL:
        return this.sendEmail(payload.to, payload.message);
      case NotificationChannel.PUSH:
        return this.sendPush(payload.to, payload.message);
      default:
        throw new Error('Unsupported notification channel');
    }
  }

  private static async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    console.log(`[WhatsApp Provider Mock] Sending to ${phone}: ${message}`);
    // Integrate with WhatsApp Business API / Twilio here
    return true;
  }

  private static async sendSMS(phone: string, message: string): Promise<boolean> {
    console.log(`[SMS Provider Mock] Sending to ${phone}: ${message}`);
    // Integrate with AWS SNS / Twilio here
    return true;
  }

  private static async sendEmail(email: string, message: string): Promise<boolean> {
    console.log(`[Email Provider Mock] Sending to ${email}: ${message}`);
    // Integrate with SendGrid / SES here
    return true;
  }

  private static async sendPush(deviceId: string, message: string): Promise<boolean> {
    console.log(`[FCM Mock] Sending push to ${deviceId}: ${message}`);
    // Integrate with Firebase Cloud Messaging here
    return true;
  }
}
