// Performance & Load Tests - Monitoring API
// Tests de performance et de charge pour l'API de monitoring

import { GET, POST } from '@/app/api/admin/monitoring/route';
import { NextRequest } from 'next/server';

// Mock dependencies for performance testing
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
      counters: new Map([['http.requests.total', 10000]]),
      gauges: new Map([['active.users', 250]]),
      histograms: new Map([]),
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
      checks: Array(10).fill(null).map((_, i) => ({
        name: `check-${i}`,
        status: 'healthy',
        latency: Math.random() * 20,
      })),
      dependencies: [
        { name: 'PostgreSQL', status: 'healthy' },
        { name: 'Redis', status: 'healthy' },
      ],
      incidents: [],
    }),
    runAllChecks: jest.fn().mockResolvedValue({ results: [] }),
  }),
}));

jest.mock('@/lib/monitoring/alerts', () => ({
  getAlertManager: () => ({
    getActiveAlerts: jest.fn().mockReturnValue(
      Array(5).fill(null).map((_, i) => ({
        id: `alert-${i}`,
        severity: ['info', 'warning', 'critical'][i % 3],
        message: `Test alert ${i}`,
        timestamp: new Date(),
        labels: { metric: `metric-${i}` },
        acknowledged: false,
      }))
    ),
    acknowledgeAlert: jest.fn(),
  }),
}));

jest.mock('@/lib/monitoring/infrastructure', () => ({
  getInfrastructureMonitor: () => ({
    collect: jest.fn().mockResolvedValue({
      cpu: { usage: 45, cores: 8, loadAvg: [1.2, 1.8, 1.5] },
      memory: { used: 6.2, total: 16, percentage: 38.75 },
      disk: Array(3).fill(null).map((_, i) => ({
        path: `/disk-${i}`,
        percentage: 50 + Math.random() * 30,
        free: 30 + Math.random() * 20,
      })),
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

function createPerfTestRequest(url = '/api/admin/monitoring'): NextRequest {
  return new NextRequest(new URL(url, 'https://algeriatrade.dz'));
}

interface PerformanceResult {
  operation: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}

async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<PerformanceResult & { result: T }> {
  const memoryBefore = process.memoryUsage().heapUsed;
  const startTime = performance.now();
  
  const result = await fn();
  
  const endTime = performance.now();
  const memoryAfter = process.memoryUsage().heapUsed;
  
  return {
    operation,
    duration: endTime - startTime,
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryAfter - memoryBefore,
    result,
  };
}

// ===========================================
// Performance Test Suites
// ===========================================

describe('Monitoring API - Performance Tests', () => {
  describe('GET Endpoint Response Time', () => {
    it('should respond within 100ms for basic request', async () => {
      const result = await measurePerformance('GET /api/admin/monitoring (basic)', async () => {
        const request = createPerfTestRequest();
        return GET(request);
      });
      
      expect(result.duration).toBeLessThan(100);
      expect(result.result.status).toBe(200);
    });

    it('should respond within 200ms with infrastructure data', async () => {
      const result = await measurePerformance('GET with infrastructure=true', async () => {
        const request = createPerfTestRequest('/api/admin/monitoring?infrastructure=true');
        return GET(request);
      });
      
      expect(result.duration).toBeLessThan(200);
      expect(result.result.status).toBe(200);
    });

    it('should respond within 200ms with business data', async () => {
      const result = await measurePerformance('GET with business=true', async () => {
        const request = createPerfTestRequest('/api/admin/monitoring?business=true');
        return GET(request);
      });
      
      expect(result.duration).toBeLessThan(200);
      expect(result.result.status)._be(200);
    });

    it('should respond within 300ms with all data included', async () => {
      const result = await measurePerformance('GET with all data', async () => {
        const request = createPerfTestRequest('/api/admin/monitoring?infrastructure=true&business=true');
        return GET(request);
      });
      
      expect(result.duration).toBeLessThan(300);
      expect(result.result.status).toBe(200);
    });
  });

  describe('POST Endpoint Response Time', () => {
    it('should acknowledge alert within 50ms', async () => {
      const result = await measurePerformance('POST acknowledge_alert', async () => {
        const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
          method: 'POST',
          body: JSON.stringify({ action: 'acknowledge_alert', alertId: 'test-alert' }),
        });
        return POST(request);
      });
      
      expect(result.duration).toBeLessThan(50);
      expect(result.result.status).toBe(200);
    });

    it('should clear cache within 50ms', async () => {
      const result = await measurePerformance('POST clear_cache', async () => {
        const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
          method: 'POST',
          body: JSON.stringify({ action: 'clear_cache' }),
        });
        return POST(request);
      });
      
      expect(result.duration).BeLessThan(50);
      expect(result.result.status).toBe(200);
    });

    it('should trigger health check within 200ms', async () => {
      const result = await measurePerformance('POST trigger_health_check', async () => {
        const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
          method: 'POST',
          body: JSON.stringify({ action: 'trigger_health_check' }),
        });
        return POST(request);
      });
      
      expect(result.duration).toBeLessThan(200);
      expect(result.result.status).toBe(200);
    });

    it('should get custom metrics within 100ms', async () => {
      const result = await measurePerformance('POST get_metrics', async () => {
        const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
          method: 'POST',
          body: JSON.stringify({
            action: 'get_metrics',
            metrics: ['http.requests.total', 'active.users'],
          }),
        });
        return POST(request);
      });
      
      expect(result.duration).toBeLessThan(100);
      expect(result.result.status).toBe(200);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated requests', async () => {
      const iterations = 50;
      const memoryReadings: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const request = createPerfTestRequest();
        await GET(request);
        
        memoryReadings.push(process.memoryUsage().heapUsed);
        
        // Clear cache between requests
        const clearRequest = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
          method: 'POST',
          body: JSON.stringify({ action: 'clear_cache' }),
        });
        await POST(clearRequest);
      }
      
      // Check that memory growth is reasonable (< 10MB over 50 requests)
      const initialMemory = memoryReadings[0];
      const finalMemory = memoryReadings[memoryReadings.length - 1];
      const memoryGrowth = finalMemory - initialMemory;
      
      // Allow up to 10MB growth
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large response payloads efficiently', async () => {
      const result = await measurePerformance('GET large payload', async () => {
        const request = createPerfTestRequest('/api/admin/monitoring?infrastructure=true&business=true');
        const response = await GET(request);
        return response.json();
      });
      
      // Response should be parsed quickly
      expect(result.duration).toBeLessThan(300);
      
      // Response size should be reasonable
      const responseSize = JSON.stringify(result.result).length;
      expect(responseSize).toBeLessThan(100 * 1024); // < 100KB
    });
  });
});

describe('Load Testing Simulation', () => {
  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent requests', async () => {
      const concurrency = 10;
      const startTime = performance.now();
      
      const requests = Array(concurrency).fill(null).map(() =>
        createPerfTestRequest()
      );
      
      const responses = await Promise.all(requests.map(req => GET(req)));
      
      const totalTime = performance.now() - startTime;
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Total time should be less than sum of individual times (parallelism)
      expect(totalTime).toBeLessThan(concurrency * 200); // Much faster than sequential
    });

    it('should handle 50 concurrent requests', async () => {
      const concurrency = 50;
      
      const requests = Array(concurrency).fill(null).map(() =>
        createPerfTestRequest()
      );
      
      const responses = await Promise.all(requests.map(req => GET(req)));
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain response time under load', async () => {
      const concurrency = 25;
      const maxAcceptableTime = 500; // ms
      
      const requests = Array(concurrency).fill(null).map(async (_, i) => {
        const start = performance.now();
        const request = createPerfTestRequest();
        const response = await GET(request);
        const duration = performance.now() - start;
        
        return { index: i, duration, status: response.status };
      });
      
      const results = await Promise.all(requests);
      
      // Check all succeeded and most were fast enough
      const slowRequests = results.filter(r => r.duration > maxAcceptableTime);
      
      // Allow 10% of requests to be slower under load
      expect(slowRequests.length).toBeLessThan(concurrency * 0.1);
    });
  });

  describe('Sustained Load', () => {
    it('should handle sustained requests over time', async () => {
      const durationMs = 2000; // 2 seconds of sustained load
      const intervalMs = 100; // Request every 100ms
      const results: Array<{ time: number; duration: number }> = [];
      
      const startTime = performance.now();
      let requestCount = 0;
      
      while (performance.now() - startTime < durationMs) {
        const reqStart = performance.now();
        const request = createPerfTestRequest();
        await GET(request);
        const reqDuration = performance.now() - reqStart;
        
        results.push({ time: performance.now() - startTime, duration: reqDuration });
        requestCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
      
      // Should have made multiple requests
      expect(requestCount).BeGreaterThan(15); // At least 15-20 in 2s
      
      // Response times should not degrade significantly over time
      const firstHalf = results.slice(0, Math.floor(results.length / 2));
      const secondHalf = results.slice(Math.floor(results.length / 2));
      
      const avgFirstHalf = firstHalf.reduce((sum, r) => sum + r.duration, 0) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((sum, r) => sum + r.duration, 0) / secondHalf.length;
      
      // Second half should not be more than 2x slower than first half
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 2);
    });
  });
});

describe('Cache Performance', () => {
  it('should serve cached responses significantly faster', async () => {
    // First request (uncached)
    const uncachedResult = await measurePerformance('Uncached request', async () => {
      // Clear cache first
      const clearReq = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
        method: 'POST',
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      await POST(clearReq);
      
      const request = createPerfTestRequest();
      return GET(request);
    });
    
    // Second request (cached)
    const cachedResult = await measurePerformance('Cached request', async () => {
      const request = createPerfTestRequest();
      return GET(request);
    });
    
    // Cached should be at least 2x faster
    expect(cachedResult.duration).toBeLessThan(uncachedResult.duration * 0.5);
  });

  it('should respect cache TTL', async () => {
    // This test verifies cache behavior over time
    const request = createPerfTestRequest();
    
    // Multiple rapid requests should hit cache
    const responses = await Promise.all([
      GET(request),
      GET(request),
      GET(request),
    ]);
    
    // All should succeed
    responses.forEach(r => expect(r.status).toBe(200));
    
    // All should have same timestamp (from cache)
    const data1 = await responses[0].json();
    const data2 = await responses[1].json();
    const data3 = await responses[2].json();
    
    expect(data1.timestamp).toBe(data2.timestamp);
    expect(data2.timestamp).toBe(data3.timestamp);
  });
});

describe('Stress Testing Edge Cases', () => {
  it('should handle very long query strings', async () => {
    const longParams = '?'.concat(
      Array(100).fill(null).map((_, i) => `param${i}=value${i}`).join('&')
    );
    
    const request = createPerfTestRequest(`/api/admin/monitoring${longParams}`);
    const response = await GET(request);
    
    // Should not crash
    expect([200, 400, 414]).toContain(response.status);
  });

  it('handle malformed JSON in POST body gracefully', async () => {
    const startTime = performance.now();
    
    const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }',
    });
    
    const response = await POST(request);
    const duration = performance.now() - startTime;
    
    // Should fail fast
    expect(duration).BeLessThan(100);
    expect([400, 500]).toContain(response.status);
  });

  it('should handle empty POST body', async () => {
    const startTime = performance.now();
    
    const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
      method: 'POST',
      body: null,
    });
    
    const response = await POST(request);
    const duration = performance.now() - startTime;
    
    // Should fail fast
    expect(duration).toBeLessThan(100);
  });

  it('should handle very large number of custom metrics request', async () => {
    const metricNames = Array(1000).fill(null).map((_, i) => `custom.metric.${i}`);
    
    const request = new NextRequest(new URL('/api/admin/monitoring', 'https://algeriatrade.dz'), {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_metrics',
        metrics: metricNames,
      }),
    });
    
    const startTime = performance.now();
    const response = await POST(request);
    const duration = performance.now() - startTime;
    
    // Should complete in reasonable time even with many metrics
    expect(duration).BeLessThan(500);
    expect(response.status).toBe(200);
  });
});
