/**
 * Security Monitoring & Alerting System
 * Real-time threat detection and automated response
 * For AlgeriaTrade.dz B2B Platform
 */

import { db } from '@/lib/db';

// ===========================================
// Types & Interfaces
// ===========================================

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  ipAddress?: string;
  userId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
}

export type SecurityEventType = 
  | 'auth_success'
  | 'auth_failure'
  | 'brute_force_detected'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'permission_denied'
  | 'data_access_anomaly'
  | 'payment_fraud_risk'
  | 'injection_attempt'
  | 'xss_attempt'
  | 'csrf_attempt'
  | 'ddos_detected'
  | 'unusual_geolocation'
  | 'account_takeover_risk'
  | 'api_abuse'
  | 'file_upload_suspicious';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  eventType: SecurityEventType;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownMs: number; // Prevent alert flooding
  enabled: boolean;
}

export interface AlertCondition {
  field: keyof SecurityEvent;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: unknown;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'block_ip' | 'lock_account' | 'log' | 'slack' | 'pagerduty';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface MonitoringStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  activeAlerts: number;
  blockedIPs: number;
  riskScore: number; // 0-100 overall platform risk
  topAttackerIPs: Array<{ ip: string; count: number }>;
  recentCriticalEvents: SecurityEvent[];
}

// ===========================================
// Configuration
// ===========================================

const MONITORING_CONFIG = {
  // Enable/disable monitoring
  enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
  
  // Risk score thresholds for automated actions
  thresholds: {
    autoBlockIP: 85,        // Auto-block IP if risk score >= this
    lockAccount: 90,         // Lock account if risk score >= this
    alertAdmin: 70,          // Alert admins if risk score >= this
    criticalAlert: 95,       // Critical alert for very high risk
  },
  
  // Time windows for analysis
  windows: {
    shortTerm: 5 * 60 * 1000,    // 5 minutes
    mediumTerm: 60 * 60 * 1000,  // 1 hour
    longTerm: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Rate limits for monitoring itself (prevent DoS of monitoring)
  selfRateLimit: {
    maxEventsPerSecond: 1000,
    maxAlertsPerMinute: 50,
  },
};

// Default alert rules
const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'brute-force-detection',
    name: 'Brute Force Attack Detection',
    description: 'Detects potential brute force login attempts',
    eventType: 'brute_force_detected',
    conditions: [
      { field: 'severity', operator: 'in', value: ['high', 'critical'] },
    ],
    actions: [
      { type: 'block_ip', config: { durationHours: 24 }, enabled: true },
      { type: 'email', config: { recipients: ['security@algeriatrade.dz'] }, enabled: true },
      { type: 'log', config: { level: 'error' }, enabled: true },
    ],
    cooldownMs: 30 * 60 * 1000, // 30 minute cooldown
    enabled: true,
  },
  {
    id: 'rate-limit-abuse',
    name: 'API Rate Limit Abuse',
    description: 'Detects clients consistently hitting rate limits',
    eventType: 'rate_limit_exceeded',
    conditions: [
      { field: 'severity', operator: 'greater_than', value: 'medium' as unknown },
    ],
    actions: [
      { type: 'alert', config: {}, enabled: true },
      { type: 'log', config: { level: 'warn' }, enabled: true },
    ],
    cooldownMs: 15 * 60 * 1000,
    enabled: true,
  },
  {
    id: 'payment-fraud',
    name: 'Payment Fraud Risk',
    description: 'Detects suspicious payment patterns',
    eventType: 'payment_fraud_risk',
    conditions: [
      { field: 'severity', operator: 'greater_than', value: 'medium' as unknown },
    ],
    actions: [
      { type: 'email', config: { recipients: ['fraud@algeriatrade.dz', 'security@algeriatrade.dz'] }, enabled: true },
      { type: 'block_ip', config: { durationHours: 1 }, enabled: false }, // Manual review first
      { type: 'log', config: { level: 'error' }, enabled: true },
    ],
    cooldownMs: 10 * 60 * 1000,
    enabled: true,
  },
  {
    id: 'injection-attempt',
    name: 'Injection Attack Attempt',
    description: 'Detects SQL/NoSQL injection attempts',
    eventType: 'injection_attempt',
    conditions: [
      { field: 'severity', operator: 'in', value: ['medium', 'high', 'critical'] },
    ],
    actions: [
      { type: 'block_ip', config: { durationHours: 48 }, enabled: true },
      { type: 'email', config: { recipients: ['security@algeriatrade.dz'] }, enabled: true },
      { type: 'log', config: { level: 'error' }, enabled: true },
    ],
    cooldownMs: 0, // Always alert on injection attempts
    enabled: true,
  },
];

// ===========================================
// In-Memory State (for real-time processing)
// ===========================================

class SecurityMonitoringSystem {
  private eventBuffer: SecurityEvent[] = [];
  private alertCooldowns = new Map<string, number>();
  private recentEventsByIP = new Map<string, SecurityEvent[]>();
  private recentEventsByUser = new Map<string, SecurityEvent[]>();
  
  private rules: AlertRule[] = DEFAULT_ALERT_RULES;
  private isInitialized = false;

  /**
   * Initialize the monitoring system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load custom rules from database if available
      const customRules = await db.alertRule.findMany({
        where: { enabled: true },
      });
      
      if (customRules.length > 0) {
        this.rules = [...DEFAULT_ALERT_RULES, ...customRules.map(r => ({
          ...r,
          conditions: JSON.parse(r.conditions as string),
          actions: JSON.parse(r.actions as string),
        } as AlertRule))];
      }
      
      this.isInitialized = true;
      console.log('[SecurityMonitor] Initialized with', this.rules.length, 'active rules');
    } catch (error) {
      console.error('[SecurityMonitor] Initialization error:', error);
      // Continue with default rules
      this.isInitialized = true;
    }
  }

  /**
   * Process a security event - main entry point
   */
  async recordEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityEvent> {
    if (!MONITORING_CONFIG.enabled) {
      return {} as SecurityEvent;
    }

    await this.initialize();

    const event: SecurityEvent = {
      ...eventData,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
    };

    // Add to buffer for real-time analysis
    this.eventBuffer.push(event);
    if (this.eventBuffer.length > 10000) {
      this.eventBuffer = this.eventBuffer.slice(-5000); // Keep last 5000 in memory
    }

    // Track by IP and user
    if (event.ipAddress) {
      const ipEvents = this.recentEventsByIP.get(event.ipAddress) || [];
      ipEvents.push(event);
      if (ipEvents.length > 1000) ipEvents.shift(); // Keep last 1000 per IP
      this.recentEventsByIP.set(event.ipAddress, ipEvents);
    }

    if (event.userId) {
      const userEvents = this.recentEventsByUser.get(event.userId) || [];
      userEvents.push(event);
      if (userEvents.length > 500) userEvents.shift();
      this.recentEventsByUser.set(event.userId, userEvents);
    }

    // Persist to database asynchronously
    this.persistEvent(event);

    // Evaluate alert rules
    await this.evaluateRules(event);

    return event;
  }

  /**
   * Calculate risk score for an IP address (0-100)
   */
  calculateIPRiskScore(ipAddress: string): number {
    const events = this.recentEventsByIP.get(ipAddress) || [];
    if (events.length === 0) return 0;

    let riskScore = 0;
    const now = Date.now();
    const oneHourAgo = now - MONITORING_CONFIG.windows.mediumTerm;

    // Filter to recent events
    const recentEvents = events.filter(e => e.timestamp.getTime() > oneHourAgo);

    // Weight different event types
    for (const event of recentEvents) {
      switch (event.eventType) {
        case 'brute_force_detected':
          riskScore += 25;
          break;
        case 'injection_attempt':
          riskScore += 35;
          break;
        case 'xss_attempt':
          riskScore += 20;
          break;
        case 'auth_failure':
          riskScore += 10;
          break;
        case 'rate_limit_exceeded':
          riskScore += 15;
          break;
        case 'payment_fraud_risk':
          riskScore += 30;
          break;
        case 'account_takeover_risk':
          riskScore += 40;
          break;
        default:
          riskScore += 5;
      }
    }

    // Severity multiplier
    const highSeverityCount = recentEvents.filter(e => 
      e.severity === 'high' || e.severity === 'critical'
    ).length;
    riskScore *= (1 + highSeverityCount * 0.2);

    // Frequency bonus (rapid attacks are worse)
    if (recentEvents.length > 20) {
      riskScore *= 1.3;
    }
    if (recentEvents.length > 50) {
      riskScore *= 1.5;
    }

    return Math.min(100, Math.round(riskScore));
  }

  /**
   * Calculate risk score for a user account (0-100)
   */
  calculateUserRiskScore(userId: string): number {
    const events = this.recentEventsByUser.get(userId) || [];
    if (events.length === 0) return 0;

    let riskScore = 0;
    const now = Date.now();
    const twentyFourHoursAgo = now - MONITORING_CONFIG.windows.longTerm;

    const recentEvents = events.filter(e => e.timestamp.getTime() > twentyFourHoursAgo);

    for (const event of recentEvents) {
      switch (event.eventType) {
        case 'account_takeover_risk':
          riskScore += 40;
          break;
        case 'permission_denied':
          riskScore += 15;
          break;
        case 'data_access_anomaly':
          riskScore += 25;
          break;
        case 'unusual_geolocation':
          riskScore += 20;
          break;
        default:
          riskScore += 5;
      }
    }

    // Check for multiple IPs (potential account sharing/takeover)
    const uniqueIPs = new Set(recentEvents.map(e => e.ipAddress).filter(Boolean));
    if (uniqueIPs.size > 5) {
      riskScore += 15;
    }

    return Math.min(100, Math.round(riskScore));
  }

  /**
   * Get current monitoring statistics
   */
  async getStats(): Promise<MonitoringStats> {
    const oneHourAgo = new Date(Date.now() - MONITORING_CONFIG.windows.mediumTerm);
    
    const [totalEvents, eventsByType, blockedIPsCount, recentCritical] = await Promise.all([
      db.securityEvent.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),
      db.securityEvent.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
        where: { createdAt: { gte: oneHourAgo } },
        orderBy: { _count: { eventType: 'desc' } },
        take: 10,
      }),
      db.blockedIP.count({ where: { expiresAt: { gt: new Date() } } }),
      db.securityEvent.findMany({
        where: {
          createdAt: { gte: oneHourAgo },
          severity: { in: ['critical', 'high'] },
          resolved: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate overall platform risk score
    const highRiskIPs = Array.from(this.recentEventsByIP.entries())
      .filter(([, events]) => this.calculateIPRiskScoreFromEvents(events) > 70);
    
    const overallRisk = Math.min(100, Math.round(
      (highRiskIPs.length * 10) + 
      (recentCritical.length * 15) +
      (totalEvents > 1000 ? 20 : totalEvents / 50)
    ));

    // Top attacker IPs
    const topAttackers = Array.from(this.recentEventsByIP.entries())
      .map(([ip, events]) => ({ ip, count: events.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents,
      eventsByType: Object.fromEntries(eventsByType.map(e => [e.eventType, e._count.eventType])),
      eventsBySeverity: {}, // Would need another query
      activeAlerts: recentCritical.length,
      blockedIPs: blockedIPsCount,
      riskScore: overallRisk,
      topAttackerIPs: topAttackers,
      recentCriticalEvents: recentCritical.map(e => ({
        ...e,
        details: typeof e.details === 'string' ? JSON.parse(e.details) : e.details,
      })),
    };
  }

  /**
   * Get security recommendations based on current state
   */
  async getRecommendations(): Promise<Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    rationale: string;
  }>> {
    const stats = await this.getStats();
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      recommendation: string;
      rationale: string;
    }> = [];

    // High risk score
    if (stats.riskScore > 70) {
      recommendations.push({
        priority: 'high',
        category: 'Immediate Action',
        recommendation: 'Review and block high-risk IP addresses',
        rationale: `Platform risk score is ${stats.riskScore}/100, indicating active threats`,
      });
    }

    // Many blocked IPs
    if (stats.blockedIPs > 50) {
      recommendations.push({
        priority: 'medium',
        category: 'Infrastructure',
        recommendation: 'Consider implementing DDoS protection service (Cloudflare, AWS Shield)',
        rationale: `${stats.blockedIPs} IPs currently blocked suggests ongoing attack`,
      });
    }

    // Many auth failures
    const authFailures = stats.eventsByType['auth_failure'] || 0;
    if (authFailures > 100) {
      recommendations.push({
        priority: 'high',
        category: 'Authentication',
        recommendation: 'Enable CAPTCHA for all authentication endpoints',
        rationale: `${authFailures} authentication failures in past hour suggests brute force attack`,
      });
    }

    // Critical events unresolved
    if (stats.activeAlerts > 5) {
      recommendations.push({
        priority: 'high',
        category: 'Operations',
        recommendation: 'Immediate review of unresolved critical security events',
        rationale: `${stats.activeAlerts} critical/high severity events require attention`,
      });
    }

    // Default recommendations
    recommendations.push(
      {
        priority: 'low',
        category: 'Maintenance',
        recommendation: 'Schedule quarterly penetration testing',
        rationale: 'Regular testing helps identify vulnerabilities before attackers do',
      },
      {
        priority: 'low',
        category: 'Training',
        recommendation: 'Conduct security awareness training for all team members',
        rationale: 'Human error is a common cause of security incidents',
      }
    );

    return recommendations;
  }

  /**
   * Evaluate alert rules against an event
   */
  private async evaluateRules(event: SecurityEvent): Promise<void> {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.eventType !== event.eventType) continue;

      // Check cooldown
      const cooldownKey = `${rule.id}_${event.ipAddress || event.userId || 'global'}`;
      const lastAlert = this.alertCooldowns.get(cooldownKey);
      if (lastAlert && Date.now() - lastAlert < rule.cooldownMs) continue;

      // Evaluate conditions
      const conditionsMet = rule.conditions.every(condition =>
        this.evaluateCondition(event, condition)
      );

      if (conditionsMet) {
        // Set cooldown
        this.alertCooldowns.set(cooldownKey, Date.now());

        // Execute actions
        await this.executeActions(rule, event);
      }
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(event: SecurityEvent, condition: AlertCondition): boolean {
    const fieldValue = (event as Record<string, unknown>)[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Execute alert actions
   */
  private async executeActions(rule: AlertRule, event: SecurityEvent): Promise<void> {
    console.log(`[SecurityMonitor] Rule "${rule.name}" triggered by event ${event.id}`);

    for (const action of rule.actions) {
      if (!action.enabled) continue;

      try {
        switch (action.type) {
          case 'block_ip':
            if (event.ipAddress) {
              await this.blockIPAddress(event.ipAddress, action.config.durationHours as number || 24);
            }
            break;

          case 'lock_account':
            if (event.userId) {
              await this.lockUserAccount(event.userId);
            }
            break;

          case 'email':
            await this.sendAlertEmail(rule.name, event, action.config.recipients as string[]);
            break;

          case 'webhook':
            await this.sendWebhook(action.config.url as string, rule, event);
            break;

          case 'log':
            console.log(`[SECURITY ALERT] [${rule.name}]`, {
              eventId: event.id,
              type: event.eventType,
              severity: event.severity,
              ip: event.ipAddress,
              user: event.userId,
              details: event.details,
            });
            break;

          case 'slack':
            await this.sendSlackNotification(rule.name, event, action.config.webhookUrl as string);
            break;
        }
      } catch (error) {
        console.error(`[SecurityMonitor] Error executing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Block an IP address
   */
  private async blockIPAddress(ipAddress: string, durationHours: number): Promise<void> {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    await db.blockedIP.upsert({
      where: { ipAddress },
      update: { expiresAt, reason: 'Automated block by security monitor', updatedAt: new Date() },
      create: {
        ipAddress,
        expiresAt,
        reason: 'Automated block by security monitor',
      },
    });

    console.log(`[SecurityMonitor] Blocked IP ${ipAddress} for ${durationHours} hours`);
  }

  /**
   * Lock a user account
   */
  private async lockUserAccount(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Create security event for the lock
    await db.securityEvent.create({
      data: {
        eventType: 'ACCOUNT_LOCKED',
        severity: 'HIGH',
        userId,
        ipAddress: 'security-monitor',
        details: JSON.stringify({ reason: 'Automated lock due to suspicious activity' }),
      },
    });

    console.log(`[SecurityMonitor] Locked user account ${userId}`);
  }

  /**
   * Send alert email
   */
  private async sendAlertEmail(ruleName: string, event: SecurityEvent, recipients: string[]): Promise<void> {
    // Implementation would use email service
    console.log(`[SecurityMonitor] Email alert sent to ${recipients.join(', ')}`, {
      rule: ruleName,
      event: event.id,
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(url: string, rule: AlertRule, event: SecurityEvent): Promise<void> {
    // Implementation would call external webhook
    console.log(`[SecurityMonitor] Webhook notification to ${url}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(ruleName: string, event: SecurityEvent, webhookUrl: string): Promise<void> {
    // Implementation would post to Slack
    console.log(`[SecurityMonitor] Slack notification: ${ruleName}`);
  }

  /**
   * Persist event to database (async, non-blocking)
   */
  private async persistEvent(event: SecurityEvent): Promise<void> {
    try {
      await db.securityEvent.create({
        data: {
          eventType: event.eventType,
          severity: event.severity.toUpperCase(),
          ipAddress: event.ipAddress,
          userId: event.userId,
          details: JSON.stringify(event.details),
          source: event.source || 'application',
          resolved: false,
        },
      });
    } catch (error) {
      console.error('[SecurityMonitor] Error persisting event:', error);
    }
  }

  /**
   * Helper to calculate risk from events array
   */
  private calculateIPRiskScoreFromEvents(events: SecurityEvent[]): number {
    let risk = 0;
    for (const event of events) {
      switch (event.severity) {
        case 'critical': risk += 30; break;
        case 'high': risk += 20; break;
        case 'medium': risk += 10; break;
        case 'low': risk += 5; break;
      }
    }
    return Math.min(100, risk);
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitoringSystem();

// Convenience functions for common operations

/**
 * Record authentication attempt
 */
export async function recordAuthAttempt(params: {
  success: boolean;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  method?: 'password' | 'oauth' | '2fa';
}): Promise<void> {
  const { success, userId, ipAddress, userAgent, method } = params;
  
  // Check for brute force pattern
  const recentFailures = await db.securityEvent.count({
    where: {
      eventType: 'AUTH_FAILURE',
      ipAddress,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 min
    },
  });

  if (!success && recentFailures >= 5) {
    // Potential brute force attack
    await securityMonitor.recordEvent({
      eventType: 'brute_force_detected',
      severity: recentFailures >= 10 ? 'critical' : 'high',
      source: 'authentication',
      ipAddress,
      userId,
      details: {
        method,
        failureCount: recentFailures + 1,
        userAgent,
        windowMinutes: 15,
      },
    });
  } else {
    await securityMonitor.recordEvent({
      eventType: success ? 'auth_success' : 'auth_failure',
      severity: success ? 'info' : 'low',
      source: 'authentication',
      ipAddress,
      userId,
      details: { method, userAgent },
    });
  }
}

/**
 * Record API abuse
 */
export async function recordAPIAbuse(params: {
  endpoint: string;
  method: string;
  ipAddress: string;
  userId?: string;
  reason: string;
}): Promise<void> {
  await securityMonitor.recordEvent({
    eventType: 'api_abuse',
    severity: 'medium',
    source: 'api-gateway',
    ipAddress: params.ipAddress,
    userId: params.userId,
    details: {
      endpoint: params.endpoint,
      httpMethod: params.method,
      reason: params.reason,
    },
  });
}

/**
 * Record injection attempt
 */
export async function recordInjectionAttempt(params: {
  type: 'sql' | 'nosql' | 'xss' | 'command';
  ipAddress: string;
  userId?: string;
  payload?: string;
  endpoint?: string;
}): Promise<void> {
  await securityMonitor.recordEvent({
    eventType: params.type === 'xss' ? 'xss_attempt' : 'injection_attempt',
    severity: 'high',
    source: 'waf',
    ipAddress: params.ipAddress,
    userId: params.userId,
    details: {
      injectionType: params.type,
      payload: params.payload?.substring(0, 500), // Truncate for storage
      endpoint: params.endpoint,
    },
  });

  // Auto-block for injection attempts
  const riskScore = securityMonitor.calculateIPRiskScore(params.ipAddress);
  if (riskScore >= MONITORING_CONFIG.thresholds.autoBlockIP) {
    await securityMonitor.blockIPAddress(params.ipAddress, 48); // 48 hours for injection
  }
}

export default securityMonitor;
