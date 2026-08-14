/**
 * AlgeriaTrade.dz - Business Metrics & Analytics System
 * 
 * Features:
 * - Conversion funnel tracking (Visitor → Buyer → Order)
 * - User behavior analytics
 * - Revenue metrics and forecasting
 * - Product performance tracking
 * - Supplier effectiveness metrics
 * - RFQ/Quotation funnel analysis
 * - Cohort analysis support
 * - Custom event tracking for business intelligence
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number; // Of previous step
  overallPercentage: number; // Of first step
  dropoffRate: number;
  avgTimeToComplete: number; // ms from previous step
}

export interface ConversionFunnel {
  id: string;
  name: string;
  period: {
    start: string;
    end: string;
  };
  steps: FunnelStep[];
  totalConversions: number;
  conversionRate: number;
  revenueAttributed: number;
}

export interface UserBehaviorEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventType: 'page_view' | 'click' | 'search' | 'filter' | 'product_view' | 
              'add_to_cart' | 'rfq_create' | 'quote_send' | 'order_place' | 
              'login' | 'register' | 'message_send' | 'review_submit' |
              'favorite_add' | 'share' | 'export' | 'download';
  timestamp: string;
  data: Record<string, any>;
  context: {
    url: string;
    referrer: string;
    userAgent: string;
    ip?: string;
    country?: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    tenantId?: string;
  };
}

export interface SessionAnalytics {
  sessionId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  pageViews: number;
  events: number;
  bounce: boolean;
  exitPage: string;
  entryPage: string;
  pagesVisited: string[];
  conversions: string[];
  deviceType: string;
  country?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface ProductMetrics {
  productId: string;
  period: {
    start: string;
    end: string;
  };
  
  // Views & Engagement
  views: number;
  uniqueViewers: number;
  avgTimeOnPage: number; // seconds
  addToCartCount: number;
  favoriteCount: number;
  shares: number;
  
  // Conversion
  rfqsReceived: number;
  quotationsSent: number;
  ordersPlaced: number;
  conversionRate: number;
  
  // Search & Discovery
  searchAppearances: number;
  clickThroughRate: number;
  positionInSearch: {
    avg: number;
    median: number;
    p90: number;
  };
  
  // Reviews & Trust
  reviewCount: number;
  avgRating: number;
  responseRate: number;
  avgResponseTime: number; // hours
  
  // Revenue
  revenueGenerated: number;
  revenuePerView: number;
}

export interface SupplierMetrics {
  supplierId: string;
  supplierName: string;
  period: {
    start: string;
    end: string;
  };
  
  // Profile Performance
  profileViews: number;
  contactClicks: number;
  websiteVisits: number;
  
  // Products
  totalProducts: number;
  activeProducts: number;
  totalProductViews: number;
  avgViewsPerProduct: number;
  
  // RFQ Management
  rfqsReceived: number;
  rfqsResponded: number;
  responseRate: number;
  avgResponseTime: number; // hours
  
  // Orders & Revenue
  ordersReceived: number;
  orderValueTotal: number;
  avgOrderValue: number;
  completionRate: number; // % of orders completed successfully
  
  // Quality Metrics
  avgRating: number;
  reviewCount: number;
  disputeRate: number;
  onTimeDeliveryRate: number;
  
  // Response Quality
  quotationAcceptanceRate: number;
  messageResponseRate: number;
  avgMessageResponseTime: number; // minutes
}

export interface RevenueMetric {
  timestamp: string;
  period: 'daily' | 'weekly' | 'monthly';
  
  // Totals
  grossRevenue: number;
  netRevenue: number;
  taxCollected: number;
  discountsGiven: number;
  
  // Breakdown
  byPaymentMethod: Record<string, number>;
  byCategory: Record<string, number>;
  byCountry: Record<string, number>;
  byPlan: Record<string, number>; // Subscription plans
  
  // Counts
  transactionCount: number;
  avgTransactionValue: number;
  recurringRevenue: number;
  newCustomerRevenue: number;
  returningCustomerRevenue: number;
  
  // Forecasts
  projectedMonthEnd: number;
  growthRate: number; // vs previous period
}

export interface CohortData {
  cohortId: string;
  cohortDate: string;
  cohortSize: number;
  type: 'acquisition' | 'activation' | 'retention' | 'revenue';
  metrics: Array<{
    period: number; // Week/month number since cohort
    value: number;
    percentage: number; // Of original cohort size
  }>;
}

// ===========================================
// Configuration
// ===========================================

interface BusinessMetricsConfig {
  sessionTimeout: number; // ms
  maxEventsPerSession: number;
  retentionDays: number;
  anonymizeIp: boolean;
  sampleRate: number; // 0-1, for sampling events
  enableRealtime: boolean;
}

const DEFAULT_CONFIG: BusinessMetricsConfig = {
  sessionTimeout: 1800000, // 30 minutes
  maxEventsPerSession: 1000,
  retentionDays: 90,
  anonymizeIp: true,
  sampleRate: 1.0,
  enableRealtime: true,
};

// ===========================================
// Main Business Metrics Class
// ===========================================

class BusinessMetricsTracker {
  private config: BusinessMetricsConfig;
  private sessions: Map<string, SessionAnalytics> = new Map();
  private events: UserBehaviorEvent[] = [];
  private funnels: Map<string, ConversionFunnel> = new Map();
  private productMetrics: Map<string, ProductMetrics> = new Map();
  private supplierMetrics: Map<string, SupplierMetrics> = new Map();
  private revenueHistory: RevenueMetric[] = [];

  constructor(config?: Partial<BusinessMetricsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================
  // Session Management
  // ===========================================

  /**
   * Get or create a user session
   */
  getOrCreateSession(sessionId: string, context?: Partial<SessionAnalytics['context']>): SessionAnalytics {
    let session = this.sessions.get(sessionId);
    
    if (!session || this.isSessionExpired(session)) {
      session = {
        sessionId,
        userId: undefined,
        startTime: new Date().toISOString(),
        endTime: undefined,
        duration: 0,
        pageViews: 0,
        events: 0,
        bounce: true,
        exitPage: '',
        entryPage: context?.url || '',
        pagesVisited: [],
        conversions: [],
        deviceType: context?.deviceType || this.detectDeviceType(),
        country: context?.country,
        source: context?.source,
        medium: context?.medium,
        campaign: context?.campaign,
      };
      
      this.sessions.set(sessionId, session);
    }

    return session;
  }

  /**
   * Update session with page view
   */
  recordPageView(sessionId: string, url: string): void {
    const session = this.getOrCreateSession(sessionId, { url });
    
    session.pageViews++;
    session.pagesVisited.push(url);
    session.exitPage = url;
    session.bounce = session.pageViews === 1;
    session.events++;
    
    if (session.pageViews === 1) {
      session.entryPage = url;
    }
  }

  /**
   * End a session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date().toISOString();
      session.duration = Math.round(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
      );
    }
  }

  // ===========================================
  // Event Tracking
  // ===========================================

  /**
   * Track a business event
   */
  trackEvent(
    eventType: UserBehaviorEvent['eventType'],
    data: Record<string, any>,
    context: Partial<UserBehaviorEvent['context']> = {}
  ): void {
    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    const sessionId = data.sessionId || this.generateSessionId();
    const session = this.getOrCreateSession(sessionId, context);

    const event: UserBehaviorEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: data.userId,
      sessionId,
      eventType,
      timestamp: new Date().toISOString(),
      data,
      context: {
        url: context.url || typeof window !== 'undefined' ? window.location.href : '',
        referrer: context.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
        userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        ip: this.config.anonymizeIp ? undefined : context.ip,
        country: context.country,
        deviceType: context.deviceType || this.detectDeviceType(),
        tenantId: context.tenantId,
      },
    };

    // Store event
    this.events.push(event);
    session.events++;

    // Update specific metrics based on event type
    this.updateMetricsFromEvent(event);

    // Trim old events
    this.trimOldEvents();
  }

  /**
   * Track multiple events in batch
   */
  trackBatch(events: Array<{
    eventType: UserBehaviorEvent['eventType'];
    data: Record<string, any>;
    context?: Partial<UserBehaviorEvent['context']>;
  }>): void {
    for (const event of events) {
      this.trackEvent(event.eventType, event.data, event.context || {});
    }
  }

  // ===========================================
  // Conversion Funnels
  // ===========================================

  /**
   * Define or update a conversion funnel
   */
  defineFunnel(funnelId: string, name: string, steps: string[]): ConversionFunnel {
    const now = new Date();
    const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const funnelSteps: FunnelStep[] = steps.map((stepName, index) => {
      // Count users who completed this step
      const count = this.countUsersInFunnelStep(funnelId, stepName, periodStart, now);
      
      // Calculate percentages
      const prevCount = index > 0 ? 
        this.countUsersInFunnelStep(funnelId, steps[index - 1], periodStart, now) :
        count;
      
      const firstStepCount = this.countUsersInFunnelStep(funnelId, steps[0], periodStart, now);

      return {
        name: stepName,
        count,
        percentage: prevCount > 0 ? (count / prevCount) * 100 : 100,
        overallPercentage: firstStepCount > 0 ? (count / firstStepCount) * 100 : 100,
        dropoffRate: prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0,
        avgTimeToComplete: this.calculateAvgTimeToComplete(funnelId, steps[index - 1], stepName),
      };
    });

    const totalConversions = funnelSteps[funnelSteps.length - 1]?.count || 0;
    const firstStepUsers = funnelSteps[0]?.count || 1;

    const funnel: ConversionFunnel = {
      id: funnelId,
      name,
      period: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      steps: funnelSteps,
      totalConversions,
      conversionRate: (totalConversions / firstStepUsers) * 100,
      revenueAttributed: this.calculateFunnelRevenue(funnelId, periodStart, now),
    };

    this.funnels.set(funnelId, funnel);
    return funnel;
  }

  /**
   * Get predefined e-commerce funnel
   */ 
  getEcommerceFunnel(): ConversionFunnel {
    return this.defineFunnel('ecommerce_main', 'E-Commerce Conversion', [
      'product_view',
      'add_to_cart', // or rfq_create for B2B
      'checkout_start',
      'payment_initiated',
      'order_placed',
    ]);
  }

  /**
   * Get RFQ funnel (B2B specific)
   */
  getRfqFunnel(): ConversionFunnel {
    return this.defineFunnel('rfq_main', 'RFQ Conversion', [
      'product_view',
      'supplier_profile_view',
      'rfq_create',
      'quotation_received',
      'order_placed',
    ]);
  }

  /**
   * Get registration/activation funnel
   */
  getActivationFunnel(): ConversionFunnel {
    return this.defineFunnel('activation', 'User Activation', [
      'page_view',
      'register',
      'email_verified',
      'profile_completed',
      'first_action',
    ]);
  }

  // ===========================================
  // Product Analytics
  // ===========================================

  /**
   * Get metrics for a specific product
   */
  getProductMetrics(productId: string, days: number = 30): ProductMetrics {
    const cached = this.productMetrics.get(productId);
    
    if (cached && !this.isCacheStale(cached.period.end, days)) {
      return cached;
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Filter product-related events
    const productEvents = this.events.filter(e => 
      e.data.productId === productId &&
      new Date(e.timestamp) >= periodStart
    );

    // Calculate metrics
    const metrics: ProductMetrics = {
      productId,
      period: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      
      // Views & Engagement
      views: productEvents.filter(e => e.eventType === 'product_view').length,
      uniqueViewers: new Set(productEvents.filter(e => e.eventType === 'product_view').map(e => e.userId)).size,
      avgTimeOnPage: this.calculateAvgTimeOnPage(productId, productEvents),
      addToCartCount: productEvents.filter(e => e.eventType === 'add_to_cart').length,
      favoriteCount: productEvents.filter(e => e.eventType === 'favorite_add').length,
      shares: productEvents.filter(e => e.eventType === 'share').length,
      
      // Conversion
      rfqsReceived: productEvents.filter(e => e.eventType === 'rfq_create').length,
      quotationsSent: productEvents.filter(e => e.eventType === 'quote_send').length,
      ordersPlaced: productEvents.filter(e => e.eventType === 'order_place').length,
      conversionRate: 0, // Calculated below
      
      // Search & Discovery
      searchAppearances: 0, // Would need search log integration
      clickThroughRate: 0,
      positionInSearch: { avg: 0, median: 0, p90: 0 },
      
      // Reviews & Trust
      reviewCount: productEvents.filter(e => e.eventType === 'review_submit').length,
      avgRating: this.calculateAvgRating(productId),
      responseRate: 0, // Would need supplier data
      avgResponseTime: 0,
      
      // Revenue
      revenueGenerated: this.calculateProductRevenue(productId, productEvents),
      revenuePerView: 0, // Calculated below
    };

    // Calculate derived metrics
    metrics.conversionRate = metrics.views > 0 ? (metrics.ordersPlaced / metrics.views) * 100 : 0;
    metrics.revenuePerView = metrics.views > 0 ? metrics.revenueGenerated / metrics.views : 0;

    // Cache result
    this.productMetrics.set(productId, metrics);
    return metrics;
  }

  /**
   * Get top performing products
   */
  getTopProducts(metric: keyof Pick<ProductMetrics, 'views' | 'conversionRate' | 'revenueGenerated'>, limit: number = 10): ProductMetrics[] {
    const allProducts = Array.from(this.productMetrics.values());
    
    return allProducts
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
      .slice(0, limit);
  }

  // ===========================================
  // Supplier Analytics
  // ===========================================

  /**
   * Get metrics for a supplier
   */
  getSupplierMetrics(supplierId: string, days: number = 30): SupplierMetrics {
    const cached = this.supplierMetrics.get(supplierId);
    
    if (cached && !this.isCacheStale(cached.period.end, days)) {
      return cached;
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Filter supplier-related events
    const supplierEvents = this.events.filter(e => 
      e.data.supplierId === supplierId &&
      new Date(e.timestamp) >= periodStart
    );

    const metrics: SupplierMetrics = {
      supplierId,
      supplierName: e.data.supplierName || 'Unknown',
      period: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      
      profileViews: supplierEvents.filter(e => e.eventType === 'click' && e.data.target === 'profile').length,
      contactClicks: supplierEvents.filter(e => e.eventType === 'click' && e.data.target === 'contact').length,
      websiteVisits: supplierEvents.filter(e => e.eventType === 'click' && e.data.target === 'website').length,
      
      totalProducts: 0, // Would need DB query
      activeProducts: 0,
      totalProductViews: supplierEvents.filter(e => e.eventType === 'product_view' && e.data.supplierId === supplierId).length,
      avgViewsPerProduct: 0,
      
      rfqsReceived: supplierEvents.filter(e => e.eventType === 'rfq_create').length,
      rfqsResponded: supplierEvents.filter(e => e.eventType === 'quote_send').length,
      responseRate: 0,
      avgResponseTime: 0,
      
      ordersReceived: supplierEvents.filter(e => e.eventType === 'order_place').length,
      orderValueTotal: 0,
      avgOrderValue: 0,
      completionRate: 0,
      
      avgRating: 0,
      reviewCount: supplierEvents.filter(e => e.eventType === 'review_submit').length,
      disputeRate: 0,
      onTimeDeliveryRate: 0,
      
      quotationAcceptanceRate: 0,
      messageResponseRate: 0,
      avgMessageResponseTime: 0,
    };

    // Calculate derived metrics
    metrics.responseRate = metrics.rfqsReceived > 0 ? (metrics.rfqsResponded / metrics.rfqsReceived) * 100 : 0;
    metrics.avgOrderValue = metrics.ordersReceived > 0 ? metrics.orderValueTotal / metrics.ordersReceived : 0;
    metrics.avgViewsPerProduct = metrics.activeProducts > 0 ? metrics.totalProductViews / metrics.activeProducts : 0;

    this.supplierMetrics.set(supplierId, metrics);
    return metrics;
  }

  // ===========================================
  // Revenue Analytics
  // ===========================================

  /**
   * Record a revenue event
   */
  recordRevenue(data: {
    amount: number;
    currency: string;
    paymentMethod: string;
    orderId: string;
    userId: string;
    category?: string;
    isRecurring?: boolean;
    isNewCustomer?: boolean;
    couponCode?: string;
  }): void {
    const today = new Date().toISOString().split('T')[0];
    
    let dayMetric = this.revenueHistory.find(r => r.timestamp.startsWith(today));
    
    if (!dayMetric) {
      dayMetric = {
        timestamp: today,
        period: 'daily',
        grossRevenue: 0,
        netRevenue: 0,
        taxCollected: 0,
        discountsGiven: 0,
        byPaymentMethod: {},
        byCategory: {},
        byCountry: {},
        byPlan: {},
        transactionCount: 0,
        avgTransactionValue: 0,
        recurringRevenue: 0,
        newCustomerRevenue: 0,
        returningCustomerRevenue: 0,
        projectedMonthEnd: 0,
        growthRate: 0,
      };
      this.revenueHistory.push(dayMetric);
    }

    // Update totals
    dayMetric.grossRevenue += data.amount;
    dayMetric.transactionCount++;
    
    if (data.isRecurring) {
      dayMetric.recurringRevenue += data.amount;
    } else if (data.isNewCustomer) {
      dayMetric.newCustomerRevenue += data.amount;
    } else {
      dayMetric.returningCustomerRevenue += data.amount;
    }

    // Update breakdowns
    dayMetric.byPaymentMethod[data.paymentMethod] = 
      (dayMetric.byPaymentMethod[data.paymentMethod] || 0) + data.amount;
    
    if (data.category) {
      dayMetric.byCategory[data.category] = 
        (dayMetric.byCategory[data.category] || 0) + data.amount;
    }

    // Recalculate averages
    dayMetric.avgTransactionValue = dayMetric.grossRevenue / dayMetric.transactionCount;
  }

  /**
   * Get revenue metrics for a period
   */
  getRevenueMetrics(period: 'daily' | 'weekly' | 'monthly', periods: number = 7): RevenueMetric[] {
    const sorted = [...this.revenueHistory]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, periods)
      .reverse();

    // Calculate growth rates and projections
    return sorted.map((metric, index) => {
      if (index > 0) {
        const prevMetric = sorted[index - 1];
        metric.growthRate = prevMetric.grossRevenue > 0 
          ? ((metric.grossRevenue - prevMetric.grossRevenue) / prevMetric.grossRevenue) * 100 
          : 0;
        
        // Simple linear projection for month end
        const daysPassed = index + 1;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        metric.projectedMonthEnd = metric.grossRevenue * (daysInMonth / daysPassed);
      }

      return metric;
    });
  }

  // ===========================================
  // Export & Reporting
  // ===========================================

  /**
   * Generate comprehensive dashboard data
   */
  generateDashboard(): {
    overview: {
      totalSessions: number;
      activeUsers: number;
      totalEvents: number;
      bounceRate: number;
      avgSessionDuration: number;
      conversionRate: number;
    };
    funnels: ConversionFunnel[];
    topProducts: ProductMetrics[];
    revenue: RevenueMetric[];
    recentTrends: {
      eventsOverTime: Array<{ date: string; count: number }>;
      conversionsOverTime: Array<{ date: string; count: number }>;
    };
  } {
    const now = new Date();
    const sessionsArray = Array.from(this.sessions.values());
    
    // Active sessions (last 30 minutes)
    const thirtyMinAgo = now.getTime() - 1800000;
    const activeSessions = sessionsArray.filter(s => {
      const lastActivity = s.endTime ? new Date(s.endTime).getTime() : now.getTime();
      return lastActivity > thirtyMinAgo;
    });

    // Bounce rate
    const bouncedSessions = sessionsArray.filter(s => s.bounce && s.pageViews === 1);
    const bounceRate = sessionsArray.length > 0 ? (bouncedSessions.length / sessionsArray.length) * 100 : 0;

    // Average session duration
    const totalDuration = sessionsArray.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = sessionsArray.length > 0 ? totalDuration / sessionsArray.length : 0;

    // Get funnels
    const ecommerceFunnel = this.getEcommerceFunnel();
    const rfqFunnel = this.getRfqFunnel();
    const activationFunnel = this.getActivationFunnel();

    return {
      overview: {
        totalSessions: sessionsArray.length,
        activeUsers: activeSessions.length,
        totalEvents: this.events.length,
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgSessionDuration: Math.round(avgDuration),
        conversionRate: ecommerceFunnel.conversionRate,
      },
      funnels: [ecommerceFunnel, rfqFunnel, activationFunnel],
      topProducts: this.getTopProducts('revenueGenerated', 5),
      revenue: this.getRevenueMetrics('daily', 7),
      recentTrends: {
        eventsOverTime: this.aggregateEventsByDay(7),
        conversionsOverTime: this.aggregateConversionsByDay(7),
      },
    };
  }

  /**
   * Export all data for external BI tools
   */
  exportForBI(): {
    events: UserBehaviorEvent[];
    sessions: SessionAnalytics[];
    funnels: ConversionFunnel[];
    products: ProductMetrics[];
    suppliers: SupplierMetrics[];
    revenue: RevenueMetric[];
  } {
    return {
      events: this.events,
      sessions: Array.from(this.sessions.values()),
      funnels: Array.from(this.funnels.values()),
      products: Array.from(this.productMetrics.values()),
      suppliers: Array.from(this.supplierMetrics.values()),
      revenue: this.revenueHistory,
    };
  }

  // ===========================================
  // Private Helper Methods
  // ===========================================

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private isSessionExpired(session: SessionAnalytics): boolean {
    const lastActivity = session.endTime ? 
      new Date(session.endTime).getTime() : 
      Date.now();
    
    return (Date.now() - lastActivity) > this.config.sessionTimeout;
  }

  private isCacheStale(timestamp: string, retentionDays: number): boolean {
    const cacheAge = Date.now() - new Date(timestamp).getTime();
    return cacheAge > retentionDays * 24 * 60 * 60 * 1000;
  }

  private trimOldEvents(): void {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    
    while (this.events.length > 0 && new Date(this.events[0].timestamp).getTime() < cutoff) {
      this.events.shift();
    }

    // Also limit to max events per session
    if (this.events.length > 100000) {
      this.events = this.events.slice(-50000);
    }
  }

  private updateMetricsFromEvent(event: UserBehaviorEvent): void {
    // This would trigger real-time updates to various metrics
    // For now, we'll just ensure the event is stored
  }

  private countUsersInFunnelStep(
    funnelId: string, 
    stepName: string, 
    start: Date, 
    end: Date
  ): number {
    const uniqueUsers = new Set<string>();
    
    for (const event of this.events) {
      if (
        event.eventType === stepName as UserBehaviorEvent['eventType'] &&
        new Date(event.timestamp) >= start &&
        new Date(event.timestamp) <= end &&
        event.userId
      ) {
        uniqueUsers.add(event.userId);
      }
    }

    return uniqueUsers.size;
  }

  private calculateAvgTimeToComplete(
    _funnelId: string, 
    _fromStep: string, 
    _toStep: string
  ): number {
    // Simplified implementation
    // In production, would track time between steps per user
    return 0;
  }

  private calculateFunnelRevenue(_funnelId: string, _start: Date, _end: Date): number {
    // Would sum up revenue attributed to funnel completions
    return 0;
  }

  private calculateAvgTimeOnPage(_productId: string, _events: UserBehaviorEvent[]): number {
    // Would calculate average time spent on product page
    return 0;
  }

  private calculateAvgRating(_productId: string): number {
    // Would fetch from reviews database
    return 0;
  }

  private calculateProductRevenue(_productId: string, _events: UserBehaviorEvent[]): number {
    // Would sum up order values for this product
    return 0;
  }

  private aggregateEventsByDay(days: number): Array<{ date: string; count: number }> {
    const result: Array<{ date: string; count: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = this.events.filter(e => 
        e.timestamp.startsWith(dateStr)
      ).length;

      result.push({ date: dateStr, count });
    }

    return result;
  }

  private aggregateConversionsByDay(days: number): Array<{ date: string; count: number }> {
    const result: Array<{ date: string; count: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = this.events.filter(e => 
        e.timestamp.startsWith(dateStr) &&
        (e.eventType === 'order_place' || e.eventType === 'rfq_create')
      ).length;

      result.push({ date: dateStr, count });
    }

    return result;
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let businessMetricsInstance: BusinessMetricsTracker | null = null;

export function getBusinessMetricsTracker(config?: Partial<BusinessMetricsConfig>): BusinessMetricsTracker {
  if (!businessMetricsInstance) {
    businessMetricsInstance = new BusinessMetricsTracker(config);
  }
  return businessMetricsInstance;
}

// Convenience export
export const businessMetrics = getBusinessMetricsTracker();

export default {
  getBusinessMetricsTracker,
  BusinessMetricsTracker,
};
