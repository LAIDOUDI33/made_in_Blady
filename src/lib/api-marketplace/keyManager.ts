import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/db';
import { ApiKey, ApiPermission, WebhookEvent, WebhookEventType, DeveloperApp } from './types';

export class ApiKeyManager {
  /**
   * Generate a new API key
   * Returns the plain text key ONLY ONCE - store it securely!
   */
  async createApiKey(params: {
    userId: string;
    name: string;
    permissions: ApiPermission[];
    rateLimit?: number;
    allowedIps?: string[];
    expiresAt?: Date;
  }): Promise<{ apiKey: ApiKey; plainTextKey: string }> {
    // Generate secure random key with prefix
    const rawKey = randomBytes(32).toString('base64url');
    const plainTextKey = `at_${rawKey}`;
    const keyHash = this.hashKey(plainTextKey);
    
    // Store in database (only the hash!)
    const apiKey = await db.apiKey.create({
      data: {
        key: keyHash,
        keyPrefix: `${plainTextKey.substring(0, 8)}...`,
        name: params.name,
        permissions: JSON.stringify(params.permissions),
        rateLimit: params.rateLimit || 100,
        allowedIps: params.allowedIps ? JSON.stringify(params.allowedIps) : null,
        isActive: true,
        ownerId: params.userId,
        expiresAt: params.expiresAt,
      },
    });

    return {
      apiKey: this.formatApiKey(apiKey),
      plainTextKey, // Only returned once!
    };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<{
    valid: boolean;
    apiKey?: ApiKey;
    error?: string;
  }> {
    const keyHash = this.hashKey(key);
    
    const apiKey = await db.apiKey.findUnique({
      where: { key: keyHash },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'API key is deactivated' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Update last used timestamp and usage count
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { 
        lastUsedAt: new Date(), 
        usageCount: { increment: 1 } 
      },
    });

    return {
      valid: true,
      apiKey: this.formatApiKey(apiKey),
    };
  }

  /**
   * Check if IP is allowed for this API key
   */
  isIpAllowed(ip: string, allowedIps?: string[]): boolean {
    if (!allowedIps || allowedIps.length === 0) return true;
    return allowedIps.includes(ip);
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await db.apiKey.updateMany({
      where: { 
        id: keyId, 
        ownerId: userId 
      },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  /**
   * Permanently delete an API key
   */
  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await db.apiKey.deleteMany({
      where: { 
        id: keyId, 
        ownerId: userId 
      },
    });
    return result.count > 0;
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const keys = await db.apiKey.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(k => this.formatApiKey(k));
  }

  /**
   * Get single API key by ID
   */
  async getApiKeyById(keyId: string, userId: string): Promise<ApiKey | null> {
    const key = await db.apiKey.findFirst({
      where: { 
        id: keyId,
        ownerId: userId 
      },
    });
    return key ? this.formatApiKey(key) : null;
  }

  /**
   * Update API key settings (not the key itself)
   */
  async updateApiKey(
    keyId: string, 
    userId: string, 
    updates: {
      name?: string;
      permissions?: ApiPermission[];
      rateLimit?: number;
      allowedIps?: string[];
      isActive?: boolean;
    }
  ): Promise<ApiKey | null> {
    const existing = await db.apiKey.findFirst({
      where: { id: keyId, ownerId: userId },
    });

    if (!existing) return null;

    const updated = await db.apiKey.update({
      where: { id: keyId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.permissions && { permissions: JSON.stringify(updates.permissions) }),
        ...(updates.rateLimit !== undefined && { rateLimit: updates.rateLimit }),
        ...(updates.allowedIps !== undefined && { 
          allowedIps: updates.allowedIps ? JSON.stringify(updates.allowedIps) : null 
        }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      },
    });

    return this.formatApiKey(updated);
  }

  // ============================================
  // WEBHOOK MANAGEMENT
  // ============================================

  /**
   * Create a new webhook subscription
   */
  async createWebhook(params: {
    userId: string;
    eventType: WebhookEventType;
    url: string;
  }): Promise<WebhookEvent> {
    const secret = `wh_${randomBytes(24).toString('hex')}`;
    
    const webhook = await db.webhook.create({
      data: {
        eventType: params.eventType,
        url: params.url,
        secret,
        isActive: true,
        ownerId: params.userId,
      },
    });

    return {
      id: webhook.id,
      eventType: webhook.eventType as WebhookEventType,
      url: webhook.url,
      secret: webhook.secret,
      isActive: webhook.isActive,
      lastTriggeredAt: webhook.lastTriggeredAt ?? undefined,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt,
    };
  }

  /**
   * Get webhooks for a user
   */
  async getUserWebhooks(userId: string): Promise<WebhookEvent[]> {
    const webhooks = await db.webhook.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map(w => ({
      id: w.id,
      eventType: w.eventType as WebhookEventType,
      url: w.url,
      secret: w.secret,
      isActive: w.isActive,
      lastTriggeredAt: w.lastTriggeredAt ?? undefined,
      successCount: w.successCount,
      failureCount: w.failureCount,
      createdAt: w.createdAt,
    }));
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<boolean> {
    const result = await db.webhook.deleteMany({
      where: { 
        id: webhookId, 
        ownerId: userId 
      },
    });
    return result.count > 0;
  }

  // ============================================
  // DEVELOPER APPS MANAGEMENT
  // ============================================

  /**
   * Register a new developer application
   */
  async createDeveloperApp(params: {
    userId: string;
    name: string;
    description: string;
    websiteUrl?: string;
    callbackUrl?: string;
    apiKeyId: string;
  }): Promise<DeveloperApp> {
    const app = await db.developerApp.create({
      data: {
        name: params.name,
        description: params.description,
        websiteUrl: params.websiteUrl,
        callbackUrl: params.callbackUrl,
        apiKeyId: params.apiKeyId,
        ownerId: params.userId,
      },
    });

    return {
      id: app.id,
      name: app.name,
      description: app.description ?? '',
      websiteUrl: app.websiteUrl ?? undefined,
      callbackUrl: app.callbackUrl ?? undefined,
      apiKeyId: app.apiKeyId,
      ownerId: app.ownerId,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  /**
   * Get apps for a developer
   */
  async getUserApps(userId: string): Promise<DeveloperApp[]> {
    const apps = await db.developerApp.findMany({
      where: { ownerId: userId },
      include: {
        apiKey: {
          select: { id: true, name: true, keyPrefix: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return apps.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description ?? '',
      websiteUrl: app.websiteUrl ?? undefined,
      callbackUrl: app.callbackUrl ?? undefined,
      apiKeyId: app.apiKeyId,
      ownerId: app.ownerId,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));
  }

  // ============================================
  // USAGE TRACKING
  // ============================================

  /**
   * Record an API usage event
   */
  async recordUsage(params: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    ip: string;
    userAgent?: string;
  }): Promise<void> {
    await db.apiUsageRecord.create({
      data: {
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        responseTime: params.responseTime,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }

  /**
   * Get usage statistics for an API key
   */
  async getUsageStats(
    apiKeyId: string, 
    days: number = 30
  ): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    requestsByDay: { date: string; count: number }[];
    popularEndpoints: { endpoint: string; count: number }[];
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await db.apiUsageRecord.findMany({
      where: {
        apiKeyId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });

    const totalRequests = records.length;
    const avgResponseTime = totalRequests > 0 
      ? Math.round(records.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests)
      : 0;
    const errorRate = totalRequests > 0
      ? (records.filter(r => r.statusCode >= 400).length / totalRequests) * 100
      : 0;

    // Group by day
    const requestsByDayMap = new Map<string, number>();
    records.forEach(r => {
      const date = r.timestamp.toISOString().split('T')[0];
      requestsByDayMap.set(date, (requestsByDayMap.get(date) || 0) + 1);
    });
    const requestsByDay = Array.from(requestsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by endpoint
    const endpointsMap = new Map<string, number>();
    records.forEach(r => {
      endpointsMap.set(r.endpoint, (endpointsMap.get(r.endpoint) || 0) + 1);
    });
    const popularEndpoints = Array.from(endpointsMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      avgResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsByDay,
      popularEndpoints,
    };
  }

  /**
   * Format API key from database format to our interface
   */
  private formatApiKey(raw: any): ApiKey {
    return {
      id: raw.id,
      key: raw.key,
      keyPrefix: raw.keyPrefix,
      name: raw.name,
      permissions: typeof raw.permissions === 'string' 
        ? JSON.parse(raw.permissions) 
        : raw.permissions,
      rateLimit: raw.rateLimit,
      allowedIps: raw.allowedIps 
        ? (typeof raw.allowedIps === 'string' 
          ? JSON.parse(raw.allowedIps) 
          : raw.allowedIps)
        : undefined,
      webhookUrl: raw.webhookUrl ?? undefined,
      isActive: raw.isActive,
      lastUsedAt: raw.lastUsedAt ?? undefined,
      createdAt: raw.createdAt,
      expiresAt: raw.expiresAt ?? undefined,
      usageCount: raw.usageCount,
    };
  }

  /**
   * Hash an API key for storage (SHA-256)
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

// Singleton export
export const apiKeyManager = new ApiKeyManager();
