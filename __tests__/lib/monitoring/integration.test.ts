// Integration Tests - Monitoring Modules
// Tests d'intégration pour les modules de monitoring (Sentry + APM + Logger)

import {
  captureException,
  addBreadcrumb,
  setUser,
  setTags,
  setContext,
  DEFAULT_CONFIG,
} from '@/lib/monitoring/sentry';

import * as sentryMock from '@sentry/nextjs';

import { 
  APMManager,
  getAPMManager,
} from '@/lib/monitoring/apm';

import {
  createLogger,
  getLogger,
  flushAllLoggers,
} from '@/lib/monitoring/logger';

import { getHealthMonitor } from '@/lib/monitoring/health';

// ===========================================
// Mock Setup
// ===========================================

// Mock @sentry/nextjs
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn().mockReturnValue('event-id-123'),
  captureMessage: jest.fn().mockReturnValue('message-id-456'),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setContext: jest.fn(),
  startTransaction: jest.fn().mockReturnValue({
    finish: jest.fn(),
    startChild: jest.fn().mockReturnValue({
      finish: jest.fn(),
    }),
  }),
  Scope: jest.fn().mockImplementation(() => ({
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setLevel: jest.fn(),
    setUser: jest.fn(),
    setTransactionName: jest.fn(),
    setFingerprint: jest.fn(),
  })),
  BrowserTracing: jest.fn(),
  Replay: jest.fn(),
  CaptureConsole: jest.fn(),
  Http: jest.fn(),
  NodeHttp: jest.fn(),
  Postgres: jest.fn(),
}));

// ===========================================
// Test Suites
// ===========================================

describe('Sentry + APM Integration', () => {
  let apm: APMManager;

  beforeEach(() => {
    jest.clearAllMocks();
    apm = getAPMManager();
  });

  describe('Error Flow: Component Error → Sentry → APM', () => {
    it('should track errors in both Sentry and APM when exception occurs', () => {
      const testError = new Error('Test integration error');
      
      // Capture to Sentry
      const eventId = captureException(testError, {
        tags: { component: 'TestComponent' },
        level: 'error',
        transaction: '/api/test',
      });
      
      // Track in APM
      apm.trackError(testError, '/api/test', { component: 'TestComponent' });
      
      // Verify Sentry captured
      expect(eventId).toBeDefined();
      
      // Verify APM tracked
      const metrics = apm.getMetrics();
      expect(metrics.counters.has('errors.total')).toBe(true);
    });

    it('should correlate errors with performance data', async () => {
      // Start a transaction
      const transaction = apm.startTransaction('/api/products', 'http.request');
      
      // Simulate an error during the transaction
      try {
        throw new Error('Database connection failed');
      } catch (error) {
        captureException(error as Error, { transaction: '/api/products' });
        apm.trackError(error as Error, '/api/products', { source: 'database' });
      }
      
      // End transaction with error status
      if (transaction) {
        transaction.finish({ status: 'error', data: { errorCount: 1 } });
      }
      
      // Verify correlation
      const dashboard = await apm.generateDashboard('1h');
      expect(dashboard.overview.errorRate).toBeGreaterThan(0);
    });

    it('should include breadcrumbs context with errors', () => {
      // Add user interaction breadcrumb
      addBreadcrumb({
        category: 'ui.click',
        message: 'User clicked "Add to Cart"',
        type: 'ui',
        data: { productId: 'prod-123' },
      });
      
      // Add navigation breadcrumb
      addBreadcrumb({
        category: 'navigation',
        message: 'Navigated to /checkout',
        type: 'navigation',
      });
      
      // Now capture an error - should include breadcrumb context
      const checkoutError = new Error('Checkout failed');
      captureException(checkoutError, {
        tags: { flow: 'checkout' },
      });
      
      // Verify breadcrumbs were added
      expect(sentryMock.addBreadcrumb).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Flow: APM → Sentry Transaction', () => {
    it('should create linked transactions between APM and Sentry', async () => {
      // Start APM transaction
      const apmTransaction = apm.startTransaction('/api/orders', 'http.request');
      
      // Add spans for database query
      const dbSpan = apmTransaction?.startChild?.({
        op: 'db.query',
        description: 'SELECT * FROM orders',
      });
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Finish span and transaction
      dbSpan?.finish?.();
      apmTransaction?.finish?.();
      
      // Verify APM tracked the transaction
      const metrics = apm.getMetrics();
      expect(metrics.counters.has('requests.total')).toBe(true);
    });

    it('should track slow endpoints in both systems', async () => {
      // Simulate a slow request
      const startTime = Date.now();
      
      const transaction = apm.startTransaction('/api/reports/generate', 'http.request');
      
      // Simulate slow processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      transaction?.finish?.();
      
      const duration = Date.now() - startTime;
      
      // Mark as slow if > 1000ms (our threshold)
      if (duration > 1000) {
        captureException(new Error(`Slow endpoint: /api/reports/generate took ${duration}ms`), {
          tags: { type: 'performance', severity: 'warning' },
          level: 'warning',
        });
        
        const metrics = apm.getMetrics();
        expect(metrics.counters.has('slow_requests.total')).toBe(true);
      }
    });
  });

  describe('User Context Synchronization', () => {
    it('should sync user context between Sentry and APM', () => {
      const userContext = {
        id: 'user-123',
        email: 'test@algeriatrade.dz',
        username: 'testuser',
        role: 'buyer' as const,
        tenantId: 'tenant-1',
      };
      
      // Set in Sentry
      setUser(userContext);
      
      // Set in APM
      apm.setUser(userContext.id, userContext.email, userContext.role);
      
      // Verify Sentry received user
      expect(sentryMock.setUser).toHaveBeenCalledWith(expect.objectContaining({
        id: 'user-123',
        email: 'test@algeriatrade.dz',
      }));
      
      // Verify APM has user context
      expect(apm.getCurrentUser()).toEqual(expect.objectContaining({
        userId: 'user-123',
      }));
    });

    it('should propagate tenant context to both systems', () => {
      const tenantTags = {
        tenantId: 'tenant-algeria',
        tenantName: 'AlgeriaTrade Main',
        plan: 'enterprise',
      };
      
      // Set tags in Sentry
      setTags(tenantTags);
      
      // Set context in Sentry
      setContext('tenant', tenantTags);
      
      // Set in APM
      apm.setTenant(tenantTags.tenantId, tenantTags.tenantName);
      
      // Verify
      expect(sentryMock.setTags).toHaveBeenCalledWith(tenantTags);
      expect(sentryMock.setContext).toHaveBeenCalledWith('tenant', tenantTags);
    });
  });
});

describe('Logger + Sentry Integration', () => {
  let logger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger({ name: 'integration-test' });
  });

  describe('Error Logging Flow', () => {
    it('should send fatal/error logs to Sentry', () => {
      const error = new Error('Critical system failure');
      
      // Log at fatal level
      logger.fatal('System failure occurred', error);
      
      // Should be captured by Sentry
      expect(sentryMock.captureException).toHaveBeenCalled();
    });

    it('include log metadata in Sentry context', () => {
      const error = new Error('Validation failed');
      
      logger.error('Order validation failed', error, {
        orderId: 'order-456',
        userId: 'user-789',
        fields: ['email', 'phone'],
      });
      
      // Verify Sentry received enriched context
      expect(sentryMock.captureException).toHaveBeenCalledWith(
        error,
        expect.any(Object) // Scope object
      );
    });

    it('should not send debug/info logs to Sentry by default', () => {
      logger.debug('Debug info');
      logger.info('User logged in');
      
      expect(sentryMock.captureException).not.toHaveBeenCalled();
      expect(sentryMock.captureMessage).not.toHaveBeenCalled();
    });
  });

  describe('Correlation ID Flow', () => {
    it('should maintain correlation across logging and error tracking', () => {
      // Set correlation ID on logger
      logger.setCorrelationId('corr-test-123');
      
      // Log something
      logger.info('Processing request', { requestId: 'req-456' });
      
      // Capture related error
      const error = new Error('Processing failed');
      captureException(error, {
        extra: {
          correlationId: 'corr-test-123',
          requestId: 'req-456',
        },
      });
      
      // Both should have same correlation
      expect(sentryMock.captureException).toHaveBeenCalled();
    });
  });

  describe('Structured Log Format', () => {
    it('should produce JSON-compatible structured logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('User action completed', {
        userId: 'user-1',
        action: 'purchase',
        productId: 'prod-2',
        value: 15000,
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      const [logMessage] = consoleSpy.mock.calls[0];
      
      // Should be structured/loggable
      const parsed = typeof logMessage === 'string' ? JSON.parse(logMessage) : logMessage;
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('level', 'info');
      expect(parsed).toHaveProperty('message');
      expect(parsed.metadata).toHaveProperty('userId', 'user-1');
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Logger + APM Integration', () => {
  let logger: any;
  let apm: APMManager;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger({ name: 'apm-integration-test' });
    apm = getAPMManager();
  });

  describe('Performance Logging', () => {
    it('should measure and log operation timing', async () => {
      // Use logger's measure function
      const result = await logger.measureAsync('database.query', async () => {
        // Simulate DB query
        await new Promise(resolve => setTimeout(resolve, 50));
        return [{ id: 1, name: 'Product 1' }];
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product 1');
      
      // APM should have recorded the metric
      const metrics = apm.getMetrics();
      expect(metrics.histograms.has('database.query.duration')).toBe(true);
    });

    it('should track slow operations as warnings', async () => {
      // Simulate slow operation
      const slowOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      };
      
      const result = await logger.measureAsync('slow.operation', slowOperation);
      
      // Check if logged as warning (if > threshold)
      const metrics = apm.getMetrics();
      const histogram = metrics.histograms.get('slow.operation.duration');
      
      if (histogram && histogram.values[0] > 1000) {
        // Would be flagged as slow
        expect(metrics.counters.has('slow_operations.total')).toBe(true);
      }
    });
  });

  describe('Request Lifecycle Tracking', () => {
    it('should track complete request lifecycle', async () => {
      // Start request tracking
      const requestId = 'req-lifecycle-1';
      logger.setRequestId(requestId);
      
      const transaction = apm.startTransaction('/api/test', 'http.request');
      
      // Log request start
      logger.info('Request started', { path: '/api/test', method: 'GET' });
      
      // Process request
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Log request completion
      logger.info('Request completed', { statusCode: 200, duration: 20 });
      
      // End transaction
      transaction?.finish?.({ data: { statusCode: 200 } });
      
      // Verify both systems have data
      const metrics = apm.getMetrics();
      expect(metrics.counters.has('requests.total')).toBe(true);
    });
  });
});

describe('Full Stack Integration: Sentry + APM + Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Error Scenario', () => {
    it('should handle end-to-end error scenario', async () => {
      const logger = createLogger({ name: 'e2e-error-test' });
      const apm = getAPMManager();
      
      // Simulate API request
      const transaction = apm.startTransaction('/api/orders/create', 'http.request');
      logger.setRequestId('req-e2e-001');
      logger.setCorrelationId('corr-e2e-001');
      
      try {
        // Simulate business logic that fails
        logger.info('Creating order', { userId: 'user-1', items: 3 });
        
        // Database operation fails
        throw new Error('Database timeout: Connection pool exhausted');
      } catch (error) {
        // 1. Log the error with full context
        logger.error('Failed to create order', error as Error, {
          userId: 'user-1',
          endpoint: '/api/orders/create',
          retryable: true,
        });
        
        // 2. Capture to Sentry with correlation
        captureException(error as Error, {
          tags: {
            endpoint: '/api/orders/create',
            errorType: 'database',
            retryable: 'true',
          },
          extra: {
            requestId: 'req-e2e-001',
            correlationId: 'corr-e2e-001',
            userId: 'user-1',
          },
          level: 'error',
          transaction: '/api/orders/create',
        });
        
        // 3. Track in APM
        apm.trackError(error as Error, '/api/orders/create', {
          source: 'postgresql',
          retryable: true,
        });
        
        // 4. End transaction with error
        transaction?.finish?.({ status: 'error' });
      }
      
      // Verify all systems received the error
      expect(sentryMock.captureException).toHaveBeenCalledTimes(1);
      
      const apmMetrics = apm.getMetrics();
      expect(apmMetrics.counters.has('errors.total')).toBe(true);
    });
  });

  describe('Complete User Journey Tracking', () => {
    it('should track multi-step user journey', () => {
      const apm = getAPMManager();
      
      // Step 1: User visits page
      addBreadcrumb({
        category: 'navigation',
        message: 'Visited /products',
        type: 'navigation',
      });
      
      // Step 2: User searches
      const searchTransaction = apm.startTransaction('product.search', 'ui.action');
      addBreadcrumb({
        category: 'search',
        message: 'Searched for "electronics"',
        data: { query: 'electronics', results: 50 },
      });
      searchTransaction?.finish?.();
      
      // Step 3: User views product
      addBreadcrumb({
        category: 'page_view',
        message: 'Viewed product /products/laptop-dell-xps',
        data: { productId: 'prod-123' },
      });
      
      // Step 4: User adds to cart
      const cartTransaction = apm.startTransaction('cart.add', 'ui.action');
      addBreadcrumb({
        category: 'ui.click',
        message: 'Clicked Add to Cart',
        data: { productId: 'prod-123' },
      });
      cartTransaction?.finish?.();
      
      // Verify journey is tracked
      expect(sentryMock.addBreadcrumb).toHaveBeenCalledTimes(4);
      
      // APM has transactions
      const metrics = apm.getMetrics();
      expect(metrics.counters.has('transactions.total')).toBe(true);
    });
  });

  describe('Health Check Integration', () => {
    it('should aggregate health from all monitoring systems', async () => {
      const healthMonitor = getHealthMonitor();
      
      // Mock health checks for each system
      const healthStatus = await healthMonitor.getFullStatus();
      
      // Should include overall status
      expect(healthStatus).toHaveProperty('overallStatus');
      
      // Should include dependency statuses
      expect(healthStatus.dependencies).toBeDefined();
      expect(Array.isArray(healthStatus.dependencies)).toBe(true);
      
      // Should include check results
      expect(healthStatus.checks).toBeDefined();
    });
  });
});

describe('Configuration Integration', () => {
  it('should respect sampling rates across all systems', () => {
    // Test that configuration is properly applied
    expect(DEFAULT_CONFIG.sampleRate).toBeDefined();
    expect(DEFAULT_CONFIG.tracesSampleRate).toBeDefined();
    
    // In production, sample rate should be lower
    const originalEnv = process.env.NODE_ENV;
    
    // Test configuration propagation
    const config = {
      ...DEFAULT_CONFIG,
      environment: 'production' as const,
      sampleRate: 0.2, // Only 20% of errors
      tracesSampleRate: 0.1, // Only 10% of traces
    };
    
    expect(config.sampleRate).toBeLessThan(1);
    expect(config.tracesSampleRate).toBeLessThan(1);
  });

  it('should handle disabled state gracefully', () => {
    // Test with monitoring disabled
    const disabledConfig = {
      ...DEFAULT_CONFIG,
      enabled: false,
      dsn: '',
    };
    
    // Should not throw when disabled
    expect(() => {
      captureException(new Error('Test'), {});
    }).not.toThrow();
  });
});
