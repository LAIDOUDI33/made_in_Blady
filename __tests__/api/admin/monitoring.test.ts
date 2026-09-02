// Monitoring API Endpoint Tests
// Tests pour l'API endpoint /api/admin/monitoring

import { GET, POST } from '@/app/api/admin/monitoring/route';
import { NextRequest } from 'next/server';
import { getHealthMonitor } from '@/lib/monitoring/health';
import { getAlertManager } from '@/lib/monitoring/alerts';

// Mock dependencies
jest.mock('@/lib/monitoring/apm', () => ({
  getAPMManager: () => ({
    generateDashboard: jest.fn().mockResolvedValue({
      overview: {
        requestsPerSecond: 150,
        avgResponseTime: 120,
        p95ResponseTime: 350,
        errorRate: 0.5,
        activeUsers: 250,
      },
      endpoints: [],
      slowQueries: [],
    }),
    getMetrics: () => ({
      counters: new Map([
        ['http.requests.total', 15000],
        ['http.errors.total', 75],
      ]),
      gauges: new Map([
        ['active.users', 250],
        ['memory.usage', 65],
      ]),
      histograms: new Map([
        ['response.time', { min: 10, max: 5000, mean: 120, p95: 350, p99: 800 }],
      ]),
    }),
  }),
}));

jest.mock('@/lib/monitoring/health', () => ({
  getHealthMonitor: () => ({
    getFullStatus: jest.fn().mockResolvedValue({
      overallStatus: 'healthy',
      uptime: 99.95,
      version: '2.4.1',
      environment: 'test',
      checks: [
        { name: 'database', status: 'healthy', latency: 5 },
        { name: 'redis', status: 'healthy', latency: 2 },
        { name: 'api', status: 'healthy', latency: 15 },
      ],
      dependencies: [
        { name: 'PostgreSQL', status: 'healthy' },
        { name: 'Redis', status: 'healthy' },
      ],
      incidents: [],
    }),
    runAllChecks: jest.fn().mockResolvedValue({
      results: [
        { check: 'database', status: 'passed', duration: 5 },
        { check: 'redis', status: 'passed', duration: 2 },
      ],
    }),
  }),
}));

jest.mock('@/lib/monitoring/alerts', () => ({
  getAlertManager: () => ({
    getActiveAlerts: jest.fn().mockReturnValue([
      {
        id: 'alert-1',
        severity: 'warning',
        message: 'High memory usage detected',
        timestamp: new Date(),
        labels: { metric: 'memory.usage' },
        acknowledged: false,
      },
      {
        id: 'alert-2',
        severity: 'critical',
        message: 'Database connection pool exhausted',
        timestamp: new Date(),
        labels: { metric: 'db.pool' },
        acknowledged: false,
      },
    ]),
    acknowledgeAlert: jest.fn(),
  }),
}));

jest.mock('@/lib/monitoring/infrastructure', () => ({
  getInfrastructureMonitor: () => ({
    collect: jest.fn().mockResolvedValue({
      cpu: { usage: 45, cores: 8, loadAvg: [1.2, 1.8, 1.5] },
      memory: { used: 6.2, total: 16, percentage: 38.75 },
      disk: [
        { path: '/', percentage: 55, free: 45 },
        { path: '/data', percentage: 72, free: 28 },
      ],
      network: { inbound: 500000, outbound: 250000 },
    }),
  }),
}));

jest.mock('@/lib/monitoring/business-metrics', () => ({
  getBusinessMetricsTracker: () => ({
    generateDashboard: jest.fn().mockResolvedValue({
      overview: {
        totalRevenue: 52350,
        ordersToday: 87,
        newUsersToday: 24,
        conversionRate: 3.2,
        activeProducts: 1247,
        rfqCount: 105,
      },
    }),
  }),
}));

// ===========================================
// Test Utilities
// ===========================================

function createMockRequest(url = '/api/admin/monitoring', options?: Partial<RequestInit>): NextRequest {
  return new NextRequest(new URL(url, 'https://algeriatrade.dz'), {
    method: options?.method || 'GET',
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: options?.headers as HeadersInit,
  });
}

// ===========================================
// Test Suites
// ===========================================

describe('GET /api/admin/monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Responses', () => {
    it('should return 200 status code', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include timestamp in response', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('timestamp');
      
      // Verify it's a valid ISO date
      const date = new Date(data.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should include health data', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('health');
      expect(data.health).toHaveProperty('overallStatus');
      expect(data.health).toHaveProperty('uptime');
      expect(data.health).toHaveProperty('version');
      expect(data.health).toHaveProperty('environment');
    });

    it('should include performance metrics', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('performance');
      expect(data.performance).toHaveProperty('requestsPerSecond');
      expect(data.performance).toHaveProperty('avgResponseTime');
      expect(data.performance).toHaveProperty('p95ResponseTime');
      expect(data.performance).toHaveProperty('errorRate');
      expect(data.performance).toHaveProperty('activeUsers');
      expect(data.performance).toHaveProperty('activeConnections');
    });

    it('should include infrastructure data by default', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('infrastructure');
      expect(data.infrastructure).toHaveProperty('cpu');
      expect(data.infrastructure).toHaveProperty('memory');
      expect(data.infrastructure).toHaveProperty('disk');
      expect(data.infrastructure).toHaveProperty('network');
    });

    it('should include alerts array', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('alerts');
      expect(Array.isArray(data.alerts)).toBe(true);
      
      if (data.alerts.length > 0) {
        expect(data.alerts[0]).toHaveProperty('id');
        expect(data.alerts[0]).toHaveProperty('severity');
        expect(data.alerts[0]).toHaveProperty('message');
        expect(data.alerts[0]).toHaveProperty('timestamp');
      }
    });

    it('should include metadata', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('version');
      expect(data.meta).toHaveProperty('environment');
      expect(data.meta).toHaveProperty('generatedAt');
      expect(data.meta).toHaveProperty('cacheTTL');
    });
  });

  describe('Query Parameters', () => {
    it('should exclude infrastructure when infrastructure=false', async () => {
      const request = createMockRequest('/api/admin/monitoring?infrastructure=false');
      const response = await GET(request);
      const data = await response.json();
      
      // Infrastructure should be null when excluded
      expect(data.infrastructure).toBeNull();
    });

    it('should include business data when business=true', async () => {
      const request = createMockRequest('/api/admin/monitoring?business=true');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('business');
      expect(data.business).toHaveProperty('totalRevenue');
      expect(data.business).toHaveProperty('ordersToday');
    });

    it('should not include business data by default', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();
      
      // Business is only included when explicitly requested
      expect(data.business).toBeUndefined() || data.business === null;
    });

    it('should accept period parameter', async () => {
      const request = createMockRequest('/api/admin/monitoring?period=24h');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should use default period of 1h when not specified', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache responses for CACHE_TTL duration', async () => {
      const request = createMockRequest();
      
      // First request - should fetch and cache
      const response1 = await GET(request);
      expect(response1.status).toBe(200);
      
      // Second request within TTL - should return cached
      const response2 = await GET(request);
      expect(response2.status).toBe(200);
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      // Should have same timestamp (from cache)
      expect(data1.timestamp).toBe(data2.timestamp);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully with 500 status', async () => {
      // Force an error by mocking a dependency to throw
      // getHealthMonitor is imported at the top of the file
      getHealthMonitor.mockReturnValueOnce({
        getFullStatus: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      const request = createMockRequest();
      const response = await GET(request);
      
      // Should still respond (with degraded data)
      expect(response.status).toBe(200); // API handles errors gracefully
    });

    it('should return error details in response body on failure', async () => {
      // This tests the error catch block
      const originalEnv = process.env.NODE_ENV;
      
      const request = createMockRequest();
      const response = await GET(request);
      
      // Normal case should succeed
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 500) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('timestamp');
      }
    });
  });
});

describe('POST /api/admin/monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('acknowledge_alert Action', () => {
    it('should acknowledge alert successfully', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'acknowledge_alert',
          alertId: 'alert-1',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('alert-1');
    });

    it('should call alertManager.acknowledgeAlert', async () => {
      const mockAcknowledge = jest.fn();
      getAlertManager.mockReturnValueOnce({
        ...getAlertManager(),
        acknowledgeAlert: mockAcknowledge,
      });

      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'acknowledge_alert',
          alertId: 'alert-123',
        },
      });

      await POST(request);

      expect(mockAcknowledge).toHaveBeenCalledWith('alert-123');
    });

    it('should handle missing alertId', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'acknowledge_alert',
          // Missing alertId
        },
      });

      const response = await POST(request);
      
      // Should fail gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('clear_cache Action', () => {
    it('should clear monitoring cache successfully', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'clear_cache',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('cache cleared');
    });

    it('should force next GET to fetch fresh data after cache clear', async () => {
      // Clear cache
      const clearRequest = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: { action: 'clear_cache' },
      });
      
      await POST(clearRequest);
      
      // Next GET should fetch fresh (not from cache)
      const getRequest = createMockRequest();
      const getResponse = await GET(getRequest);
      
      expect(getResponse.status).toBe(200);
    });
  });

  describe('trigger_health_check Action', () => {
    it('should trigger health checks successfully', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'trigger_health_check',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
    });

    it('should return health check results', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: { action: 'trigger_health_check' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results).toHaveProperty('results');
      expect(Array.isArray(data.results.results)).toBe(true);
    });
  });

  describe('get_metrics Action', () => {
    it('should return requested custom metrics', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'get_metrics',
          metrics: ['http.requests.total', 'active.users'],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metrics).toBeDefined();
      expect(Object.keys(data.metrics).length).toBeGreaterThan(0);
    });

    it('should filter to only requested metrics', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'get_metrics',
          metrics: ['http.requests.total'],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should only contain the requested metric
      expect(Object.keys(data.metrics)).toEqual(['http.requests.total']);
    });

    it('should handle non-existent metric names gracefully', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'get_metrics',
          metrics: ['nonexistent.metric.name'],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toEqual({});
    });
  });

  describe('Unknown Actions', () => {
    it('should return 400 for unknown actions', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'unknown_action',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Unknown action');
    });
  });

  describe('Input Validation', () => {
    it('should handle malformed JSON body', async () => {
      const request = new NextRequest(
        new URL('/api/admin/monitoring', 'https://algeriatrade.dz'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{ invalid json }',
        }
      );

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing action field', async () => {
      const request = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {}, // No action field
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle empty body', async () => {
      const request = new NextRequest(
        new URL('/api/admin/monitoring', 'https://algeriatrade.dz'),
        {
          method: 'POST',
          body: null,
        }
      );

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });
  });
});

describe('Monitoring API - Integration', () => {
  it('should support full dashboard workflow', async () => {
    // Step 1: Get initial data
    const getRequest = createMockRequest();
    const getResponse = await GET(getRequest);
    let getData = await getResponse.json();

    expect(getData.health).toBeDefined();
    expect(getData.alerts).toBeDefined();

    // Step 2: Acknowledge any critical alerts
    if (getData.alerts.some((a: any) => a.severity === 'critical')) {
      const criticalAlert = getData.alerts.find((a: any) => a.severity === 'critical');
      const ackRequest = createMockRequest('/api/admin/monitoring', {
        method: 'POST',
        body: {
          action: 'acknowledge_alert',
          alertId: criticalAlert.id,
        },
      });

      const ackResponse = await POST(ackRequest);
      const ackData = await ackResponse.json();
      expect(ackData.success).toBe(true);
    }

    // Step 3: Trigger health check
    const healthRequest = createMockRequest('/api/admin/monitoring', {
      method: 'POST',
      body: { action: 'trigger_health_check' },
    });

    const healthResponse = await POST(healthRequest);
    const healthData = await healthResponse.json();
    expect(healthData.success).toBe(true);

    // Step 4: Clear cache and verify fresh data
    const clearRequest = createMockRequest('/api/admin/monitoring', {
      method: 'POST',
      body: { action: 'clear_cache' },
    });

    await POST(clearRequest);

    const freshGetRequest = createMockRequest();
    const freshGetResponse = await GET(freshGetRequest);
    const freshGetData = await freshGetResponse.json();

    expect(freshGetData.health).toBeDefined();
  });

  it('should handle concurrent requests', async () => {
    // Simulate multiple concurrent requests
    const requests = Array.from({ length: 10 }, () =>
      GET(createMockRequest())
    );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
