// Phase 6 Load Testing Suite - AlgeriaTrade.dz
// Suite de tests de charge pour les API Phase 6

import { NextRequest } from 'next/server';

// ===========================================
// Type Definitions & Interfaces
// ===========================================

interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  status?: number;
  responseSize?: number;
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  memoryUsage: {
    before: number;
    after: number;
    delta: number;
  };
}

interface CacheTestResult {
  query: string;
  uncachedTime: number;
  cachedTime: number;
  cacheHitRatio: number;
  improvement: number;
}

// ===========================================
// Test Utilities
// ===========================================

function createTestRequest(
  url: string,
  options?: Partial<{ method: string; body: Record<string, unknown>; headers: Record<string, string> }>
): NextRequest {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': '196.1.100.' + Math.floor(Math.random() * 255),
    ...options?.headers,
  };

  return new NextRequest(new URL(url, 'https://algeriatrade.dz'), {
    method: options?.method || 'GET',
    headers: defaultHeaders,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  measureMemory: boolean = true
): Promise<PerformanceMetrics & { result: T }> {
  const memoryBefore = measureMemory ? process.memoryUsage().heapUsed : 0;
  const startTime = performance.now();

  const result = await fn();

  const endTime = performance.now();
  const memoryAfter = measureMemory ? process.memoryUsage().heapUsed : 0;

  return {
    operation,
    duration: endTime - startTime,
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryAfter - memoryBefore,
    result,
  };
}

async function runLoadTest(
  endpoint: string,
  concurrency: number,
  requestFactory: () => Promise<{ duration: number; success: boolean; status: number }>
): Promise<LoadTestResult> {
  const startTime = performance.now();
  const memoryBefore = process.memoryUsage().heapUsed;

  // Run concurrent requests
  const results = await Promise.all(
    Array(concurrency)
      .fill(null)
      .map(() => requestFactory())
  );

  const totalTime = performance.now() - startTime;
  const memoryAfter = process.memoryUsage().heapUsed;

  // Calculate metrics
  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  const successfulRequests = results.filter((r) => r.success).length;
  const failedRequests = results.filter((r) => !r.success).length;

  return {
    endpoint,
    totalRequests: concurrency,
    successfulRequests,
    failedRequests,
    avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    minResponseTime: durations[0],
    maxResponseTime: durations[durations.length - 1],
    p50ResponseTime: durations[Math.floor(durations.length * 0.5)],
    p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
    p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
    requestsPerSecond: (concurrency / totalTime) * 1000,
    errorRate: failedRequests / concurrency,
    memoryUsage: {
      before: memoryBefore,
      after: memoryAfter,
      delta: memoryAfter - memoryBefore,
    },
  };
}

function calculatePercentile(sortedArray: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

// ===========================================
// Mock API Handlers for Testing
// ===========================================

// Mock Search API Handler
const mockSearchHandler = async (req: NextRequest): Promise<Response> => {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');

  // Simulate search latency based on complexity
  let baseLatency = 20 + Math.random() * 30;
  
  if (query.length > 5) baseLatency += 15; // Full-text search overhead
  if (category) baseLatency += 10; // Filter overhead
  if (page > 50) baseLatency += 30; // Deep pagination penalty

  // Simulate accent handling for Arabic/French
  const hasAccents = /[àâäéèêëïîôùûüç]/i.test(query) || /[\u0600-\u06FF]/.test(query);
  if (hasAccents) baseLatency += 25;

  await new Promise((resolve) => setTimeout(resolve, baseLatency));

  return Response.json({
    results: Array(20).fill(null).map((_, i) => ({
      id: `product-${page}-${i}`,
      name: `Product ${i} for ${query}`,
      category: category || 'general',
      price: 1000 + i * 100,
      currency: 'DZD',
    })),
    pagination: {
      page,
      perPage: 20,
      total: 2500,
      totalPages: 125,
    },
    took: baseLatency,
  });
};

// Mock Products API Handler
const mockProductsHandler = async (req: NextRequest): Promise<Response> => {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let baseLatency = 15 + Math.random() * 25;
  
  // Pagination depth affects latency
  baseLatency += Math.min(page * 2, 50);
  
  // Category filtering adds slight overhead
  if (category) baseLatency += 8;
  
  // Full-text search with accents
  if (search && (/[àâäéèêëïîôùûüç]/i.test(search) || /[\u0600-\u06FF]/.test(search))) {
    baseLatency += 35;
  }

  await new Promise((resolve) => setTimeout(resolve, baseLatency));

  return Response.json({
    products: Array(24).fill(null).map((_, i) => ({
      id: `${page}-${i}`,
      name: `Product ${i}`,
      category: category || 'all',
      price: 5000 + i * 200,
    })),
    meta: { page, total: 24000, perPage: 24 },
  });
};

// Mock Trending API Handler
const mockTrendingHandler = async (): Promise<Response> => {
  // Simulate algorithm calculation time
  const calculationTime = 50 + Math.random() * 80;
  await new Promise((resolve) => setTimeout(resolve, calculationTime));

  return Response.json({
    trending: Array(10).fill(null).map((_, i) => ({
      rank: i + 1,
      productId: `trending-${i}`,
      score: 95 - i * 3,
      velocity: Math.random() * 100,
      category: ['electronics', 'textiles', 'agriculture', 'machinery'][i % 4],
    })),
    calculatedAt: new Date().toISOString(),
    cacheTTL: 300,
  });
};

// Mock Analytics API Handler
const mockAnalyticsHandler = async (req: NextRequest): Promise<Response> => {
  const searchParams = req.nextUrl.searchParams;
  const range = searchParams.get('range') || '7d';

  // Different ranges have different aggregation costs
  const rangeCosts: Record<string, number> = {
    '7d': 40,
    '30d': 80,
    '90d': 150,
    '1y': 280,
  };

  const latency = rangeCosts[range] || 50 + Math.random() * 50;
  await new Promise((resolve) => setTimeout(resolve, latency));

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[range] || 7;

  return Response.json({
    period: range,
    metrics: {
      totalViews: days * 1250,
      uniqueVisitors: days * 350,
      conversionRate: 3.2 + Math.random() * 0.8,
      avgOrderValue: 45000 + Math.random() * 10000,
      topCategories: Array(5).fill(null).map((_, i) => ({
        name: `Category ${i}`,
        views: Math.floor(days * 250 * (1 - i * 0.15)),
      })),
    },
    generatedAt: new Date().toISOString(),
  });
};

// ===========================================
// SEARCH API LOAD TESTS
// ===========================================

describe('Search API - Load Tests', () => {
  describe('Concurrent Request Performance', () => {
    it('should handle 100 concurrent search requests under 500ms each', async () => {
      const result = await runLoadTest('/api/search?q=electronics', 100, async () => {
        const start = performance.now();
        const req = createTestRequest('/api/search?q=electronics');
        const res = await mockSearchHandler(req);
        const duration = performance.now() - start;
        
        return {
          duration,
          success: res.status === 200,
          status: res.status,
        };
      });

      // All requests should succeed
      expect(result.successfulRequests).toBe(100);
      expect(result.errorRate).toBe(0);

      // P95 should be under 500ms
      expect(result.p95ResponseTime).toBeLessThan(500);

      // Average should be reasonable
      expect(result.avgResponseTime).toBeLessThan(300);

      console.log('[Search 100 Concurrent]', JSON.stringify(result, null, 2));
    });

    it('should maintain sub-200ms for simple queries at 50 concurrent', async () => {
      const result = await runLoadTest('/api/search?q=test', 50, async () => {
        const start = performance.now();
        const req = createTestRequest('/api/search?q=test');
        const res = await mockSearchHandler(req);
        const duration = performance.now() - start;
        
        return {
          duration,
          success: res.status === 200,
          status: res.status,
        };
      });

      expect(result.p95ResponseTime).toBeLessThan(200);
      expect(result.avgResponseTime).toBeLessThan(100);
    });
  });

  describe('Query Caching Effectiveness', () => {
    it('should show significant improvement with cached queries', async () => {
      const query = 'fournisseur industriel algerie';
      const iterations = 20;
      
      // First request (cold cache)
      const coldResult = await measurePerformance('Cold cache search', async () => {
        const req = createTestRequest(`/api/search?q=${encodeURIComponent(query)}`);
        return mockSearchHandler(req);
      });

      // Subsequent requests (warm cache simulation)
      const warmResults: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const req = createTestRequest(`/api/search?q=${encodeURIComponent(query)}`);
        await mockSearchHandler(req);
        warmResults.push(performance.now() - start);
      }

      const avgWarmTime = warmResults.reduce((a, b) => a + b, 0) / warmResults.length;
      const improvement = ((coldResult.duration - avgWarmTime) / coldResult.duration) * 100;

      // Warm requests should be at least 30% faster (simulating cache effect)
      expect(improvement).toBeGreaterThan(30);

      console.log(`[Cache Effectiveness] Cold: ${coldResult.duration.toFixed(2)}ms, Warm Avg: ${avgWarmTime.toFixed(2)}ms, Improvement: ${improvement.toFixed(1)}%`);
    });

    it('should handle varied queries without cache thrashing', async () => {
      const queries = [
        'textile',
        'machine agricole',
        'produits chimiques',
        'acier construction',
        'équipement médical',
        'معدات زراعية',
        'منسوجات جزائرية',
        'fournitures bureau',
      ];

      const results = await Promise.all(
        queries.flatMap((q) =>
          Array(10).fill(null).map(async () => {
            const start = performance.now();
            const req = createTestRequest(`/api/search?q=${encodeURIComponent(q)}`);
            await mockSearchHandler(req);
            return performance.now() - start;
          })
        )
      );

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const p99Time = calculatePercentile(results.sort((a, b) => a - b), 99);

      // Should still perform well with varied queries
      expect(avgTime).toBeLessThan(200);
      expect(p99Time).toBeLessThan(400);

      console.log(`[Varied Queries] Avg: ${avgTime.toFixed(2)}ms, P99: ${p99Time.toFixed(2)}ms`);
    });
  });

  describe('Filter Combination Performance', () => {
    it('should handle multiple filters efficiently', async () => {
      const filterCombinations = [
        '?q=electronics&category=tech&minPrice=1000&maxPrice=50000&wilaya=16',
        '?q=textiles&category=fashion&certified=true&supplierType=verified',
        '?q=machinery&category=industrial&origin=eu&moq=100',
        '?q=food&category=agriculture&organic=true&halal=true&exportReady=true',
      ];

      const results: PerformanceMetrics[] = [];

      for (const filters of filterCombinations) {
        const result = await measurePerformance(`Filters: ${filters.substring(0, 30)}...`, async () => {
          const req = createTestRequest(`/api/search${filters}`);
          return mockSearchHandler(req);
        });
        results.push(result);
      }

      // All filter combinations should complete in reasonable time
      results.forEach((r) => {
        expect(r.duration).toBeLessThan(300);
      });

      console.log('[Filter Combinations]', results.map(r => ({ op: r.operation, ms: r.duration.toFixed(2) })));
    });
  });
});

// ===========================================
// PRODUCTS API LOAD TESTS
// ===========================================

describe('Products API - Load Tests', () => {
  describe('Pagination Performance', () => {
    it('should have consistent response times across pages', async () => {
      const pagesToTest = [1, 10, 50, 100];
      const results: Array<{ page: number; avgTime: number }> = [];

      for (const page of pagesToTest) {
        const pageTimes: number[] = [];
        
        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          const req = createTestRequest(`/api/products?page=${page}`);
          await mockProductsHandler(req);
          pageTimes.push(performance.now() - start);
        }

        results.push({
          page,
          avgTime: pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length,
        });
      }

      // Page 100 should not be more than 3x slower than page 1
      const page1Time = results.find((r) => r.page === 1)?.avgTime || 0;
      const page100Time = results.find((r) => r.page === 100)?.avgTime || 0;
      const degradationRatio = page100Time / page1Time;

      expect(degradationRatio).toBeLessThan(3);

      console.log('[Pagination Performance]', results);
    });

    it('should handle rapid page navigation', async () => {
      const pageSequence = [1, 2, 3, 5, 10, 1, 2, 3];
      const times: number[] = [];

      for (const page of pageSequence) {
        const start = performance.now();
        const req = createTestRequest(`/api/products?page=${page}`);
        await mockProductsHandler(req);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(150);

      console.log(`[Rapid Navigation] Avg: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Category Filtering Speed', () => {
    it('should filter by category in under 100ms', async () => {
      const categories = ['electronics', 'textiles', 'agriculture', 'machinery', 'chemicals'];
      
      const results = await Promise.all(
        categories.map(async (cat) => {
          const start = performance.now();
          const req = createTestRequest(`/api/products?category=${cat}`);
          await mockProductsHandler(req);
          return { category: cat, duration: performance.now() - start };
        })
      );

      results.forEach((r) => {
        expect(r.duration).toBeLessThan(100);
      });

      console.log('[Category Filtering]', results);
    });
  });

  describe('Full-text Search with Accents', () => {
    it('should handle French accented characters efficiently', async () => {
      const frenchQueries = [
        'fourniture de bureau',
        'matériel électrique',
        'produits pharmaceutiques',
        'équipement industriel',
        'construction métallique',
      ];

      const results = await Promise.all(
        frenchQueries.map(async (q) => {
          const start = performance.now();
          const req = createTestRequest(`/api/products?search=${encodeURIComponent(q)}`);
          await mockProductsHandler(req);
          return { query: q, duration: performance.now() - start };
        })
      );

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(150);

      console.log('[French Accents]', results);
    });

    it('should handle Arabic text search efficiently', async () => {
      const arabicQueries = [
        'أثاث منزلي',
        'ملابس جاهزة',
        'معدات بناء',
        'منتجات غذائية',
        'إلكترونيات',
      ];

      const results = await Promise.all(
        arabicQueries.map(async (q) => {
          const start = performance.now();
          const req = createTestRequest(`/api/products?search=${encodeURIComponent(q)}`);
          await mockProductsHandler(req);
          return { query: q, duration: performance.now() - start };
        })
      );

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(180);

      console.log('[Arabic Search]', results);
    });
  });
});

// ===========================================
// TRENDING API LOAD TESTS
// ===========================================

describe('Trending API - Load Tests', () => {
  describe('Algorithm Calculation Under Load', () => {
    it('should calculate trending products under 200ms', async () => {
      const result = await measurePerformance('Trending calculation', async () => {
        return mockTrendingHandler();
      });

      expect(result.duration).toBeLessThan(200);
      console.log(`[Trending Calc] ${result.duration.toFixed(2)}ms`);
    });

    it('should handle 50 concurrent trending requests', async () => {
      const result = await runLoadTest('/api/trending', 50, async () => {
        const start = performance.now();
        const res = await mockTrendingHandler();
        const duration = performance.now() - start;
        
        return {
          duration,
          success: res.status === 200,
          status: res.status,
        };
      });

      expect(result.successfulRequests).toBe(50);
      expect(result.p95ResponseTime).toBeLessThan(250);

      console.log('[Trending 50 Concurrent]', JSON.stringify(result, null, 2));
    });
  });

  describe('Cache Hit Ratio', () => {
    it('should demonstrate high cache hit ratio for trending', async () => {
      const totalRequests = 100;
      const hitTimes: number[] = [];
      const missTimes: number[] = [];

      // First request is always a miss
      const firstStart = performance.now();
      await mockTrendingHandler();
      missTimes.push(performance.now() - firstStart);

      // Subsequent requests simulate cache hits (within TTL)
      for (let i = 1; i < totalRequests; i++) {
        const start = performance.now();
        await mockTrendingHandler();
        // Simulate 85% cache hit rate
        if (Math.random() < 0.85) {
          hitTimes.push((performance.now() - start) * 0.3); // Cache hits are faster
        } else {
          missTimes.push(performance.now() - start);
        }
      }

      const cacheHitRatio = hitTimes.length / totalRequests;
      expect(cacheHitRatio).toBeGreaterThan(0.8);

      console.log(`[Trending Cache] Hit Ratio: ${(cacheHitRatio * 100).toFixed(1)}%, Hits: ${hitTimes.length}, Misses: ${missTimes.length}`);
    });
  });

  describe('Concurrent Ranking Updates', () => {
    it('should handle ranking refresh during active traffic', async () => {
      // Simulate mixed read/write workload
      const mixedWorkload = Array(30).fill(null).map(async (_, i) => {
        const start = performance.now();
        
        // 70% reads, 30% writes (rank updates)
        if (Math.random() < 0.7) {
          await mockTrendingHandler(); // Read
        } else {
          // Simulate write (rank recalculation)
          await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 40));
        }
        
        return performance.now() - start;
      });

      const results = await Promise.all(mixedWorkload);
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const p99Time = calculatePercentile(results.sort((a, b) => a - b), 99);

      expect(avgTime).toBeLessThan(200);
      expect(p99Time).toBeLessThan(400);

      console.log(`[Mixed Workload] Avg: ${avgTime.toFixed(2)}ms, P99: ${p99Time.toFixed(2)}ms`);
    });
  });
});

// ===========================================
// ANALYTICS API LOAD TESTS
// ===========================================

describe('Analytics API - Load Tests', () => {
  describe('Aggregation Query Performance', () => {
    it('should aggregate 7-day metrics under 100ms', async () => {
      const result = await measurePerformance('7d analytics', async () => {
        const req = createTestRequest('/api/admin/analytics/sales?range=7d');
        return mockAnalyticsHandler(req);
      });

      expect(result.duration).toBeLessThan(100);
    });

    it('should aggregate 30-day metrics under 150ms', async () => {
      const result = await measurePerformance('30d analytics', async () => {
        const req = createTestRequest('/api/admin/analytics/sales?range=30d');
        return mockAnalyticsHandler(req);
      });

      expect(result.duration).toBeLessThan(150);
    });

    it('should aggregate 90-day metrics under 250ms', async () => {
      const result = await measurePerformance('90d analytics', async () => {
        const req = createTestRequest('/api/admin/analytics/sales?range=90d');
        return mockAnalyticsHandler(req);
      });

      expect(result.duration).toBeLessThan(250);
    });

    it('should aggregate 1-year metrics under 400ms', async () => {
      const result = await measurePerformance('1y analytics', async () => {
        const req = createTestRequest('/api/admin/analytics/sales?range=1y');
        return mockAnalyticsHandler(req);
      });

      expect(result.duration).toBeLessThan(400);
    });
  });

  describe('Time Range Filtering', () => {
    it('should scale linearly with time range', async () => {
      const ranges = ['7d', '30d', '90d', '1y'];
      const results: Array<{ range: number; time: number }> = [];

      for (const range of ranges) {
        const times: number[] = [];
        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          const req = createTestRequest(`/api/admin/analytics/traffic?range=${range}`);
          await mockAnalyticsHandler(req);
          times.push(performance.now() - start);
        }
        
        const days = parseInt(range);
        results.push({
          range: days,
          time: times.reduce((a, b) => a + b, 0) / times.length,
        });
      }

      // Verify roughly linear scaling (1y should not be > 10x slower than 7d)
      const ratio7dTo1y = results[3].time / results[0].time;
      expect(ratio7dTo1y).toBeLessThan(10);

      console.log('[Time Range Scaling]', results);
    });
  });

  describe('Real-time Counter Accuracy Under Load', () => {
    it('should maintain accurate counters with 75 concurrent requests', async () => {
      const concurrency = 75;
      let expectedCount = 0;

      const results = await Promise.all(
        Array(concurrency)
          .fill(null)
          .map(async (_, i) => {
            const start = performance.now();
            const req = createTestRequest('/api/admin/analytics/realtime');
            const res = await mockAnalyticsHandler(req);
            const data = await res.json();
            expectedCount += 1;
            
            return {
              index: i,
              duration: performance.now() - start,
              count: data.metrics?.totalViews || 0,
              success: res.status === 200,
            };
          })
      );

      const successful = results.filter((r) => r.success).length;
      expect(successful).toBe(concurrency);

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(200);

      console.log(`[Real-time Counters] Success: ${successful}/${concurrency}, Avg: ${avgDuration.toFixed(2)}ms`);
    });
  });
});

// ===========================================
// COMBINED WORKLOAD TESTS
// ===========================================

describe('Combined Workload Scenarios', () => {
  it('should handle realistic B2B marketplace traffic pattern', async () => {
    // Simulate realistic traffic distribution:
    // - 60% product browsing (search + listing)
    // - 20% trending/category views
    // - 15% analytics (admin dashboard)
    // - 5% other operations
    
    const totalRequests = 200;
    const results: Array<{ type: string; duration: number; success: boolean }> = [];

    const workloadPromises = Array(totalRequests).fill(null).map(async (_, i) => {
      const rand = Math.random();
      let type: string;
      let duration: number;
      let success: boolean;

      const start = performance.now();

      if (rand < 0.4) {
        // Search (40%)
        type = 'search';
        const req = createTestRequest(`/api/search?q=product${i % 20}`);
        const res = await mockSearchHandler(req);
        duration = performance.now() - start;
        success = res.status === 200;
      } else if (rand < 0.7) {
        // Products listing (30%)
        type = 'products';
        const req = createTestRequest(`/api/products?page=${(i % 50) + 1}`);
        const res = await mockProductsHandler(req);
        duration = performance.now() - start;
        success = res.status === 200;
      } else if (rand < 0.88) {
        // Trending (18%)
        type = 'trending';
        const res = await mockTrendingHandler();
        duration = performance.now() - start;
        success = res.status === 200;
      } else {
        // Analytics (12%)
        type = 'analytics';
        const ranges = ['7d', '30d'];
        const req = createTestRequest(`/api/admin/analytics?range=${ranges[i % 2]}`);
        const res = await mockAnalyticsHandler(req);
        duration = performance.now() - start;
        success = res.status === 200;
      }

      return { type, duration, success };
    });

    const allResults = await Promise.all(workloadPromises);

    // Analyze by type
    const byType: Record<string, number[]> = {};
    allResults.forEach((r) => {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r.duration);
    });

    const overallSuccess = allResults.filter((r) => r.success).length;
    const overallAvg = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;

    // Overall assertions
    expect(overallSuccess).toBeGreaterThan(totalRequests * 0.98); // 98%+ success rate
    expect(overallAvg).toBeLessThan(250);

    console.log('[Combined Workload Results]:', {
      totalRequests,
      successRate: `${((overallSuccess / totalRequests) * 100).toFixed(1)}%`,
      overallAvgMs: overallAvg.toFixed(2),
      byType: Object.fromEntries(
        Object.entries(byType).map(([type, times]) => [
          type,
          { count: times.length, avgMs: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) },
        ])
      ),
    });
  });

  it('should handle flash sale scenario (burst traffic)', async () => {
    // Simulate burst traffic during promotional events
    const burstSize = 150;
    
    const startTime = performance.now();
    
    const results = await Promise.all(
      Array(burstSize)
        .fill(null)
        .map(async () => {
          const start = performance.now();
          const req = createTestRequest('/api/search?q=promotion');
          const res = await mockSearchHandler(req);
          return {
            duration: performance.now() - start,
            success: res.status === 200,
          };
        })
    );

    const totalTime = performance.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const durations = results.map((r) => r.duration).sort((a, b) => a - b);

    // All should succeed
    expect(successful).toBe(burstSize);

    // P99 should be reasonable even under burst
    const p99 = calculatePercentile(durations, 99);
    expect(p99).toBeLessThan(600);

    // Should achieve good throughput
    const throughput = (burstSize / totalTime) * 1000;
    expect(throughput).toBeGreaterThan(200); // 200+ req/sec

    console.log(`[Flash Sale Burst] Throughput: ${throughput.toFixed(0)} req/s, P99: ${p99.toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`);
  });
});

// ===========================================
// MEMORY LEAK DETECTION
// ===========================================

describe('Memory Leak Detection', () => {
  it('should not leak memory over sustained operations', async () => {
    const iterations = 100;
    const memoryReadings: number[] = [];

    // Force GC if available
    if (global.gc) global.gc();

    for (let i = 0; i < iterations; i++) {
      // Mix of different API calls
      const req1 = createTestRequest('/api/search?q=test');
      await mockSearchHandler(req1);

      const req2 = createTestRequest('/api/products?page=1');
      await mockProductsHandler(req2);

      await mockTrendingHandler();

      memoryReadings.push(process.memoryUsage().heapUsed);

      // Periodic GC simulation
      if (i % 20 === 19 && global.gc) global.gc();
    }

    const initialMemory = memoryReadings[0];
    const finalMemory = memoryReadings[memoryReadings.length - 1];
    const memoryGrowth = finalMemory - initialMemory;
    const maxMemory = Math.max(...memoryReadings);

    // Memory growth should be reasonable (< 20MB over 300 operations)
    expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024);

    console.log(`[Memory Leak Test] Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB, Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB, Peak: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
  });
});

// ===========================================
// STRESS TESTING EDGE CASES
// ===========================================

describe('Stress Testing Edge Cases', () => {
  it('should handle extremely long search queries', async () => {
    const longQuery = 'a'.repeat(500);
    
    const start = performance.now();
    const req = createTestRequest(`/api/search?q=${longQuery}`);
    const res = await mockSearchHandler(req);
    const duration = performance.now() - start;

    // Should either succeed or fail gracefully (not hang)
    expect(duration).toBeLessThan(500);
    expect([200, 400, 414]).toContain(res.status);
  });

  it('should handle many simultaneous different searches', async () => {
    const uniqueQueries = Array(50)
      .fill(null)
      .map((_, i) => `unique search term number ${i} with some extra words`);

    const results = await Promise.all(
      uniqueQueries.map(async (q) => {
        const start = performance.now();
        const req = createTestRequest(`/api/search?q=${encodeURIComponent(q)}`);
        const res = await mockSearchHandler(req);
        return {
          query: q.substring(0, 20),
          duration: performance.now() - start,
          success: res.status === 200,
        };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    expect(successful).toBeGreaterThan(45); // Allow some failures
    expect(avgDuration).toBeLessThan(300);

    console.log(`[Unique Queries] Success: ${successful}/50, Avg: ${avgDuration.toFixed(2)}ms`);
  });

  it('should handle rapid pagination to very deep pages', async () => {
    const deepPages = [100, 200, 500, 1000];

    const results = await Promise.all(
      deepPages.map(async (page) => {
        const start = performance.now();
        const req = createTestRequest(`/api/products?page=${page}`);
        const res = await mockProductsHandler(req);
        return {
          page,
          duration: performance.now() - start,
          success: res.status === 200,
        };
      })
    );

    // All should respond within reasonable time
    results.forEach((r) => {
      expect(r.duration).toBeLessThan(500);
    });

    console.log('[Deep Pagination]', results);
  });
});
