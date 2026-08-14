/**
 * AlgeriaTrade Email Service
 * 
 * Complete email notification system for B2B e-commerce platform.
 * Supports Resend (production) and development mode (console logging).
 * 
 * @module lib/email/service
 */

import { db } from '@/lib/db';
import { EmailType, EmailStatus } from '@prisma/client';

// ============================================
// Types & Interfaces
// ============================================

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SendEmailOptions {
  userId?: string;
  type: EmailType;
  to: string;
  subject: string;
  html: string;
  text?: string;
  priority?: 'low' | 'normal' | 'high';
  sendAt?: Date; // For scheduled sends
  metadata?: Record<string, string>;
}

export interface EmailTemplateProps {
  [key: string]: any;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }>;
  getName(): string;
}

// ============================================
// Configuration
// ============================================

export const EMAIL_CONFIG = {
  provider: process.env.EMAIL_PROVIDER || 'development', // 'resend' | 'nodemailer' | 'development'
  from: process.env.EMAIL_FROM || 'AlgeriaTrade <noreply@algeriatrade.dz>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@algeriatrade.dz',
  appName: 'AlgeriaTrade',
  appUrl: process.env.APP_URL || 'https://algeriatrade.dz',
  
  // Resend configuration
  resendApiKey: process.env.RESEND_API_KEY,
  
  // SMTP configuration (Nodemailer)
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  
  // Rate limiting
  maxEmailsPerMinute: parseInt(process.env.MAX_EMAILS_PER_MINUTE || '10'),
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '100'),
  
  // Branding colors
  brandColor: '#006233', // Algerian green
  brandColorLight: '#008C45',
  textColor: '#333333',
  lightGray: '#F5F5F5',
  borderGray: '#E0E0E0',
} as const;

// ============================================
// Development Provider (Console Logging)
// ============================================

class DevelopmentEmailProvider implements EmailProvider {
  getName(): string {
    return 'Development (Console)';
  }

  async send(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    const timestamp = new Date().toISOString();
    
    console.log('\n' + '='.repeat(80));
    console.log(`📧 EMAIL SENT [${timestamp}]`);
    console.log('='.repeat(80));
    console.log(`To: ${payload.to}`);
    console.log(`From: ${payload.from || EMAIL_CONFIG.from}`);
    console.log(`Subject: ${payload.subject}`);
    console.log('-'.repeat(80));
    console.log('HTML Preview (first 500 chars):');
    console.log(payload.html.substring(0, 500) + (payload.html.length > 500 ? '...' : ''));
    if (payload.text) {
      console.log('-'.repeat(80));
      console.log('Text Version:');
      console.log(payload.text);
    }
    console.log('='.repeat(80) + '\n');

    return { success: true, id: `dev_${Date.now()}` };
  }
}

// ============================================
// Resend Provider (Production)
// ============================================

class ResendEmailProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'Resend';
  }

  async send(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { default: Resend } = await import('resend');
      const resend = new Resend(this.apiKey);

      const { data, error } = await resend.emails.send({
        from: payload.from || EMAIL_CONFIG.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        cc: payload.cc,
        bcc: payload.bcc,
        replyTo: payload.replyTo || EMAIL_CONFIG.replyTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================
// Nodemailer Provider (SMTP)
// ============================================

class NodemailerEmailProvider implements EmailProvider {
  private transport: any;

  constructor() {
    // Lazy load nodemailer
  }

  private async getTransport() {
    if (!this.transport) {
      const nodemailer = await import('nodemailer');
      this.transport = nodemailer.createTransport({
        host: EMAIL_CONFIG.smtpHost,
        port: EMAIL_CONFIG.smtpPort,
        secure: EMAIL_CONFIG.smtpPort === 465,
        auth: {
          user: EMAIL_CONFIG.smtpUser,
          pass: EMAIL_CONFIG.smtpPass,
        },
      });
    }
    return this.transport;
  }

  getName(): string {
    return `SMTP (${EMAIL_CONFIG.smtpHost})`;
  }

  async send(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const transport = await this.getTransport();
      const info = await transport.sendMail({
        from: payload.from || EMAIL_CONFIG.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        cc: payload.cc?.join(', '),
        bcc: payload.bcc?.join(', '),
        replyTo: payload.replyTo || EMAIL_CONFIG.replyTo,
      });

      return { success: true, id: info.messageId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================
// Email Queue (In-Memory)
// ============================================

interface QueuedEmail {
  id: string;
  options: SendEmailOptions;
  createdAt: Date;
  sendAt?: Date;
  attempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
}

class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private intervalId: NodeJS.Timeout | null = null;
  private sentCount: number[] = []; // Track emails per minute

  constructor() {
    // Process queue every 30 seconds
    this.intervalId = setInterval(() => this.processQueue(), 30000);
    // Clean up old tracking every minute
    setInterval(() => {
      this.sentCount = this.sentCount.filter((_, i) => i < 59);
      this.sentCount.push(0);
    }, 60000);
  }

  add(options: SendEmailOptions): string {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id,
      options,
      createdAt: new Date(),
      sendAt: options.sendAt,
      attempts: 0,
      status: 'pending',
    });
    return id;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    const now = new Date();
    const pendingEmails = this.queue.filter(
      e => e.status === 'pending' && (!e.sendAt || e.sendAt <= now)
    );

    for (const email of pendingEmails) {
      // Check rate limiting
      const totalThisMinute = this.sentCount.reduce((a, b) => a + b, 0);
      if (totalThisMinute >= EMAIL_CONFIG.maxEmailsPerMinute) {
        break;
      }

      email.status = 'processing';
      
      try {
        const result = await emailService.sendRaw(email.options);
        if (result.success) {
          email.status = 'sent';
          this.sentCount[this.sentCount.length - 1]++;
        } else {
          email.attempts++;
          if (email.attempts >= 3) {
            email.status = 'failed';
          } else {
            email.status = 'pending'; // Retry later
          }
        }
      } catch (error) {
        email.attempts++;
        if (email.attempts >= 3) {
          email.status = 'failed';
        } else {
          email.status = 'pending';
        }
      }
    }

    // Clean up processed emails older than 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    this.queue = this.queue.filter(e => 
      !(e.status === 'sent' && e.createdAt < oneHourAgo)
    );

    this.processing = false;
  }

  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(e => e.status === 'pending').length,
      processing: this.queue.filter(e => e.status === 'processing').length,
      sent: this.queue.filter(e => e.status === 'sent').length,
      failed: this.queue.filter(e => e.status === 'failed').length,
    };
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// ============================================
// Main Email Service
// ============================================

let providerInstance: EmailProvider | null = null;
let queueInstance: EmailQueue | null = null;

function getProvider(): EmailProvider {
  if (!providerInstance) {
    switch (EMAIL_CONFIG.provider) {
      case 'resend':
        if (!EMAIL_CONFIG.resendApiKey) {
          console.warn('Resend API key not configured. Falling back to development mode.');
          providerInstance = new DevelopmentEmailProvider();
        } else {
          providerInstance = new ResendEmailProvider(EMAIL_CONFIG.resendApiKey);
        }
        break;
      case 'nodemailer':
        providerInstance = new NodemailerEmailProvider();
        break;
      default:
        providerInstance = new DevelopmentEmailProvider();
    }
  }
  return providerInstance;
}

function getQueue(): EmailQueue {
  if (!queueInstance) {
    queueInstance = new EmailQueue();
  }
  return queueInstance;
}

export const emailService = {
  /**
   * Get current provider name
   */
  getProviderName(): string {
    return getProvider().getName();
  },

  /**
   * Send an email with full options and logging
   */
  async send(options: SendEmailOptions): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      // Create email log entry
      const log = await db.emailLog.create({
        data: {
          userId: options.userId,
          emailType: options.type,
          toEmail: options.to,
          subject: options.subject,
          status: EmailStatus.PENDING,
        },
      });

      // Check for scheduled send
      if (options.sendAt && options.sendAt > new Date()) {
        getQueue().add(options);
        return { success: true, logId: log.id };
      }

      // Send immediately
      const result = await this.sendRaw(options);

      // Update log with result
      await db.emailLog.update({
        where: { id: log.id },
        data: {
          status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
          providerId: result.id,
          errorMessage: result.error,
          sentAt: result.success ? new Date() : null,
        },
      });

      return { 
        success: result.success, 
        logId: log.id, 
        error: result.error 
      };
    } catch (error: any) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Raw send without logging (used by queue)
   */
  async sendRaw(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const provider = getProvider();
    
    const payload: EmailPayload = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: EMAIL_CONFIG.replyTo,
    };

    return provider.send(payload);
  },

  /**
   * Send email to multiple recipients (batch)
   */
  async batchSend(
    recipients: Array<{ userId?: string; email: string }>,
    type: EmailType,
    subject: string,
    htmlGenerator: (email: string) => { html: string; text?: string },
    delayMs: number = 1000
  ): Promise<{ total: number; successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const { html, text } = htmlGenerator(recipient.email);
      
      const result = await this.send({
        userId: recipient.userId,
        type,
        to: recipient.email,
        subject,
        html,
        text,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Rate limiting delay
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { total: recipients.length, successful, failed };
  },

  /**
   * Get email logs for a user or admin view
   */
  async getEmailLogs(options: {
    userId?: string;
    status?: EmailStatus;
    type?: EmailType;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.status) where.status = options.status;
    if (options.type) where.emailType = options.type;

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
        skip: options.offset || 0,
      }),
      db.emailLog.count({ where }),
    ]);

    return { logs, total };
  },

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return getQueue().getStats();
  },

  /**
   * Check user's email preferences before sending
   */
  async shouldSendEmail(userId: string, category: 'auth' | 'rfq' | 'order' | 'message' | 'system' | 'marketing'): Promise<boolean> {
    try {
      const preference = await db.emailPreference.findUnique({
        where: { userId },
      });

      if (!preference) return true; // Default to sending if no preferences set
      if (!preference.emailEnabled) return false;
      if (!preference.marketingEmails && category === 'marketing') return false;

      switch (category) {
        case 'auth': return preference.authEmails;
        case 'rfq': return preference.rfqEmails;
        case 'order': return preference.orderEmails;
        case 'message': return preference.messageEmails;
        case 'system': return preference.systemEmails;
        case 'marketing': return preference.marketingEmails;
        default: return true;
      }
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return true; // Default to sending on error
    }
  },

  /**
   * Get or create user email preferences
   */
  async getUserPreferences(userId: string) {
    let preference = await db.emailPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      preference = await db.emailPreference.create({
        data: { userId },
      });
    }

    return preference;
  },

  /**
   * Update user email preferences
   */
  async updateUserPreferences(
    userId: string,
    data: {
      emailEnabled?: boolean;
      marketingEmails?: boolean;
      authEmails?: boolean;
      rfqEmails?: boolean;
      orderEmails?: boolean;
      messageEmails?: boolean;
      systemEmails?: boolean;
      digestFrequency?: string;
    }
  ) {
    return db.emailPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
  },

  /**
   * Handle unsubscribe request
   */
  async unsubscribe(token: string) {
    const preference = await db.emailPreference.findFirst({
      where: { unsubscribeToken: token },
    });

    if (!preference) {
      return { success: false, error: 'Token invalide' };
    }

    await db.emailPreference.update({
      where: { id: preference.id },
      data: {
        emailEnabled: false,
        unsubscribedAt: new Date(),
      },
    });

    return { success: true };
  },

  /**
   * Generate unsubscribe URL
   */
  getUnsubscribeUrl(token: string): string {
    return `${EMAIL_CONFIG.appUrl}/api/email/unsubscribe?token=${token}`;
  },
};

// Export configuration for use in templates
export { EMAIL_CONFIG };

export default emailService;
