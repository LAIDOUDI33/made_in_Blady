/**
 * AlgeriaTrade.dz - Multi-Tenant Observability System
 * 
 * Features:
 * - Per-tenant performance metrics isolation
 * - Usage quotas and limits tracking
 * - Billing-relevant data collection
 * - Tenant-specific dashboards
 * - Resource utilization per tenant
 * - SLA monitoring and compliance
 * - Tenant onboarding/offboarding tracking
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  period: {
    start: string;
    end: string;
  };
  
  // Request Metrics
  requests: {
    total: number;
    successful: number;
    failed: number;
    errorRate: number;
    byEndpoint: Array<{
      path: string;
      count: number;
      avgDuration: number;
      errorRate: number;
    }>;
  };
  
  // Performance Metrics
  performance: {
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number; // requests/second
  };
  
  // User Activity
  users: {
    active: number;
    new: number;
    churned: number;
    total: number;
    sessions: number;
    avgSessionDuration: number; // seconds
  };
  
  // Resource Usage
  resources: {
    apiCalls: number;
    storageUsed: number; // bytes
    bandwidthUsed: number; // bytes
    messagesSent: number;
    searchesPerformed: number;
    exportsGenerated: number;
  };
  
  // Business Metrics
  business: {
    productsListed: number;
    rfqsCreated: number;
    quotationsSent: number;
    ordersPlaced: number;
    revenue: number; // in local currency
    conversionRate: number; // visitor to buyer
  };
  
  // SLA Compliance
  sla: {
    uptimePercentage: number;
    responseTimeSlaCompliant: boolean;
    errorRateWithinThreshold: boolean;
    overallStatus: 'compliant' | 'warning' | 'breaching';
  };
}

export interface TenantQuota {
  tenantId: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
  
  // API Limits
  apiCalls: {
    limit: number;
    used: number;
    resetAt: string;
    overageAllowed: boolean;
    overagePrice?: number; // per 1000 calls
  };
  
  // Storage Limits
  storage: {
    limit: number; // bytes
    used: number;
    includesBandwidth: boolean;
  };
  
  // Feature Limits
  features: {
    maxProducts: number;
    maxUsers: number;
    maxRfqPerMonth: number;
    customDomain: boolean;
    apiAccess: boolean;
    analyticsRetention: number; // days
    supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  };
  
  // Current Status
  status: 'active' | 'suspended' | 'overLimit' | 'trialExpired';
  warnings: string[];
}

export interface TenantBillingRecord {
  id: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  
  // Usage-based charges
  charges: {
    basePlan: number;
    apiCallsOverage: number;
    storageOverage: number;
    additionalUsers: number;
    customFeatures: number;
    tax: number;
    discount: number;
  };
  
  totals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  generatedAt: string;
  paidAt?: string;
}

export interface TenantEvent {
  id: string;
  tenantId: string;
  type: 'created' | 'upgraded' | 'downgraded' | 'suspended' | 'reactivated' | 'deleted' | 'plan_changed' | 'limit_reached' | 'sla_warning' | 'sla_breach';
  timestamp: string;
  data: Record<string, any>;
  userId?: string;
}

// ===========================================
// Plan Definitions
// ===========================================

const PLAN_DEFINITIONS = {
  free: {
    name: 'Free',
    price: 0,
    apiCalls: { limit: 1000, overageAllowed: false },
    storage: { limit: 500 * 1024 * 1024, includesBandwidth: true }, // 500MB
    features: {
      maxProducts: 10,
      maxUsers: 2,
      maxRfqPerMonth: 5,
      customDomain: false,
      apiAccess: false,
      analyticsRetention: 7,
      supportLevel: 'community',
    },
  },
  starter: {
    name: 'Starter',
    price: 29,
    apiCalls: { limit: 10000, overageAllowed: true, overagePrice: 2 },
    storage: { limit: 5 * 1024 * 1024 * 1024, includesBandwidth: true }, // 5GB
    features: {
      maxProducts: 50,
      maxUsers: 5,
      maxRfqPerMonth: 25,
      customDomain: false,
      apiAccess: true,
      analyticsRetention: 30,
      supportLevel: 'email',
    },
  },
  professional: {
    name: 'Professional',
    price: 99,
    apiCalls: { limit: 100000, overageAllowed: true, overagePrice: 1.5 },
    storage: { limit: 50 * 1024 * 1024 * 1024, includesBandwidth: true }, // 50GB
    features: {
      maxProducts: 500,
      maxUsers: 20,
      maxRfqPerMonth: 150,
      customDomain: true,
      apiAccess: true,
      analyticsRetention: 90,
      supportLevel: 'priority',
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    apiCalls: { limit: 1000000, overageAllowed: true, overagePrice: 1 },
    storage: { limit: 500 * 1024 * 1024 * 1024, includesBandwidth: true }, // 500GB
    features: {
      maxProducts: Infinity,
      maxUsers: 100,
      maxRfqPerMonth: Infinity,
      customDomain: true,
      apiAccess: true,
      analyticsRetention: 365,
      supportLevel: 'dedicated',
    },
  },
} as const;

type PlanType = keyof typeof PLAN_DEFINITIONS;

// ===========================================
// Tenant Metrics Store
// ===========================================

class TenantMetricsStore {
  private currentPeriodData: Map<string, Map<string, number[]>> = new Map();
  private historicalData: Map<string, TenantMetrics[]> = new Map();
  private quotaCache: Map<string, TenantQuota> = new Map();

  /**
   * Record a metric for a specific tenant
   */
  recordMetric(tenantId: string, metricName: string, value: number): void {
    let tenantData = this.currentPeriodData.get(tenantId);
    
    if (!tenantData) {
      tenantData = new Map();
      this.currentPeriodData.set(tenantId, tenantData);
    }
    
    let values = tenantData.get(metricName);
    if (!values) {
      values = [];
      tenantData.set(metricName, values);
    }
    
    values.push(value);
    
    // Keep only last 10000 values in memory (rest goes to DB)
    if (values.length > 10000) {
      values.shift();
    }
  }

  /**
   * Get aggregated metrics for a tenant
   */
  getTenantMetrics(tenantId: string, options?: {
    periodStart?: Date;
    periodEnd?: Date;
  }): Promise<TenantMetrics> {
    // In production, this would query a time-series database
    // For now, aggregate from in-memory data
    
    const now = new Date();
    const periodStart = options?.periodStart || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const periodEnd = options?.periodEnd || now;

    const data = this.currentPeriodData.get(tenantId) || new Map();
    
    // Calculate all metrics
    return {
      tenantId,
      tenantName: `Tenant ${tenantId}`,
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      
      requests: this.calculateRequestMetrics(data),
      performance: this.calculatePerformanceMetrics(data),
      users: this.calculateUserMetrics(data),
      resources: this.calculateResourceMetrics(data),
      business: this.calculateBusinessMetrics(data),
      sla: this.calculateSLAMetrics(data),
    };
  }

  /**
   * Get quota information for a tenant
   */
  async getTenantQuota(tenantId: string): Promise<TenantQuota> {
    // Check cache first
    const cached = this.quotaCache.get(tenantId);
    if (cached && this.isQuotaValid(cached)) {
      return cached;
    }

    // In production, fetch from database
    // For now, return default based on plan
    const plan = await this.getTenantPlan(tenantId);
    const quota = this.buildQuotaFromPlan(tenantId, plan);
    
    // Update with actual usage
    quota.apiCalls.used = this.getCurrentUsage(tenantId, 'api_calls');
    quota.storage.used = this.getCurrentUsage(tenantId, 'storage');
    
    // Determine status
    quota.status = this.determineQuotaStatus(quota);
    quota.warnings = this.generateWarnings(quota);

    // Cache for 5 minutes
    this.quotaCache.set(tenantId, quota);
    
    return quota;
  }

  /**
   * Check if an action is allowed under quota
   */
  async checkQuota(
    tenantId: string,
    resource: 'api_call' | 'product' | 'user' | 'rfq' | 'storage'
  ): Promise<{ allowed: boolean; remaining: number; resetAt?: string }> {
    const quota = await this.getTenantQuota(tenantId);
    
    switch (resource) {
      case 'api_call':
        return {
          allowed: quota.apiCalls.used < quota.apiCalls.limit || quota.apiCalls.overageAllowed,
          remaining: Math.max(0, quota.apiCalls.limit - quota.apiCalls.used),
          resetAt: quota.apiCalls.resetAt,
        };
        
      case 'storage':
        return {
          allowed: quota.storage.used < quota.storage.limit,
          remaining: Math.max(0, quota.storage.limit - quota.storage.used),
        };
        
      case 'product':
        const productCount = this.getCurrentUsage(tenantId, 'products');
        return {
          allowed: productCount < quota.features.maxProducts,
          remaining: Math.max(0, quota.features.maxProducts - productCount),
        };
        
      case 'user':
        const userCount = this.getCurrentUsage(tenantId, 'users');
        return {
          allowed: userCount < quota.features.maxUsers,
          remaining: Math.max(0, quota.features.maxUsers - userCount),
        };
        
      case 'rfq':
        const rfqCount = this.getCurrentUsage(tenantId, 'rfqs_this_month');
        return {
          allowed: rfqCount < quota.features.maxRfqPerMonth,
          remaining: Math.max(0, quota.features.maxRfqPerMonth - rfqCount),
        };
        
      default:
        return { allowed: true, remaining: Infinity };
    }
  }

  /**
   * Generate billing record for a tenant
   */
  async generateBilling(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TenantBillingRecord> {
    const metrics = await this.getTenantMetrics(tenantId, { periodStart, periodEnd });
    const quota = await this.getTenantQuota(tenantId);
    const plan = PLAN_DEFINITIONS[quota.plan as PlanType];

    // Calculate charges
    const apiOverage = Math.max(0, metrics.resources.apiCalls - plan.apiCalls.limit);
    const apiOverageCharge = Math.ceil(apiOverage / 1000) * (plan.apiCalls.overagePrice || 0);

    const storageOverageBytes = Math.max(0, metrics.resources.storageUsed - plan.storage.limit);
    const storageOverageGB = storageOverageBytes / (1024 ** 3);
    const storageOverageCharge = storageOverageGB * 0.5; // $0.5/GB overage

    const subtotal = plan.price + apiOverageCharge + storageOverageCharge;
    const tax = subtotal * 0.19; // 19% VAT (Algeria)
    const discount = this.calculateDiscount(tenantId, subtotal);
    const total = subtotal + tax - discount;

    return {
      id: `bill_${tenantId}_${periodStart.getTime()}_${periodEnd.getTime()}`,
      tenantId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      charges: {
        basePlan: plan.price,
        apiCallsOverage: apiOverageCharge,
        storageOverage: storageOverageCharge,
        additionalUsers: 0, // Would calculate from user count over plan limit
        customFeatures: 0,
        tax,
        discount,
      },
      totals: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100,
        currency: 'DZD', // Algerian Dinar
      },
      status: 'pending',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Record a tenant event
   */
  recordEvent(event: Omit<TenantEvent, 'id' | 'timestamp'>): void {
    const fullEvent: TenantEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    console.log(`📊 [Tenant Event] ${event.tenantId}: ${event.type}`, event.data);

    // In production, store to database and potentially trigger alerts
    if (event.type === 'limit_reached' || event.type === 'sla_warning') {
      this.handleAlertingEvent(fullEvent);
    }
  }

  /**
   * Get dashboard data for all tenants (admin view)
   */
  async getAllTenantsOverview(): Promise<Array<{
    tenantId: string;
    tenantName: string;
    plan: string;
    status: string;
    requestsToday: number;
    errorRate: number;
    avgResponseTime: number;
    activeUsers: number;
    quotaUsagePercent: number;
    slaStatus: string;
  }>> {
    // In production, query database for all tenants
    // For now, return mock data structure
    return [];
  }

  // Private helper methods

  private async getTenantPlan(tenantId: string): Promise<PlanType> {
    // In production, fetch from database
    // Default to free tier
    return 'free';
  }

  private buildQuotaFromPlan(tenantId: string, plan: PlanType): TenantQuota {
    const definition = PLAN_DEFINITIONS[plan];
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      tenantId,
      plan,
      apiCalls: {
        ...definition.apiCalls,
        used: 0,
        resetAt: monthEnd.toISOString(),
      },
      storage: {
        ...definition.storage,
        used: 0,
      },
      features: { ...definition.features },
      status: 'active',
      warnings: [],
    };
  }

  private getCurrentUsage(tenantId: string, metric: string): number {
    const data = this.currentPeriodData.get(tenantId);
    if (!data) return 0;

    const values = data.get(metric) || [];
    if (metric === 'api_calls') return values.length;
    if (metric === 'storage') return values.reduce((a, b) => a + b, 0);
    
    // For other metrics, return latest value or count
    return values.length > 0 ? values[values.length - 1] : 0;
  }

  private determineQuotaStatus(quota: TenantQuota): TenantQuota['status'] {
    if (quota.apiCalls.used >= quota.apiCalls.limit && !quota.apiCalls.overageAllowed) {
      return 'suspended';
    }
    if (quota.apiCalls.used >= quota.apiCalls.limit * 0.9) {
      return 'overLimit';
    }
    return 'active';
  }

  private generateWarnings(quota: TenantQuota): string[] {
    const warnings: string[] = [];
    
    const apiUsagePercent = (quota.apiCalls.used / quota.apiCalls.limit) * 100;
    if (apiUsagePercent > 90) {
      warnings.push(`API usage at ${apiUsagePercent.toFixed(1)}% of limit`);
    }
    
    const storageUsagePercent = (quota.storage.used / quota.storage.limit) * 100;
    if (storageUsagePercent > 90) {
      warnings.push(`Storage usage at ${storageUsagePercent.toFixed(1)}% of limit`);
    }
    
    return warnings;
  }

  private isQuotaValid(quota: TenantQuota): boolean {
    // Cache is valid for 5 minutes
    const lastCheck = new Date(quota.apiCalls.resetAt).getTime(); // Using resetAt as proxy
    return Date.now() - lastCheck < 300000;
  }

  private calculateRequestMetrics(data: Map<string, number[]>): TenantMetrics['requests'] {
    const allRequests = data.get('request_duration') || [];
    const errors = data.get('error_count') || [];

    return {
      total: allRequests.length,
      successful: allRequests.length - errors.reduce((a, b) => a + b, 0),
      failed: errors.reduce((a, b) => a + b, 0),
      errorRate: allRequests.length > 0 ? ((errors.reduce((a, b) => a + b, 0) / allRequests.length) * 100) : 0,
      byEndpoint: [], // Would aggregate by endpoint path
    };
  }

  private calculatePerformanceMetrics(data: Map<string, number[]>): TenantMetrics['performance'] {
    const durations = data.get('request_duration') || [];
    
    if (durations.length === 0) {
      return {
        avgResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
      };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const periodMs = 24 * 60 * 60 * 1000; // 24 hours

    return {
      avgResponseTime: Math.round(sum / sorted.length),
      p50ResponseTime: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95ResponseTime: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99ResponseTime: sorted[Math.floor(sorted.length * 0.99)] || 0,
      throughput: Math.round((sorted.length / periodMs) * 1000),
    };
  }

  private calculateUserMetrics(_data: Map<string, number[]>): TenantMetrics['users'] {
    // Would aggregate from session data
    return {
      active: 0,
      new: 0,
      churned: 0,
      total: 0,
      sessions: 0,
      avgSessionDuration: 0,
    };
  }

  private calculateResourceMetrics(data: Map<string, number[]>): TenantMetrics['resources'] {
    return {
      apiCalls: (data.get('api_calls') || []).length,
      storageUsed: (data.get('storage_bytes') || []).reduce((a, b) => a + b, 0),
      bandwidthUsed: (data.get('bandwidth_bytes') || []).reduce((a, b) => a + b, 0),
      messagesSent: (data.get('messages_sent') || []).length,
      searchesPerformed: (data.get('searches') || []).length,
      exportsGenerated: (data.get('exports') || []).length,
    };
  }

  private calculateBusinessMetrics(data: Map<string, number[]>): TenantMetrics['business'] {
    return {
      productsListed: (data.get('products_created') || []).length,
      rfqsCreated: (data.get('rfqs_created') || []).length,
      quotationsSent: (data.get('quotations_sent') || []).length,
      ordersPlaced: (data.get('orders_placed') || []).length,
      revenue: (data.get('revenue') || []).reduce((a, b) => a + b, 0),
      conversionRate: 0, // Would calculate from funnel data
    };
  }

  private calculateSLAMetrics(metrics: TenantMetrics['requests']): TenantMetrics['sla'] {
    const uptimeTarget = 99.9; // %
    const errorRateTarget = 1; // %
    const responseTimeTarget = 2000; // ms

    const uptimeActual = 99.95; // Would calculate from actual uptime data
    const errorRateOk = metrics.errorRate <= errorRateTarget;
    const responseTimeOk = metrics.performance.avgResponseTime <= responseTimeTarget;

    let overallStatus: TenantMetrics['sla']['overallStatus'] = 'compliant';
    if (!errorRateOk && !responseTimeOk) overallStatus = 'breaching';
    else if (!errorRateOk || !responseTimeOk) overallStatus = 'warning';

    return {
      uptimePercentage: uptimeActual,
      responseTimeSlaCompliant: responseTimeOk,
      errorRateWithinThreshold: errorRateOk,
      overallStatus,
    };
  }

  private calculateDiscount(_tenantId: number, _subtotal: number): number {
    // Would apply volume discounts, loyalty discounts, etc.
    return 0;
  }

  private handleAlertingEvent(event: TenantEvent): void {
    // Integrate with alert manager to send notifications
    console.log(`⚠️ [Tenant Alert] ${event.type} for tenant ${event.tenantId}`, event.data);
    
    // Could trigger Slack notification, email to admin, etc.
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let tenantMetricsInstance: TenantMetricsStore | null = null;

export function getTenantMetricsStore(): TenantMetricsStore {
  if (!tenantMetricsInstance) {
    tenantMetricsInstance = new TenantMetricsStore();
  }
  return tenantMetricsInstance;
}

// Convenience exports
export const tenantMetrics = getTenantMetricsStore();

// Export types and utilities
export { PLAN_DEFINITIONS };
export type { PlanType };

export default {
  getTenantMetricsStore,
  TenantMetricsStore,
};
