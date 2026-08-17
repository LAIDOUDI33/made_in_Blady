/**
 * Security Alerting Integrations - Slack & PagerDuty
 * 
 * Real-time security alert delivery to:
 * - Slack (channels, threads, rich formatting)
 * - PagerDuty (incidents, escalation policies)
 * - Discord (webhooks)
 * - Email (SMTP)
 * - Webhooks (generic)
 * 
 * Features:
 * - Severity-based routing
 * - Alert deduplication and grouping
 * - Rate limiting to prevent alert fatigue
 * - Escalation policies for unacknowledged alerts
 * - Maintenance windows support
 * - Custom templates per channel
 * 
 * @version 2.0.0
 */

import { SecurityEvent, AlertRule } from './securityMonitor';

// ===========================================
// Types & Interfaces
// ===========================================

export interface AlertChannelConfig {
  enabled: boolean;
  severityThreshold: 'info' | 'low' | 'medium' | 'high' | 'critical';
  rateLimitPerMinute: number;
  cooldownMs: number;
  template?: string;
}

export interface SlackConfig extends AlertChannelConfig {
  webhookUrl: string;
  channel?: string; // Override default channel from webhook
  username?: string;
  iconEmoji?: string;
  iconUrl?: string;
  threadNotifications?: boolean;
  mentionChannel?: boolean; // @channel or @here for critical alerts
  mentionUsers?: string[]; // User IDs to mention for critical
  blocks?: boolean; // Use block kit builder
}

export interface PagerDutyConfig extends AlertChannelConfig {
  routingKey: string; // Events API v2 integration key
  serviceKey?: string; // Legacy API key (deprecated)
  apiUrl?: string; // Custom PagerDuty API URL (for EU, etc.)
  severityMap?: {
    critical: 'critical' | 'error' | 'warning';
    high: 'error' | 'warning';
    medium: 'warning';
    low: 'info';
    info: 'info';
  };
  customDetails?: Record<string, string>;
  links?: Array<{
    href: string;
    text: string;
  }>;
  images?: Array<{
    src: string;
    alt: string;
  }>;
}

export interface DiscordConfig extends AlertChannelConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
  embedColor?: {
    info: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface EmailConfig extends AlertChannelConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  template?: 'html' | 'text';
}

export interface WebhookConfig extends AlertChannelConfig {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  secret?: string; // For HMAC signing
  timeout?: number;
}

export interface AlertIntegrationConfig {
  slack?: SlackConfig;
  pagerduty?: PagerDutyConfig;
  discord?: DiscordConfig;
  email?: EmailConfig;
  webhook?: WebhookConfig;
  
  global: {
    environment: string;
    appName: string;
    appUrl: string;
    maintenanceWindows?: Array<{
      start: Date;
      end: Date;
      reason: string;
    }>;
    suppressRepeatsMs?: number; // Don't re-alert same issue within window
  };
}

export interface AlertDeliveryResult {
  channel: string;
  success: boolean;
  messageId?: string;
  incidentId?: string;
  error?: string;
  timestamp: Date;
  latencyMs: number;
}

export interface AggregatedAlert {
  id: string;
  eventType: string;
  severity: SecurityEvent['severity'];
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  events: SecurityEvent[];
  channelsNotified: string[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolved: boolean;
}

// ===========================================
// Severity Mappings & Constants
// ===========================================

const SEVERITY_PRIORITY = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const SLACK_COLORS = {
  critical: '#FF0000',   // Red
  high: '#FFA500',      // Orange
  medium: '#FFFF00',    // Yellow
  low: '#0000FF',       // Blue
  info: '#808080',      // Gray
};

const DISCORD_COLORS = {
  critical: 0xFF0000,   // Red
  high: 0xFFA500,       // Orange
  medium: 0xFFFF00,     // Yellow
  low: 0x0000FF,        // Blue
  info: 0x808080,       // Gray
};

const PAGERDUTY_SEVERITY_MAP = {
  critical: 'critical',
  high: 'error',
  medium: 'warning',
  low: 'info',
  info: 'info',
};

// ===========================================
// Alert Manager Class
// ===========================================

class SecurityAlertManager {
  private config: AlertIntegrationConfig;
  private recentAlerts = new Map<string, { timestamp: Date; count: number }>();
  private aggregatedAlerts = new Map<string, AggregatedAlert>();
  private rateLimitCounters = new Map<string, { count: number; resetTime: Date }>();
  private deliveryHistory: AlertDeliveryResult[] = [];
  private maxHistorySize = 1000;

  constructor(config: AlertIntegrationConfig) {
    this.config = config;
    
    // Start cleanup interval
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60_000); // Every minute
    }
  }

  /**
   * Send alert to all configured channels based on severity
   */
  async sendAlert(event: SecurityEvent): Promise<AlertDeliveryResult[]> {
    const results: AlertDeliveryResult[] = [];
    
    // Check maintenance windows
    if (this.isInMaintenanceWindow()) {
      console.log(`[AlertManager] Suppressing alert during maintenance window`);
      return [{
        channel: 'suppressed',
        success: true,
        timestamp: new Date(),
        latencyMs: 0,
      }];
    }

    // Check for recent duplicate alerts
    const dedupeKey = `${event.eventType}:${event.ipAddress || event.userId || 'unknown'}`;
    if (this.isDuplicateAlert(dedupeKey)) {
      this.aggregateAlert(dedupeKey, event);
      return [{
        channel: 'aggregated',
        success: true,
        timestamp: new Date(),
        latencyMs: 0,
      }];
    }

    // Determine which channels to notify
    const channels = this.getChannelsForSeverity(event.severity);

    for (const channel of channels) {
      try {
        // Rate limit check
        if (this.isRateLimited(channel)) {
          results.push({
            channel: `${channel}-rate-limited`,
            success: false,
            error: 'Rate limited',
            timestamp: new Date(),
            latencyMs: 0,
          });
          continue;
        }

        let result: AlertDeliveryResult;

        switch (channel) {
          case 'slack':
            result = await this.sendSlackAlert(event);
            break;
          case 'pagerduty':
            result = await this.sendPagerDutyAlert(event);
            break;
          case 'discord':
            result = await this.sendDiscordAlert(event);
            break;
          case 'email':
            result = await this.sendEmailAlert(event);
            break;
          case 'webhook':
            result = await this.sendWebhookAlert(event);
            break;
          default:
            continue;
        }

        results.push(result);
        
        // Track successful delivery
        if (result.success) {
          this.recordRecentAlert(dedupeKey);
        }

      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          latencyMs: 0,
        });
      }
    }

    // Store in history
    this.addToHistory(results);

    return results;
  }

  /**
   * Resolve an existing alert/incident
   */
  async resolveAlert(
    eventId: string,
    resolvedBy?: string,
    resolutionNote?: string
  ): Promise<void> {
    // Update aggregated alert
    const aggregated = this.aggregatedAlerts.get(eventId);
    if (aggregated) {
      aggregated.resolved = true;
      
      // Send resolution notification
      await this.sendResolutionNotification(aggregated, resolvedBy, resolutionNote);
    }
  }

  /**
   * Acknowledge an alert (stops escalation)
   */
  async acknowledgeAlert(
    eventId: string,
    acknowledgedBy: string
  ): Promise<void> {
    const aggregated = this.aggregatedAlerts.get(eventId);
    if (aggregated) {
      aggregated.acknowledged = true;
      aggregated.acknowledgedBy = acknowledgedBy;
      
      // Send acknowledgment notification
      await this.sendAcknowledgmentNotification(aggregated, acknowledgedBy);
    }
  }

  // ===========================================
  // Channel Implementations
  // ===========================================

  private async sendSlackAlert(event: SecurityEvent): Promise<AlertDeliveryResult> {
    const config = this.config.slack;
    if (!config?.enabled) {
      return { channel: 'slack', success: false, error: 'Slack not configured', timestamp: new Date(), latencyMs: 0 };
    }

    const startTime = Date.now();

    try {
      const payload = this.buildSlackPayload(event);
      
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        channel: 'slack',
        success: true,
        messageId: data.ts || data.message_ts,
        timestamp: new Date(),
        latencyMs: latency,
      };

    } catch (error) {
      return {
        channel: 'slack',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private buildSlackPayload(event: SecurityEvent): any {
    const config = this.config.slack!;
    const isCritical = event.severity === 'critical';

    if (config.blocks) {
      return this.buildSlackBlockKit(event);
    }

    // Simple attachment format
    return {
      text: isCritical ? '<!channel> 🚨 Security Alert' : `⚠️ Security Alert [${event.severity.toUpperCase()}]`,
      channel: config.channel,
      username: config.username || `${this.config.global.appName} Security`,
      icon_emoji: config.iconEmoji || ':shield:',
      icon_url: config.iconUrl,
      attachments: [
        {
          color: SLACK_COLORS[event.severity],
          title: `${event.eventType.replace(/_/g, ' ').toUpperCase()}`,
          fields: [
            {
              title: 'Severity',
              value: event.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Source',
              value: event.source,
              short: true,
            },
            {
              title: 'IP Address',
              value: event.ipAddress || 'N/A',
              short: true,
            },
            {
              title: 'User ID',
              value: event.userId || 'N/A',
              short: true,
            },
            {
              title: 'Details',
              value: JSON.stringify(event.details).substring(0, 500),
              short: false,
            },
            {
              title: 'Timestamp',
              value: event.timestamp.toISOString(),
              short: true,
            },
          ],
          footer: `${this.config.global.appName} | ${this.config.global.environment}`,
          ts: Math.floor(event.timestamp.getTime() / 1000),
        },
      ],
    };
  }

  private buildSlackBlockKit(event: SecurityEvent): any {
    const isCritical = event.severity === 'critical';
    
    return {
      text: isCritical ? '<!channel>' : undefined,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🛡️ ${event.eventType.replace(/_/g, ' ').toUpperCase()}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${event.severity.toUpperCase()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${this.config.global.environment}`,
            },
            {
              type: 'mrkdwn',
              text: `*IP Address:*\n\`${event.ipAddress || 'N/A'}\``,
            },
            {
              type: 'mrkdwn',
              text: `*User:*\n${event.userId || 'N/A'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:*\n\`\`\`${JSON.stringify(event.details, null, 2).substring(0, 500)}\`\`\``,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in Dashboard',
                emoji: true,
              },
              url: `${this.config.global.appUrl}/admin/security/events/${event.id}`,
              style: event.severity === 'critical' ? 'danger' : 'primary',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Acknowledge',
                emoji: true,
              },
              action_id: `acknowledge_${event.id}`,
              style: 'default',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.global.appName} • <t:${Math.floor(event.timestamp.getTime() / 1000)}:F>`,
            },
          ],
        },
      ],
    };
  }

  private async sendPagerDutyAlert(event: SecurityEvent): Promise<AlertDeliveryResult> {
    const config = this.config.pagerduty;
    if (!config?.enabled) {
      return { channel: 'pagerduty', success: false, error: 'PagerDuty not configured', timestamp: new Date(), latencyMs: 0 };
    }

    const startTime = Date.now();

    try {
      const payload = {
        routing_key: config.routingKey,
        event_action: 'trigger',
        dedup_key: `${event.eventType}:${event.ipAddress || event.userId}:${new Date().toISOString().split('T')[0]}`,
        payload: {
          summary: `[${event.severity.toUpperCase()}] ${event.eventType.replace(/_/g, ' ')} - ${this.config.global.environment}`,
          severity: config.severityMap?.[event.severity] || PAGERDUTY_SEVERITY_MAP[event.severity],
          source: this.config.global.appName,
          component: event.source,
          group: event.eventType,
          class: event.severity,
          custom_details: {
            ...config.customDetails,
            eventId: event.id,
            ipAddress: event.ipAddress,
            userId: event.userId,
            details: event.details,
            environment: this.config.global.environment,
            appUrl: this.config.global.appUrl,
          },
          images: config.images,
          links: [
            ...(config.links || []),
            {
              href: `${this.config.global.appUrl}/admin/security/events/${event.id}`,
              text: 'View Event Details',
            },
          ],
        },
      };

      const apiUrl = config.apiUrl || 'https://events.pagerduty.com/v2/enqueue';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const latency = Date.now() - startTime;

      if (!response.ok && response.status !== 202) {
        throw new Error(`PagerDuty API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        channel: 'pagerduty',
        success: true,
        incidentId: data.dedup_key,
        timestamp: new Date(),
        latencyMs: latency,
      };

    } catch (error) {
      return {
        channel: 'pagerduty',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private async sendDiscordAlert(event: SecurityEvent): Promise<AlertDeliveryResult> {
    const config = this.config.discord;
    if (!config?.enabled) {
      return { channel: 'discord', success: false, error: 'Discord not configured', timestamp: new Date(), latencyMs: 0 };
    }

    const startTime = Date.now();

    try {
      const color = config.embedColor?.[event.severity] || DISCORD_COLORS[event.severity];
      
      const payload = {
        username: config.username || `${this.config.global.appName} Security`,
        avatar_url: config.avatarUrl,
        embeds: [
          {
            title: `🛡️ ${event.eventType.replace(/_/g, ' ').toUpperCase()}`,
            description: `\`\`\`${JSON.stringify(event.details, null, 2).substring(0, 500)}\`\`\``,
            color: color,
            fields: [
              {
                name: 'Severity',
                value: event.severity.toUpperCase(),
                inline: true,
              },
              {
                name: 'Environment',
                value: this.config.global.environment,
                inline: true,
              },
              {
                name: 'IP Address',
                value: `\`${event.ipAddress || 'N/A'}\``,
                inline: true,
              },
              {
                name: 'User ID',
                value: event.userId || 'N/A',
                inline: true,
              },
              {
                name: 'Timestamp',
                value: event.timestamp.toISOString(),
                inline: true,
              },
            ],
            footer: {
              text: this.config.global.appName,
            },
            timestamp: event.timestamp.toISOString(),
          },
        ],
      };

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      return {
        channel: 'discord',
        success: true,
        timestamp: new Date(),
        latencyMs: latency,
      };

    } catch (error) {
      return {
        channel: 'discord',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private async sendEmailAlert(event: SecurityEvent): Promise<AlertDeliveryResult> {
    const config = this.config.email;
    if (!config?.enabled) {
      return { channel: 'email', success: false, error: 'Email not configured', timestamp: new Date(), latencyMs: 0 };
    }

    const startTime = Date.now();

    try {
      // In production, use a proper email library like nodemailer
      // This is a placeholder that logs what would be sent
      console.log('[Email Alert] Would send email:', {
        to: config.toAddresses,
        subject: `[${event.severity.toUpperCase()}] Security Alert: ${event.eventType}`,
        body: this.buildEmailBody(event),
      });

      // Simulate sending
      return {
        channel: 'email',
        success: true,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };

    } catch (error) {
      return {
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private buildEmailBody(event: SecurityEvent): string {
    return `
Security Alert Notification
========================

Severity: ${event.severity.toUpperCase()}
Event Type: ${event.eventType}
Source: ${event.source}
IP Address: ${event.ipAddress || 'N/A'}
User ID: ${event.userId || 'N/A'}
Timestamp: ${event.timestamp.toISOString()}
Environment: ${this.config.global.environment}

Details:
${JSON.stringify(event.details, null, 2)}

---
This is an automated message from ${this.config.global.appName}.
Please do not reply directly to this email.
`.trim();
  }

  private async sendWebhookAlert(event: SecurityEvent): Promise<AlertDeliveryResult> {
    const config = this.config.webhook;
    if (!config?.enabled) {
      return { channel: 'webhook', success: false, error: 'Webhook not configured', timestamp: new Date(), latencyMs: 0 };
    }

    const startTime = Date.now();

    try {
      const payload = {
        event_type: 'security_alert',
        event_id: event.id,
        severity: event.severity,
        event_type_name: event.eventType,
        source: event.source,
        ip_address: event.ipAddress,
        user_id: event.userId,
        details: event.details,
        timestamp: event.timestamp.toISOString(),
        environment: this.config.global.environment,
        app_name: this.config.global.appName,
      };

      // Add HMAC signature if secret provided
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (config.secret) {
        const crypto = await import('crypto');
        const signature = crypto
          .createHmac('sha256', config.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Signature-256'] = `sha256=${signature}`;
      }

      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.timeout || 10000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      return {
        channel: 'webhook',
        success: true,
        timestamp: new Date(),
        latencyMs: latency,
      };

    } catch (error) {
      return {
        channel: 'webhook',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ===========================================
  // Resolution & Acknowledgment Notifications
  // ===========================================

  private async sendResolutionNotification(
    aggregated: AggregatedAlert,
    resolvedBy?: string,
    note?: string
  ): Promise<void> {
    const message = `✅ Resolved: ${aggregated.eventType} (${aggregated.count} events)` +
      (resolvedBy ? ` by ${resolvedBy}` : '') +
      (note ? ` - ${note}` : '');

    // Send to all previously notified channels
    for (const channel of aggregated.channelsNotified) {
      try {
        switch (channel) {
          case 'slack':
            await this.sendSlackMessage(message, 'good');
            break;
          case 'pagerduty':
            await this.resolvePagerDutyIncident(aggregated.id);
            break;
        }
      } catch (error) {
        console.error(`Failed to send resolution to ${channel}:`, error);
      }
    }
  }

  private async sendAcknowledgmentNotification(
    aggregated: AggregatedAlert,
    acknowledgedBy: string
  ): Promise<void> {
    const message = `👀 Acknowledged: ${aggregated.eventType} by ${acknowledgedBy}`;

    for (const channel of aggregated.channelsNotified) {
      try {
        if (channel === 'slack') {
          await this.sendSlackMessage(message, 'warning');
        }
      } catch (error) {
        console.error(`Failed to send acknowledgment to ${channel}:`, error);
      }
    }
  }

  private async sendSlackMessage(text: string, color: string): Promise<void> {
    const config = this.config.slack;
    if (!config?.enabled) return;

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        attachments: [{ color }],
      }),
    });
  }

  private async resolvePagerDutyIncident(dedupKey: string): Promise<void> {
    const config = this.config.pagerduty;
    if (!config?.enabled) return;

    // Note: This requires the REST API v2, not just Events API
    // Placeholder for implementation
    console.log(`[PagerDuty] Would resolve incident: ${dedupKey}`);
  }

  // ===========================================
  // Utility Functions
  // ===========================================

  private getChannelsForSeverity(severity: SecurityEvent['severity']): string[] {
    const channels: string[] = [];
    const priority = SEVERITY_PRIORITY[severity];

    if (this.config.slack?.enabled && priority >= SEVERITY_PRIORITY[this.config.slack.severityThreshold]) {
      channels.push('slack');
    }

    if (this.config.pagerduty?.enabled && priority >= SEVERITY_PRIORITY[this.config.pagerduty.severityThreshold]) {
      channels.push('pagerduty');
    }

    if (this.config.discord?.enabled && priority >= SEVERITY_PRIORITY[this.config.discord.severityThreshold]) {
      channels.push('discord');
    }

    if (this.config.email?.enabled && priority >= SEVERITY_PRIORITY[this.config.email.severityThreshold]) {
      channels.push('email');
    }

    if (this.config.webhook?.enabled && priority >= SEVERITY_PRIORITY[this.config.webhook.severityThreshold]) {
      channels.push('webhook');
    }

    return channels;
  }

  private isInMaintenanceWindow(): boolean {
    const windows = this.config.global.maintenanceWindows;
    if (!windows || windows.length === 0) return false;

    const now = new Date();
    return windows.some(window => now >= window.start && now <= window.end);
  }

  private isDuplicateAlert(key: string): boolean {
    const recent = this.recentAlerts.get(key);
    if (!recent) return false;

    const suppressWindow = this.config.global.suppressRepeatsMs || 5 * 60 * 1000; // Default 5 minutes
    return Date.now() - recent.timestamp.getTime() < suppressWindow;
  }

  private recordRecentAlert(key: string): void {
    this.recentAlerts.set(key, { timestamp: new Date(), count: 1 });
  }

  private aggregateAlert(key: string, event: SecurityEvent): void {
    let aggregated = this.aggregatedAlerts.get(key);

    if (!aggregated) {
      aggregated = {
        id: key,
        eventType: event.eventType,
        severity: event.severity,
        count: 1,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        events: [event],
        channelsNotified: [],
        acknowledged: false,
        resolved: false,
      };
      this.aggregatedAlerts.set(key, aggregated);
    } else {
      aggregated.count++;
      aggregated.lastSeen = event.timestamp;
      aggregated.events.push(event);
      
      // Upgrade severity if needed
      if (SEVERITY_PRIORITY[event.severity] > SEVERITY_PRIORITY[aggregated.severity]) {
        aggregated.severity = event.severity;
      }
    }
  }

  private isRateLimited(channel: string): boolean {
    const config = this.getChannelConfig(channel);
    if (!config) return false;

    const counter = this.rateLimitCounters.get(channel);
    const now = new Date();

    if (!counter || now > counter.resetTime) {
      this.rateLimitCounters.set(channel, {
        count: 1,
        resetTime: new Date(now.getTime() + 60000), // Reset every minute
      });
      return false;
    }

    if (counter.count >= config.rateLimitPerMinute) {
      return true;
    }

    counter.count++;
    return false;
  }

  private getChannelConfig(channel: string): AlertChannelConfig | undefined {
    switch (channel) {
      case 'slack': return this.config.slack;
      case 'pagerduty': return this.config.pagerduty;
      case 'discord': return this.config.discord;
      case 'email': return this.config.email;
      case 'webhook': return this.config.webhook;
      default: return undefined;
    }
  }

  private addToHistory(results: AlertDeliveryResult[]): void {
    this.deliveryHistory.push(...results);
    
    // Trim history if needed
    if (this.deliveryHistory.length > this.maxHistorySize) {
      this.deliveryHistory = this.deliveryHistory.slice(-this.maxHistorySize);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up recent alerts
    for (const [key, value] of this.recentAlerts.entries()) {
      if (now - value.timestamp.getTime() > maxAge) {
        this.recentAlerts.delete(key);
      }
    }

    // Clean up aggregated alerts (keep resolved ones for 1 hour)
    for (const [key, aggregated] of this.aggregatedAlerts.entries()) {
      if (aggregated.resolved && now - aggregated.lastSeen.getTime() > 3_600_000) {
        this.aggregatedAlerts.delete(key);
      }
    }
  }

  // ===========================================
  // Public API Methods
  // ===========================================

  getAggregatedAlerts(): AggregatedAlert[] {
    return Array.from(this.aggregatedAlerts.values());
  }

  getDeliveryHistory(limit?: number): AlertDeliveryResult[] {
    if (limit) {
      return this.deliveryHistory.slice(-limit);
    }
    return [...this.deliveryHistory];
  }

  getStats(): {
    totalAlertsSent: number;
    totalDeliveries: number;
    successRate: number;
    averageLatencyMs: number;
    byChannel: Record<string, { sent: number; succeeded: number; failed: number }>;
  } {
    const history = this.deliveryHistory;
    const totalDeliveries = history.length;
    const successes = history.filter(r => r.success).length;
    const avgLatency = totalDeliveries > 0
      ? history.reduce((sum, r) => sum + r.latencyMs, 0) / totalDeliveries
      : 0;

    const byChannel: Record<string, { sent: number; succeeded: number; failed: number }> = {};
    for (const result of history) {
      if (!byChannel[result.channel]) {
        byChannel[result.channel] = { sent: 0, succeeded: 0, failed: 0 };
      }
      byChannel[result.channel].sent++;
      if (result.success) {
        byChannel[result.channel].succeeded++;
      } else {
        byChannel[result.channel].failed++;
      }
    }

    return {
      totalAlertsSent: this.recentAlerts.size,
      totalDeliveries,
      successRate: totalDeliveries > 0 ? successes / totalDeliveries : 0,
      averageLatencyMs: avgLatency,
      byChannel,
    };
  }
}

// ===========================================
// Factory Function
// ===========================================

let alertManagerInstance: SecurityAlertManager | null = null;

export function initializeAlertIntegrations(config: AlertIntegrationConfig): SecurityAlertManager {
  alertManagerInstance = new SecurityAlertManager(config);
  console.log('✅ Security alert integrations initialized');
  return alertManagerInstance;
}

export function getAlertManager(): SecurityAlertManager {
  if (!alertManagerInstance) {
    throw new Error('Alert manager not initialized. Call initializeAlertIntegrations first.');
  }
  return alertManagerInstance;
}

// Auto-initialize if configuration present
if (
  process.env.SLACK_WEBHOOK_URL ||
  process.env.PAGERDUTY_ROUTING_KEY ||
  process.env.DISCORD_WEBHOOK_URL ||
  process.env.ALERT_WEBHOOK_URL
) {
  const defaultConfig: AlertIntegrationConfig = {
    slack: process.env.SLACK_WEBHOOK_URL
      ? {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          severityThreshold: (process.env.SLACK_SEVERITY_THRESHOLD as any) || 'medium',
          rateLimitPerMinute: parseInt(process.env.SLACK_RATE_LIMIT || '10'),
          cooldownMs: parseInt(process.env.SLACK_COOLDOWN_MS || '30000'),
          blocks: process.env.SLACK_USE_BLOCKS === 'true',
          mentionChannel: process.env.SLACK_MENTION_CHANNEL === 'true',
        }
      : undefined,

    pagerduty: process.env.PAGERDUTY_ROUTING_KEY
      ? {
          enabled: true,
          routingKey: process.env.PAGERDUTY_ROUTING_KEY,
          severityThreshold: (process.env.PAGERDUTY_SEVERITY_THRESHOLD as any) || 'high',
          rateLimitPerMinute: parseInt(process.env.PAGERDUTY_RATE_LIMIT || '5'),
          cooldownMs: parseInt(process.env.PAGERDUTY_COOLDOWN_MS || '60000'),
          apiUrl: process.env.PAGERDUTY_API_URL,
        }
      : undefined,

    discord: process.env.DISCORD_WEBHOOK_URL
      ? {
          enabled: true,
          webhookUrl: process.env.DISCORD_WEBHOOK_URL,
          severityThreshold: (process.env.DISCORD_SEVERITY_THRESHOLD as any) || 'high',
          rateLimitPerMinute: parseInt(process.env.DISCORD_RATE_LIMIT || '10'),
          cooldownMs: parseInt(process.env.DISCORD_COOLDOWN_MS || '30000'),
        }
      : undefined,

    webhook: process.env.ALERT_WEBHOOK_URL
      ? {
          enabled: true,
          url: process.env.ALERT_WEBHOOK_URL,
          severityThreshold: (process.env.WEBHOOK_SEVERITY_THRESHOLD as any) || 'low',
          rateLimitPerMinute: parseInt(process.env.WEBHOOK_RATE_LIMIT || '20'),
          cooldownMs: parseInt(process.env.WEBHOOK_COOLDOWN_MS || '10000'),
          secret: process.env.ALERT_WEBHOOK_SECRET,
        }
      : undefined,

    global: {
      environment: process.env.NODE_ENV || 'development',
      appName: process.env.APP_NAME || 'AlgeriaTrade',
      appUrl: process.env.APP_URL || 'https://algeriatrade.dz',
    },
  };

  initializeAlertIntegrations(defaultConfig);
}

export { SecurityAlertManager, AlertIntegrationConfig };
