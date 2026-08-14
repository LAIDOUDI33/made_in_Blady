// Business Metrics Unit Tests
// Tests pour le module BusinessMetricsTracker

import { getBusinessMetricsTracker, ConversionFunnel, FunnelStep, UserBehaviorEvent } from '@/lib/monitoring/business-metrics';

// ===========================================
// Mock Data Generators
// ===========================================

function createMockEvent(overrides: Partial<UserBehaviorEvent> = {}): UserBehaviorEvent {
  return {
    id: `event-${Date.now()}-${Math.random()}`,
    sessionId: 'test-session-1',
    eventType: 'page_view',
    timestamp: new Date().toISOString(),
    data: {},
    context: {
      url: 'https://algeriatrade.dz/products',
      referrer: 'https://google.com',
      userAgent: 'test-agent/1.0',
      deviceType: 'desktop',
    },
    ...overrides,
  };
}

function createMockFunnelSteps(): FunnelStep[] {
  return [
    { name: 'Visitor', count: 10000, percentage: 100, overallPercentage: 100, dropoffRate: 0, avgTimeToComplete: 0 },
    { name: 'Product View', count: 5000, percentage: 50, overallPercentage: 50, dropoffRate: 50, avgTimeToComplete: 30000 },
    { name: 'Add to Cart', count: 1500, percentage: 30, overallPercentage: 15, dropoffRate: 70, avgTimeToComplete: 120000 },
    { name: 'Checkout', count: 800, percentage: 53.3, overallPercentage: 8, dropoffRate: 46.7, avgTimeToComplete: 300000 },
    { name: 'Purchase', count: 400, percentage: 50, overallPercentage: 4, dropoffRate: 50, avgTimeToComplete: 180000 },
  ];
}

// ===========================================
// Test Suites
// ===========================================

describe('BusinessMetricsTracker', () => {
  let tracker: ReturnType<typeof getBusinessMetricsTracker>;

  beforeEach(() => {
    tracker = getBusinessMetricsTracker({
      enabled: true,
      sampleRate: 1.0,
      batchSize: 10,
      flushInterval: 5000,
    });
  });

  afterEach(() => {
    tracker.destroy();
  });

  describe('Initialization', () => {
    it('should create instance with default options', () => {
      const defaultTracker = getBusinessMetricsTracker();
      expect(defaultTracker).toBeDefined();
      expect(typeof defaultTracker.trackEvent).toBe('function');
      defaultTracker.destroy();
    });

    it('should store configuration options', () => {
      expect(tracker['options'].enabled).toBe(true);
      expect(tracker['options'].sampleRate).toBe(1.0);
      expect(tracker['options'].batchSize).toBe(10);
    });

    it('should initialize empty event buffer', () => {
      expect(tracker.getBufferedEvents()).toEqual([]);
    });

    it('should start with zero counters', () => {
      const snapshot = tracker.getSnapshot();
      expect(snapshot.totalEvents).toBe(0);
      expect(Object.keys(snapshot.countersByType).length).toBe(0);
    });
  });

  describe('Event Tracking', () => {
    it('should track page view events', () => {
      const event = createMockEvent({ eventType: 'page_view' });
      
      tracker.trackEvent(event);
      
      const snapshot = tracker.getSnapshot();
      expect(snapshot.totalEvents).toBe(1);
      expect(snapshot.countersByType['page_view']).toBe(1);
    });

    it('should track multiple event types', () => {
      const events = [
        createMockEvent({ eventType: 'page_view' }),
        createMockEvent({ eventType: 'product_view', id: 'event-2' }),
        createMockEvent({ eventType: 'add_to_cart', id: 'event-3' }),
        createMockEvent({ eventType: 'search', id: 'event-4' }),
      ];

      events.forEach(event => tracker.trackEvent(event));

      const snapshot = tracker.getSnapshot();
      expect(snapshot.totalEvents).toBe(4);
      expect(snapshot.countersByType['page_view']).toBe(1);
      expect(snapshot.countersByType['product_view']).toBe(1);
      expect(snapshot.countersByType['add_to_cart']).toBe(1);
      expect(snapshot.countersByType['search']).toBe(1);
    });

    it('should respect sample rate configuration', () => {
      // Create tracker with 50% sample rate
      const sampledTracker = getBusinessMetricsTracker({ sampleRate: 0.5 });
      
      // Track multiple events
      for (let i = 0; i < 100; i++) {
        sampledTracker.trackEvent(createMockEvent({ id: `event-${i}` }));
      }
      
      const snapshot = sampledTracker.getSnapshot();
      // Should have approximately 50 events (with some variance)
      expect(snapshot.totalEvents).toBeGreaterThan(20);
      expect(snapshot.totalEvents).toBeLessThan(80);
      
      sampledTracker.destroy();
    });

    it('should buffer events until batch size reached', () => {
      const batchTracker = getBusinessMetricsTracker({ batchSize: 5 });
      
      // Track fewer events than batch size
      for (let i = 0; i < 3; i++) {
        batchTracker.trackEvent(createMockEvent({ id: `event-${i}` }));
      }
      
      // Events should be buffered
      expect(batchTracker.getBufferedEvents().length).toBe(3);
      
      batchTracker.destroy();
    });

    it('should flush when batch size is reached', () => {
      const flushSpy = jest.spyOn(tracker as any, 'flush');
      
      // Track exactly batchSize events
      for (let i = 0; i < 10; i++) {
        tracker.trackEvent(createMockEvent({ id: `event-${i}` }));
      }
      
      // Flush should have been called
      expect(flushSpy).toHaveBeenCalled();
      
      flushSpy.mockRestore();
    });
  });

  describe('Conversion Funnels', () => {
    it('should create ecommerce conversion funnel', async () => {
      const funnel = await tracker.getEcommerceFunnel({
        period: { start: '2026-01-01', end: '2026-01-31' },
        tenantId: 'default',
      });

      expect(funnel).toBeDefined();
      expect(funnel.id).toBeDefined();
      expect(funnel.name).toContain('E-commerce');
      expect(Array.isArray(funnel.steps)).toBe(true);
      expect(funnel.steps.length).toBeGreaterThan(0);
    });

    it('should calculate correct conversion rates', async () => {
      const funnel: ConversionFunnel = await tracker.getEcommerceFunnel({
        period: { start: '2026-01-01', end: '2026-01-31' },
      });

      // First step should be 100%
      expect(funnel.steps[0].percentage).toBe(100);
      expect(funnel.steps[0].overallPercentage).toBe(100);

      // Each subsequent step should decrease or stay same
      for (let i = 1; i < funnel.steps.length; i++) {
        expect(funnel.steps[i].overallPercentage).toBeLessThanOrEqual(
          funnel.steps[i - 1].overallPercentage
        );
      }
    });

    it('should include drop-off rates in funnel steps', async () => {
      const funnel: ConversionFunnel = await tracker.getEcommerceFunnel({
        period: { start: '2026-01-01', end: '2026-01-31' },
      });

      funnel.steps.forEach(step => {
        expect(typeof step.dropoffRate).toBe('number');
        expect(step.dropoffRate).toBeGreaterThanOrEqual(0);
        expect(step.dropoffRate).toBeLessThanOrEqual(100);
      });
    });

    it('should create RFQ conversion funnel', async () => {
      const rfqFunnel = await tracker.getRFQFunnel({
        period: { start: '2026-01-01', end: '2026-01-31' },
      });

      expect(rfqFunnel.name).toContain('RFQ') || expect(rfqFunnel.name).toContain('Quotation');
      expect(rfqFunnel.steps.length).toBeGreaterThan(0);
    });

    it('should create user activation funnel', async () => {
      const activationFunnel = await tracker.getUserActivationFunnel({
        period: { start: '2026-01-01', end: '2026-01-31' },
      });

      expect(activationFunnel).toBeDefined();
      expect(activationFunnel.steps.length).toBeGreaterThan(0);
    });

    it('should accept custom funnel definition', async () => {
      const customFunnel = await tracker.createCustomFunnel({
        id: 'custom-test-funnel',
        name: 'Test Custom Funnel',
        steps: [
          { name: 'Step 1', count: 1000 },
          { name: 'Step 2', count: 500 },
          { name: 'Step 3', count: 200 },
        ],
        period: { start: '2026-01-01', end: '2026-01-31' },
      });

      expect(customFunnel.steps.length).toBe(3);
      expect(customFunnel.conversionRate).toBe(20); // 200/1000 * 100
    });
  });

  describe('Product Metrics', () => {
    it('should track product views', () => {
      tracker.trackProductView('product-1', 'category-electronics');
      
      const metrics = tracker.getProductMetrics('product-1');
      expect(metrics.views).toBe(1);
    });

    it('should accumulate product views', () => {
      for (let i = 0; i < 10; i++) {
        tracker.trackProductView('product-1', 'category-electronics');
      }
      
      const metrics = tracker.getProductMetrics('product-1');
      expect(metrics.views).toBe(10);
    });

    it('should track multiple products independently', () => {
      tracker.trackProductView('product-a', 'cat-1');
      tracker.trackProductView('product-b', 'cat-2');
      tracker.trackProductView('product-a', 'cat-1');

      expect(tracker.getProductMetrics('product-a').views).toBe(2);
      expect(tracker.getProductMetrics('product-b').views).toBe(1);
    });

    it('should track add to cart events', () => {
      tracker.trackAddToCart('product-1', 15000, 2);
      
      const metrics = tracker.getProductMetrics('product-1');
      expect(metrics.addToCartCount).toBe(2);
      expect(metrics.revenuePotential).toBe(30000);
    });

    it('should return top products by views', () => {
      // Track views for multiple products
      tracker.trackProductView('prod-1', 'cat-1');
      tracker.trackProductView('prod-2', 'cat-1');
      tracker.trackProductView('prod-1', 'cat-1');
      tracker.trackProductView('prod-1', 'cat-1'); // prod-1: 3 views
      tracker.trackProductView('prod-2', 'cat-1'); // prod-2: 2 views
      tracker.trackProductView('prod-3', 'cat-1'); // prod-3: 1 view

      const topProducts = tracker.getTopProducts(10, 'views');
      
      expect(topProducts[0].productId).toBe('prod-1');
      expect(topProducts[0].views).toBe(3);
    });

    it('should return top products by revenue potential', () => {
      tracker.trackAddToCart('prod-x', 10000, 5); // 50000 potential
      tracker.trackAddToCart('prod-y', 50000, 1); // 50000 potential
      tracker.trackAddToCart('prod-z', 25000, 1); // 25000 potential

      const topProducts = tracker.getTopProducts(10, 'revenue');
      
      // Both x and y have same revenue, order may vary
      expect(topProducts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Supplier Metrics', () => {
    it('should track supplier profile views', () => {
      tracker.trackSupplierView('supplier-1');
      
      const metrics = tracker.getSupplierMetrics('supplier-1');
      expect(metrics.profileViews).toBe(1);
    });

    it('should track RFQs received by supplier', () => {
      tracker.trackSupplierRFQ('supplier-1', 'rfq-1');
      tracker.trackSupplierRFQ('supplier-1', 'rfq-2');
      
      const metrics = tracker.getSupplierMetrics('supplier-1');
      expect(metrics.rfqsReceived).toBe(2);
    });

    it('should track quotations sent by supplier', () => {
      tracker.trackSupplierQuotation('supplier-1', 'quote-1', 50000);
      
      const metrics = tracker.getSupplierMetrics('supplier-1');
      expect(metrics.quotationsSent).toBe(1);
      expect(metrics.quotationValue).toBe(50000);
    });

    it('should calculate response rate', () => {
      tracker.trackSupplierRFQ('supplier-1', 'rfq-1');
      tracker.trackSupplierRFQ('supplier-1', 'rfq-2');
      tracker.trackSupplierQuotation('supplier-1', 'quote-1', 10000);

      const metrics = tracker.getSupplierMetrics('supplier-1');
      expect(metrics.responseRate).toBeCloseTo(50); // 1/2 * 100
    });
  });

  describe('Revenue Tracking', () => {
    it('should track orders and revenue', () => {
      tracker.trackOrder('order-1', 150000, 'DZD', 'completed');
      
      const revenue = tracker.getRevenueMetrics({ 
        period: { start: '2026-01-01', end: '2026-12-31' } 
      });
      
      expect(revenue.totalRevenue).toBe(150000);
      expect(revenue.orderCount).toBe(1);
      expect(revenue.currency).toBe('DZD');
    });

    it('should track orders by status', () => {
      tracker.trackOrder('order-1', 100000, 'DZD', 'completed');
      tracker.trackOrder('order-2', 50000, 'DZD', 'pending');
      tracker.trackOrder('order-3', 75000, 'DZD', 'cancelled');

      const revenue = tracker.getRevenueMetrics({ 
        period: { start: '2026-01-01', end: '2026-12-31' } 
      });

      expect(revenue.orderCount).toBe(3);
      expect(revenue.completedOrders).toBe(1);
      expect(revenue.pendingOrders).toBe(1);
      expect(revenue.cancelledOrders).toBe(1);
    });

    it('should calculate average order value', () => {
      tracker.trackOrder('order-1', 100000, 'DZD', 'completed');
      tracker.trackOrder('order-2', 200000, 'DZD', 'completed');
      tracker.trackOrder('order-3', 300000, 'DZD', 'completed');

      const revenue = tracker.getRevenueMetrics({ 
        period: { start: '2026-01-01', end: '2026-12-31' } 
      });

      expect(revenue.averageOrderValue).toBeCloseTo(200000);
    });

    it('should calculate conversion rate', () => {
      // Track visits and purchases
      for (let i = 0; i < 1000; i++) {
        tracker.trackEvent(createMockEvent({ eventType: 'page_view', id: `visit-${i}` }));
      }
      tracker.trackOrder('order-1', 100000, 'DZD', 'completed');
      tracker.trackOrder('order-2', 100000, 'DZD', 'completed');

      const revenue = tracker.getRevenueMetrics({ 
        period: { start: '2026-01-01', end: '2026-12-31' } 
      });

      expect(revenue.conversionRate).toBeCloseTo(0.2); // 2/1000 * 100
    });
  });

  describe('Cohort Analysis', () => {
    it('should create user cohorts based on registration date', () => {
      const cohorts = tracker.getCohortAnalysis({
        type: 'registration',
        granularity: 'weekly',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
      });

      expect(Array.isArray(cohorts)).toBe(true);
    });

    it('should include retention data in cohorts', () => {
      const cohorts = tracker.getCohortAnalysis({
        type: 'registration',
        granularity: 'weekly',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
      });

      if (cohorts.length > 0) {
        expect(cohorts[0]).toHaveProperty('cohortId');
        expect(cohorts[0]).toHaveProperty('size');
        expect(cohorts[0]).toHaveProperty('retention');
      }
    });
  });

  describe('Real-time Analytics', () => {
    it('should provide real-time active users count', () => {
      const realtime = tracker.getRealtimeAnalytics();
      
      expect(realtime).toHaveProperty('activeUsers');
      expect(realtime).toHaveProperty('eventsPerSecond');
      expect(typeof realtime.activeUsers).toBe('number');
    });

    it('should track active sessions', () => {
      tracker.trackSessionStart('session-1', 'user-1');
      tracker.trackSessionStart('session-2', 'user-2');
      tracker.trackSessionStart('session-3', 'user-3');

      const realtime = tracker.getRealtimeAnalytics();
      expect(realtime.activeUsers).toBeGreaterThanOrEqual(3);
    });

    it('should handle session end', () => {
      tracker.trackSessionStart('session-1', 'user-1');
      tracker.trackSessionEnd('session-1');

      const realtime = tracker.getRealtimeAnalytics();
      // Active users should decrease after session ends
      expect(realtime.activeUsers).toBeLessThan(1);
    });
  });

  describe('Data Export', () => {
    it('should export data as JSON', () => {
      tracker.trackEvent(createMockEvent());
      tracker.trackProductView('prod-1', 'cat-1');
      tracker.trackOrder('order-1', 1000, 'DZD', 'completed');

      const exportedData = tracker.exportData('json');
      
      const parsed = JSON.parse(exportedData);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('metrics');
      expect(parsed.metadata.exportFormat).toBe('json');
    });

    it('should export data as CSV', () => {
      tracker.trackEvent(createMockEvent());

      const csvData = tracker.exportData('csv');
      
      expect(typeof csvData).toBe('string');
      expect(csvData.split('\n').length).toBeGreaterThan(1); // Header + data
    });
  });

  describe('Lifecycle Methods', () => {
    it('destroy should clean up resources', () => {
      tracker.startAutoFlush();
      tracker.destroy();

      expect(tracker['flushIntervalId']).toBeNull();
    });

    it('startAutoFlush should begin periodic flushing', () => {
      tracker.startAutoFlush();
      
      expect(tracker['flushIntervalId']).not.toBeNull();
      
      tracker.stopAutoFlush();
    });

    it('stopAutoFlush should halt periodic flushing', () => {
      tracker.startAutoFlush();
      tracker.stopAutoFlush();
      
      expect(tracker['flushIntervalId']).toBeNull();
    });
  });
});

describe('BusinessMetricsTracker - Edge Cases', () => {
  it('should handle disabled state gracefully', () => {
    const disabledTracker = getBusinessMetricsTracker({ enabled: false });
    
    disabledTracker.trackEvent(createMockEvent());
    
    expect(disabledTracker.getSnapshot().totalEvents).toBe(0);
    
    disabledTracker.destroy();
  });

  it('should handle empty state gracefully', () => {
    const emptyTracker = getBusinessMetricsTracker();
    
    expect(() => emptyTracker.getSnapshot()).not.toThrow();
    expect(() => emptyTracker.getProductMetrics('nonexistent')).not.toThrow();
    expect(() => emptyTracker.getSupplierMetrics('nonexistent')).not.toThrow();
    
    emptyTracker.destroy();
  });

  it('should handle concurrent event tracking', () => {
    const concurrentTracker = getBusinessMetricsTracker();
    
    // Simulate rapid concurrent tracking
    const promises = Array.from({ length: 100 }, (_, i) =>
      Promise.resolve(concurrentTracker.trackEvent(createMockEvent({ id: `concurrent-${i}` })))
    );

    expect(Promise.all(promises)).resolves.not.toThrow();
    
    concurrentTracker.destroy();
  });
});
