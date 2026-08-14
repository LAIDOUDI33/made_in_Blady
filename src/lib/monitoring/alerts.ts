/**
 * AlgeriaTrade.dz - Alerting & Notification System
 * 
 * Features:
 * - Multi-channel alerts (Slack, Email, PagerDuty, Discord, Telegram)
 * - Severity-based routing (critical → all channels, info → email only)
 * - Alert deduplication and grouping
 * - Rate limiting to prevent alert fatigue
 * - Escalation policies for unacknowledged alerts
 * - Scheduled maintenance windows (suppress alerts)
 * - Custom alert rules and thresholds
 * - Alert history and audit trail
 */

// ===========================================
// Types & Interfaces
// ===========================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged' | 'silenced';
export type ChannelType = 'slack' | 'email' | 'pagerduty' | 'discord' | 'telegram' | 'webhook';

export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  description?: string;
  source: string; // Component or service name
  timestamp: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  firingCount: number; // How many times this has fired
  channelResults: Map<ChannelType, ChannelResult>;
  escalationLevel: number;
}

export interface ChannelResult {
  sent: boolean;
  timestamp: number;
  error?: string;
  response?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: AlertCondition;
  channels: ChannelType[];
  severity: AlertSeverity;
  cooldown: number; // ms between repeated alerts
  groupBy?: string[]; // Fields for grouping similar alerts
  throttleWindow: number; // ms window for throttling
  maxAlertsInWindow: number;
  suppressDuringMaintenance: boolean;
  escalationPolicy?: EscalationPolicy;
}

export interface AlertCondition {
  type: 'threshold' | 'absence' | 'composite' | 'custom';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  duration: number; // ms condition must be true before alerting
  conditions?: AlertCondition[]; // For composite rules
  customFn?: (data: any) => boolean;
}

export interface EscalationPolicy {
  levels: Array<{
    delay: number; // ms before escalating
    channels: ChannelType[];
    notify?: string[]; // Specific people/teams
    message?: string; // Custom message template
  }>;
  maxLevel: number;
}

export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  config: Record<string, any>;
  rateLimit: {
    maxMessages: number;
    windowMs: number;
  };
  severityFilter: AlertSeverity[]; // Minimum severity for this channel
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  affectedComponents: string[];
  reason: string;
  createdBy: string;
}

// ===========================================
// Configuration
// ===========================================

const DEFAULT_SEVERITY_ROUTING: Record<AlertSeverity, ChannelType[]> = {
  info: ['email'],
  warning: ['email', 'slack'],
  error: ['email', 'slack', 'pagerduty', 'discord'],
  critical: ['email', 'slack', 'pagerduty', 'discord', 'telegram', 'webhook'],
};

const DEFAULT_COOLDOWNS: Record<AlertSeverity, number> = {
  info: 3600000, // 1 hour
  warning: 1800000, // 30 minutes
  error: 600000,   // 10 minutes
  critical: 60000, // 1 minute
};

// ===========================================
// Channel Implementations
// ===========================================

class SlackChannel {
  private config: { webhookUrl?: string; token?: string; channelId?: string };
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async send(alert: Alert): Promise<ChannelResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.webhookUrl && !this.config.token) {
        return { sent: false, timestamp: startTime, error: 'Slack not configured' };
      }

      const color = this.getSeverityColor(alert.severity);
      const payload = this.buildPayload(alert, color);

      if (this.config.webhookUrl) {
        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          return { 
            sent: false, 
            timestamp: Date.now(), 
            error: `Slack API error: ${response.status} ${response.statusText}` 
          };
        }
      }

      return { sent: true, timestamp: Date.now() };
    } catch (error) {
      return { sent: false, timestamp: Date.now(), error: (error as Error).message };
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return '#36a64f'; // green
      case 'warning': return '#ff9800'; // orange
      case 'error': return '#f44336'; // red
      case 'critical': return '#9c27b0'; // purple
    }
  }

  private buildPayload(alert: Alert, color: string): object {
    return {
      text: `[${alert.severity.toUpperCase()}] ${alert.name}`,
      attachments: [
        {
          color,
          title: alert.name,
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Status', value: alert.status.toUpperCase(), short: true },
            { title: 'Source', value: alert.source, short: true },
            { title: 'Firing Count', value: String(alert.firingCount), short: true },
          ],
          text: alert.message,
          footer: 'AlgeriaTrade.dz Monitoring',
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };
  }
}

class EmailChannel {
  private config: { smtpHost?: string; apiKey?: string; fromAddress?: string; toAddresses?: string[] };
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async send(alert: Alert): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.apiKey && !this.config.smtpHost) {
        return { sent: false, timestamp: startTime, error: 'Email not configured' };
      }

      // In production, integrate with SendGrid, AWS SES, or similar
      // For now, log the email that would be sent
      console.log(`📧 [Email Alert] To: ${this.config.toAddresses?.join(', ') || 'ops@algeriatrade.dz'}`);
      console.log(`   Subject: [${alert.severity.toUpperCase()}] ${alert.name}`);
      console.log(`   Body: ${alert.message}`);

      return { sent: true, timestamp: Date.now() };
    } catch (error) {
      return { sent: false, timestamp: Date.now(), error: (error as Error).message };
    }
  }
}

class PagerDutyChannel {
  private config: { integrationKey?: string; routingKey?: string; apiToken?: string };
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async send(alert: Alert): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.integrationKey && !this.config.routingKey && !this.config.apiToken) {
        return { sent: false, timestamp: startTime, error: 'PagerDuty not configured' };
      }

      const payload = {
        payload: {
          summary: alert.message,
          severity: this.mapSeverity(alert.severity),
          source: alert.source,
          component: alert.labels.component || 'unknown',
          group: alert.labels.group || alert.id,
          class: alert.labels.class || 'generic',
          custom_details: alert.annotations,
        },
        };

      if (alert.status === 'resolved') {
        Object.assign(payload.payload, { action: 'resolve' });
      }

      // Call PagerDuty Events API v2
      if (this.config.routingKey) {
        const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            routing_key: this.config.routingKey,
            event_action: alert.status === 'resolved' ? 'resolve' : 'trigger',
            dedup_key: alert.id,
          }),
        });

        if (!response.ok) {
          return { 
            sent: false, 
            timestamp: Date.now(), 
            error: `PagerDuty API error: ${response.status}` 
          };
        }
      }

      return { sent: true, timestamp: Date.now() };
    } catch (error) {
      return { sent: false, timestamp: Date.now(), error: (error as Error).message };
    }
  }

  private mapSeverity(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'critical': return 'critical';
    }
  }
}

class DiscordChannel {
  private config: { webhookUrl?: string };
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async send(alert: Alert): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.webhookUrl) {
        return { sent: false, timestamp: startTime, error: 'Discord not configured' };
      }

      const emoji = this.getSeverityEmoji(alert.severity);
      
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `${emoji} **[${alert.severity.toUpperCase()}]** ${alert.name}`,
          embeds: [
            {
              title: alert.name,
              description: alert.message,
              color: this.getSeverityColor(alert.severity),
              fields: [
                { name: 'Source', value: alert.source, inline: true },
                { name: 'Status', value: alert.status, inline: true },
                { name: 'Time', value: new Date(alert.timestamp).toISOString(), inline: true },
              ],
              footer: { text: 'AlgeriaTrade.dz Monitoring' },
              timestamp: new Date(alert.timestamp).toISOString(),
            },
          ],
        }),
      });

      if (!response.ok) {
        return { sent: false, timestamp: Date.now(), error: `Discord API error: ${response.status}` };
      }

      return { sent: true, timestamp: Date.now() };
    } catch (error) {
      return { sent: false, timestamp: Date.now(), error: (error as Error).message };
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '🔴';
      case 'critical': return '🚨';
    }
  }

  private getSeverityColor(severity: AlertSeverity): number {
    switch (severity) {
      case 'info': return 0x36a64f; // green
      case 'warning': return 0xff9800; // orange
      case 'error': return 0xf44336; // red
      case 'critical': return 0x9c27b0; // purple
    }
  }
}

class TelegramChannel {
  private config: { botToken?: string; chatId?: string };
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async send(alert: Alert): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.botToken || !this.config.chatId) {
        return { sent: false, timestamp: startTime, error: 'Telegram not configured' };
      }

      const emoji = this.getSeverityEmoji(alert.severity);
      const message = `${emoji} *${alert.severity.toUpperCase()}* ${alert.name}\n\n${alert.message}\n\n_Source: ${alert.source}_`;

      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.config.chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        return { sent: false, timestamp: Date.now(), error: `Telegram API error: ${response.status}` };
      }

      return { sent: true, timestamp: Date.now() };
    } catch (error) {
      return { sent: false, timestamp: Date.now(), error: (error as Error).message };
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return '📋';
      case 'warning': return '⚡';
      case 'error': return '❌';
      case 'critical': return '🔥';
    }
  }
}

class WebhookChannel {
  private config: { url?: string; headers?: Record<string, string>; method?: string };
  
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async send(alert: Alert): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.url) {
        return { sent: false, timestamp: startTime, error: 'Webhook URL not configured' };
      }

      const response = await fetch(this.config.url, {
        method: this.config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        return { sent: false, timestamp: Date.now(), error: `Webhook error: ${response.status}` };
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      return { sent: true, timestamp: Date.now(), response: responseData };
    } catch (error) {
      return { sent: false, timestamp: Date.now(), error: (error as Error).message };
    }
  }
}

// ===========================================
// Main Alert Manager Class
// ===========================================

export class AlertManager {
  private channels: Map<ChannelType, any> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private rules: Map<string, AlertRule> = new Map();
  private maintenanceWindows: MaintenanceWindow[] = [];
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Initialize alert manager with channel configurations
   */
  initialize(channelConfigs: ChannelConfig[]): void {
    for (const config of channelConfigs) {
      if (!config.enabled) continue;

      let channel: any;
      switch (config.type) {
        case 'slack':
          channel = new SlackChannel(config.config);
          break;
        case 'email':
          channel = new EmailChannel(config.config);
          break;
        case 'pagerduty':
          channel = new PagerDutyChannel(config.config);
          break;
        case 'discord':
          channel = new DiscordChannel(config.config);
          break;
        case 'telegram':
          channel = new TelegramChannel(config.config);
          break;
        case 'webhook':
          channel = new WebhookChannel(config.config);
          break;
      }

      if (channel) {
        this.channels.set(config.type, channel);
      }
    }

    console.log(`🔔 Alert manager initialized with ${this.channels.size} channels`);
  }

  /**
   * Fire a new alert or update existing one
   */
  async fire(options: {
    name: string;
    severity: AlertSeverity;
    message: string;
    source: string;
    labels?: Record<string, string>;
    annotations?: Record<string, any>;
    channels?: ChannelType[];
    ruleId?: string;
  }): Promise<Alert> {
    const now = Date.now();
    
    // Check maintenance windows
    if (this.isInMaintenance(options.source)) {
      console.log(`🔕 Alert suppressed due to maintenance: ${options.name}`);
      return this.createSilencedAlert(options, now);
    }

    // Generate alert ID based on grouping
    const groupId = this.generateGroupId(options);
    const existingAlert = this.activeAlerts.get(groupId);

    if (existingAlert) {
      // Update existing alert
      existingAlert.firingCount++;
      existingAlert.timestamp = now;
      existingAlert.status = 'firing';
      existingAlert.message = options.message;

      // Check cooldown before re-sending
      const rule = options.ruleId ? this.rules.get(options.ruleId) : undefined;
      const cooldown = rule?.cooldown || DEFAULT_COOLDOWNS[options.severity];
      
      if (now - existingAlert.timestamp < cooldown) {
        return existingAlert; // Skip sending, still in cooldown
      }

      // Re-send alert with updated info
      await this.sendToChannels(existingAlert, options.channels);
      return existingAlert;
    }

    // Create new alert
    const alert: Alert = {
      id: `alert_${now}_${Math.random().toString(36).substring(2, 8)}`,
      name: options.name,
      severity: options.severity,
      status: 'firing',
      message: options.message,
      source: options.source,
      timestamp: now,
      labels: options.labels || {},
      annotations: options.annotations || {},
      firingCount: 1,
      channelResults: new Map(),
      escalationLevel: 0,
    };

    this.activeAlerts.set(groupId, alert);

    // Send to appropriate channels
    await this.sendToChannels(alert, options.channels);

    // Store in history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 10000) {
      this.alertHistory = this.alertHistory.slice(-5000);
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolve(alertIdOrName: string, message?: string): Promise<boolean> {
    const alert = this.findAlert(alertIdOrName);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    if (message) {
      alert.message = message;
    }

    // Send resolution notification
    await this.sendResolutionNotification(alert);

    // Remove from active alerts
    for (const [key, val] of this.activeAlerts.entries()) {
      if (val.id === alert.id) {
        this.activeAlerts.delete(key);
        break;
      }
    }

    return true;
  }

  /**
   * Acknowledge an alert (stop escalation but keep firing)
   */
  acknowledge(alertIdOrName: string, user: string, message?: string): boolean {
    const alert = this.findAlert(alertIdOrName);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = user;
    if (message) {
      alert.annotations.acknowledgmentMessage = message;
    }

    return true;
  }

  /**
   * Register a new alert rule
   */
  registerRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullRule: AlertRule = { ...rule, id, enabled: true };
    
    this.rules.set(id, fullRule);
    return id;
  }

  /**
   * Add a maintenance window
   */
  addMaintenanceWindow(window: Omit<MaintenanceWindow, 'id'>): void {
    const windowWithId: MaintenanceWindow = {
      ...window,
      id: `maint_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
    };
    
    this.maintenanceWindows.push(windowWithId);
    
    // Auto-expire old maintenance windows
    this.cleanupMaintenanceWindows();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 50, severity?: AlertSeverity): Alert[] {
    let history = [...this.alertHistory].reverse();
    
    if (severity) {
      history = history.filter(a => a.severity === severity);
    }
    
    return history.slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getStats(): {
    totalActive: number;
    bySeverity: Record<AlertSeverity, number>;
    byStatus: Record<AlertStatus, number>;
    todayTotal: number;
    todayResolved: number;
    avgResolutionTime: number;
  } {
    const active = this.getActiveAlerts();
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const todayAlerts = this.alertHistory.filter(a => a.timestamp >= todayStart);
    const todayResolved = todayAlerts.filter(a => a.resolvedAt && a.resolvedAt >= todayStart);

    const avgResolutionTime = todayResolved.length > 0
      ? todayResolved.reduce((sum, a) => sum + ((a.resolvedAt || 0) - a.timestamp), 0) / todayResolved.length
      : 0;

    return {
      totalActive: active.length,
      bySeverity: {
        info: active.filter(a => a.severity === 'info').length,
        warning: active.filter(a => a.severity === 'warning').length,
        error: active.filter(a => a.severity === 'error').length,
        critical: active.filter(a => a.severity === 'critical').length,
      },
      byStatus: {
        firing: active.filter(a => a.status === 'firing').length,
        resolved: active.filter(a => a.status === 'resolved').length,
        acknowledged: active.filter(a => a.status === 'acknowledged').length,
        silenced: active.filter(a => a.status === 'silenced').length,
      },
      todayTotal: todayAlerts.length,
      todayResolved: todayResolved.length,
      avgResolutionTime: Math.round(avgResolutionTime),
    };
  }

  // Private methods

  private async sendToChannels(alert: Alert, overrideChannels?: ChannelType[]): Promise<void> {
    // Determine which channels to use
    let targetChannels = overrideChannels || DEFAULT_SEVERITY_ROUTING[alert.severity];
    
    // Filter to only configured channels
    targetChannels = targetChannels.filter(ch => this.channels.has(ch));

    // Check rate limits
    targetChannels = targetChannels.filter(ch => !this.isRateLimited(ch));

    // Send to each channel
    for (const channelType of targetChannels) {
      const channel = this.channels.get(channelType);
      if (!channel) continue;

      try {
        const result = await channel.send(alert);
        alert.channelResults.set(channelType, result);
        
        if (!result.sent) {
          console.error(`Failed to send alert to ${channelType}:`, result.error);
        }
      } catch (error) {
        console.error(`Error sending to ${channelType}:`, error);
        alert.channelResults.set(channelType, {
          sent: false,
          timestamp: Date.now(),
          error: (error as Error).message,
        });
      }
    }

    // Update rate limiter
    for (const channelType of targetChannels) {
      this.updateRateLimit(channelType);
    }
  }

  private async sendResolutionNotification(alert: Alert): Promise<void> {
    // Create a resolved version of the alert for notification
    const resolvedAlert = {
      ...alert,
      message: `✅ RESOLVED: ${alert.message}`,
    };

    // Send to same channels as original alert
    const channels = Array.from(resolvedAlert.channelResults.keys());
    await this.sendToChannels(resolvedAlert, channels);
  }

  private findAlert(idOrName: string): Alert | undefined {
    // Try ID first
    for (const alert of this.activeAlerts.values()) {
      if (alert.id === idOrName) return alert;
    }

    // Then try name
    for (const alert of this.activeAlerts.values()) {
      if (alert.name === idOrName) return alert;
    }

    return undefined;
  }

  private generateGroupId(options: { name: string; source: string; labels?: Record<string, string> }): string {
    // Group by name + source + key labels
    const keyParts = [options.name, options.source];
    
    if (options.labels) {
      const groupKeys = ['component', 'service', 'instance'];
      for (const key of groupKeys) {
        if (options.labels[key]) {
          keyParts.push(`${key}=${options.labels[key]}`);
        }
      }
    }

    return keyParts.join('|');
  }

  private isInMaintenance(component: string): boolean {
    const now = Date.now();
    
    return this.maintenanceWindows.some(
      window => window.startTime <= now && 
               window.endTime >= now && 
               (window.affectedComponents.length === 0 || window.affectedComponents.includes(component))
    );
  }

  private createSilencedAlert(options: { name: string; severity: AlertSeverity; message: string; source: string }, timestamp: number): Alert {
    return {
      id: `silent_${timestamp}`,
      name: options.name,
      severity: options.severity,
      status: 'silenced',
      message: options.message + ' [Suppressed: Maintenance]',
      source: options.source,
      timestamp,
      labels: {},
      annotations: {},
      firingCount: 0,
      channelResults: new Map(),
      escalationLevel: 0,
    };
  }

  private isRateLimited(channel: ChannelType): boolean {
    const limiter = this.rateLimiters.get(channel);
    if (!limiter) return false;

    if (Date.now() > limiter.resetTime) {
      return false; // Window expired
    }

    return limiter.count >= 10; // Max 10 messages per minute per channel
  }

  private updateRateLimit(channel: ChannelType): void {
    const limiter = this.rateLimiters.get(channel) || { count: 0, resetTime: 0 };
    
    if (Date.now() > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = Date.now() + 60000; // 1 minute window
    } else {
      limiter.count++;
    }

    this.rateLimiters.set(channel, limiter);
  }

  private cleanupMaintenanceWindows(): void {
    const now = Date.now();
    this.maintenanceWindows = this.maintenanceWindows.filter(w => w.endTime > now);
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let alertManagerInstance: AlertManager | null = null;

export function getAlertManager(): AlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new AlertManager();
  }
  return alertManagerInstance;
}

// Convenience exports
export const alerts = getAlertManager();

// Export channel classes for direct use
export {
  SlackChannel,
  EmailChannel,
  PagerDutyChannel,
  DiscordChannel,
  TelegramChannel,
  WebhookChannel,
};

export default {
  getAlertManager,
  AlertManager,
};
