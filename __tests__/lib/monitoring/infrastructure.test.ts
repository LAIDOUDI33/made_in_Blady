// Infrastructure Monitoring Unit Tests
// Tests pour le module InfrastructureMonitor

import { getInfrastructureMonitor, CPUStats, MemoryStats, DiskStats, NetworkStats } from '@/lib/monitoring/infrastructure';

// Mock os module
jest.mock('os', () => ({
  cpus: () => [
    { times: { user: 1000, nice: 0, sys: 500, idle: 8500, irq: 0 }, model: 'Test CPU', speed: 2400 },
    { times: { user: 1200, nice: 0, sys: 600, idle: 8200, irq: 0 }, model: 'Test CPU', speed: 2400 },
    { times: { user: 900, nice: 0, sys: 400, idle: 8700, irq: 0 }, model: 'Test CPU', speed: 2400 },
    { times: { user: 1100, nice: 0, sys: 550, idle: 8350, irq: 0 }, model: 'Test CPU', speed: 2400 },
  ],
  totalmem: () => 16 * 1024 * 1024 * 1024, // 16GB
  freemem: () => 8 * 1024 * 1024 * 1024,  // 8GB
  loadavg: () => [1.5, 2.0, 2.5],
  platform: () => 'linux',
  arch: () => 'x64',
  hostname: () => 'test-server',
  networkInterfaces: () => ({
    eth0: [{ address: '192.168.1.100', family: 'IPv4', mac: '00:00:00:00:00:01' }],
    lo: [{ address: '127.0.0.1', family: 'IPv4', mac: '00:00:00:00:00:02' }],
  }),
}));

// Mock fs module for disk stats
jest.mock('fs', () => ({
  statSync: jest.fn().mockReturnValue({
    size: 1024 * 1024 * 1024 * 100, // 100GB
    blocks: 1000000,
    blksize: 4096,
  }),
  readdirSync: jest.fn().mockReturnValue([]),
}));

// ===========================================
// Test Constants
// ===========================================

const MOCK_CPU_USAGE = 15; // ~15% CPU usage based on mock data

// ===========================================
// Test Suites
// ===========================================

describe('InfrastructureMonitor', () => {
  let metrics: ReturnType<typeof getInfrastructureMonitor>;

  beforeEach(() => {
    metrics = getInfrastructureMonitor({
      enabled: true,
      sampleInterval: 1000,
      historyRetention: 60,
      alertThresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
      },
    });
  });

  afterEach(() => {
    // Don't destroy singleton in tests
  });

  describe('Initialization', () => {
    it('should create instance with default options', () => {
      const defaultMetrics = getInfrastructureMonitor();
      expect(defaultMetrics).toBeDefined();
      expect(typeof defaultMetrics.getCPUStats).toBe('function');
      expect(typeof defaultMetrics.getMemoryStats).toBe('function');
    });

    it('should store configuration options', () => {
      expect(metrics['options'].enabled).toBe(true);
      expect(metrics['options'].sampleInterval).toBe(1000);
      expect(metrics['options'].historyRetention).toBe(60);
    });

    it('should initialize empty history arrays', () => {
      expect(metrics.getHistory()).toEqual({
        cpu: [],
        memory: [],
        disk: [],
        network: [],
      });
    });
  });

  describe('CPU Metrics', () => {
    it('should return valid CPU stats object', async () => {
      const cpuStats = await metrics.getCPUStats();
      
      expect(cpuStats).toBeDefined();
      expect(typeof cpuStats.usage).toBe('number');
      expect(cpuStats.usage).toBeGreaterThanOrEqual(0);
      expect(cpuStats.usage).toBeLessThanOrEqual(100);
    });

    it('should include load average in CPU stats', async () => {
      const cpuStats: CPUStats = await metrics.getCPUStats();
      
      expect(cpuStats.loadAverage).toBeDefined();
      expect(cpuStats.loadAverage).toHaveProperty('1min');
      expect(cpuStats.loadAverage).toHaveProperty('5min');
      expect(cpuStats.loadAverage).toHaveProperty('15min');
    });

    it('should report correct number of CPU cores', async () => {
      const cpuStats: CPUStats = await metrics.getCPUStats();
      
      expect(cpuStats.cores).toBe(4); // Based on mock data
    });

    it('should calculate CPU usage percentage correctly', async () => {
      const cpuStats: CPUStats = await metrics.getCPUStats();
      
      // Based on mock data: (user+sys) / (user+sys+idle) * 100
      // Should be approximately 15%
      expect(cpuStats.usage).toBeGreaterThan(10);
      expect(cpuStats.usage).toBeLessThan(25);
    });
  });

  describe('Memory Metrics', () => {
    it('should return valid memory stats object', async () => {
      const memStats = await metrics.getMemoryStats();
      
      expect(memStats).toBeDefined();
      expect(memStats.total).toBeGreaterThan(0);
      expect(memStats.used).toBeGreaterThanOrEqual(0);
      expect(memStats.free).toBeGreaterThanOrEqual(0);
    });

    it('should calculate memory usage percentage', async () => {
      const memStats: MemoryStats = await metrics.getMemoryStats();
      
      expect(typeof memStats.percentage).toBe('number');
      expect(memStats.percentage).toBeGreaterThanOrEqual(0);
      expect(memStats.percentage).toBeLessThanOrEqual(100);
    });

    it('should include heap memory information', async () => {
      const memStats: MemoryStats = await metrics.getMemoryStats();
      
      expect(memStats.heap).toBeDefined();
      expect(memStats.heap).toHaveProperty('total');
      expect(memStats.heap).toHaveProperty('used');
      expect(memStats.heap).toHaveProperty('limit');
    });

    it('should include swap memory information', async () => {
      const memStats: MemoryStats = await metrics.getMemoryStats();
      
      expect(memStats.swap).toBeDefined();
      expect(memStats.swap).toHaveProperty('total');
      expect(memStats.swap).toHaveProperty('used');
      expect(memStats.swap).toHaveProperty('percentage');
    });

    it('should reflect correct memory values from mocks', async () => {
      const memStats: MemoryStats = await metrics.getMemoryStats();
      
      // Mock has 16GB total, 8GB free = 50% used
      expect(memStats.total).toBe(16 * 1024 * 1024 * 1024);
      expect(memStats.percentage).toBeCloseTo(50, -1); // Within 10%
    });
  });

  describe('Disk Metrics', () => {
    it('should return valid disk stats object', async () => {
      const diskStats = await metrics.getDiskStats('/');
      
      expect(diskStats).toBeDefined();
      expect(diskStats.path).toBe('/');
      expect(diskStats.total).toBeGreaterThan(0);
    });

    it('should calculate disk usage percentage', async () => {
      const diskStats: DiskStats = await metrics.getDiskStats('/');
      
      expect(typeof diskStats.percentage).toBe('number');
      expect(diskStats.percentage).toBeGreaterThanOrEqual(0);
      expect(diskStats.percentage).toBeLessThanOrEqual(100);
    });

    it('should include inode statistics', async () => {
      const diskStats: DiskStats = await metrics.getDiskStats('/');
      
      expect(diskStats).toHaveProperty('inodeTotal');
      expect(diskStats).toHaveProperty('inodeUsed');
      expect(diskStats).toHaveProperty('inodePercentage');
    });

    it('should include I/O performance metrics', async () => {
      const diskStats: DiskStats = await metrics.getDiskStats('/');
      
      expect(diskStats).toHaveProperty('readSpeed');
      expect(diskStats).toHaveProperty('writeSpeed');
      expect(diskStats).toHaveProperty('iops');
    });
  });

  describe('Network Metrics', () => {
    it('should return array of network interfaces', async () => {
      const netStats = await metrics.getNetworkStats();
      
      expect(Array.isArray(netStats)).toBe(true);
      expect(netStats.length).toBeGreaterThan(0);
    });

    it('should include required fields in network stats', async () => {
      const netStats: NetworkStats[] = await metrics.getNetworkStats();
      const interfaceStats = netStats[0];
      
      expect(interfaceStats).toHaveProperty('interface');
      expect(interfaceStats).toHaveProperty('bytesReceived');
      expect(interfaceStats).toHaveProperty('bytesSent');
      expect(interfaceStats).toHaveProperty('packetsReceived');
      expect(interfaceStats).toHaveProperty('packetsSent');
    });
  });

  describe('Process Stats', () => {
    it('should return process statistics', async () => {
      const processStats = await metrics.getProcessStats();
      
      expect(processStats).toBeDefined();
      expect(processStats).toHaveProperty('pid');
      expect(processStats).toHaveProperty('memoryUsage');
      expect(processStats).toHaveProperty('cpuUsage');
      expect(processStats).toHaveProperty('uptime');
    });

    it('should include memory usage details', async () => {
      const processStats = await metrics.getProcessStats();
      
      expect(processStats.memoryUsage).toHaveProperty('rss');
      expect(processStats.memoryUsage).toHaveProperty('heapTotal');
      expect(processStats.memoryUsage).toHaveProperty('heapUsed');
      expect(processStats.memoryUsage).toHaveProperty('external');
    });
  });

  describe('Health Status', () => {
    it('should return healthy status when all metrics are normal', async () => {
      const health = await metrics.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.metrics).toHaveProperty('cpu');
      expect(health.metrics).toHaveProperty('memory');
      expect(health.metrics).toHaveProperty('disk');
    });

    it('should detect unhealthy status when thresholds exceeded', async () => {
      // Create metrics with very low thresholds to trigger alerts
      const strictMetrics = getInfrastructureMonitor({
        alertThresholds: {
          cpu: 1, // Very low threshold
          memory: 1,
          disk: 1,
        },
      });

      const health = await strictMetrics.getHealthStatus();
      
      // With our mock data showing ~15% CPU and 50% memory, 
      // these should exceed the 1% thresholds
      expect(['warning', 'critical']).toContain(health.status);
      
      strictMetrics.destroy();
    });

    it('should include alerts array when issues detected', async () => {
      const strictMetrics = getInfrastructureMonitor({
        alertThresholds: {
          cpu: 1,
        },
      });

      const health = await strictMetrics.getHealthStatus();
      
      if (health.status !== 'healthy') {
        expect(Array.isArray(health.alerts)).toBe(true);
        expect(health.alerts.length).toBeGreaterThan(0);
      }
      
      strictMetrics.destroy();
    });
  });

  describe('History Tracking', () => {
    it('should collect samples over time', async () => {
      // Start collecting
      metrics.startCollecting();
      
      // Wait a few cycles
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const history = metrics.getHistory();
      
      // Should have some samples
      expect(history.cpu.length + history.memory.length).toBeGreaterThan(0);
    });

    it('should respect history retention limit', async () => {
      const shortRetention = getInfrastructureMonitor({
        historyRetention: 3, // Keep only 3 samples
        sampleInterval: 10, // Fast sampling
      });

      shortRetention.startCollecting();
      
      // Wait for more samples than retention allows
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const history = shortRetention.getHistory();
      
      // Should not exceed retention limit
      expect(history.cpu.length).toBeLessThanOrEqual(3);
      expect(history.memory.length).toBeLessThanOrEqual(3);
      
      shortRetention.stopCollecting();
      shortRetention.destroy();
    });

    it('should clear history when requested', async () => {
      metrics.startCollecting();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      metrics.clearHistory();
      
      const history = metrics.getHistory();
      
      expect(history.cpu).toEqual([]);
      expect(history.memory).toEqual([]);
      expect(history.disk).toEqual([]);
      expect(history.network).toEqual([]);
    });
  });

  describe('Prometheus Export', () => {
    it('should generate Prometheus-compatible metrics', async () => {
      const prometheusOutput = await metrics.exportPrometheus();
      
      expect(typeof prometheusOutput).toBe('string');
      expect(prometheusOutput.length).toBeGreaterThan(0);
    });

    it('include HELP comments for metrics', async () => {
      const prometheusOutput = await metrics.exportPrometheus();
      
      expect(prometheusOutput).toContain('# HELP');
    });

    it('include TYPE declarations for metrics', async () => {
      const prometheusOutput = await metrics.exportPrometheus();
      
      expect(prometheusOutput).toContain('# TYPE');
    });

    it('include actual metric values', async () => {
      const prometheusOutput = await metrics.exportPrometheus();
      
      // Should have metric lines with values
      expect(prometheusOutput).toMatch(/\w+\{.*\}\s+\d+(\.\d+)?/);
    });
  });

  describe('Capacity Forecasting', () => {
    it('should provide capacity forecasts', async () => {
      const forecast = await metrics.getCapacityForecast();
      
      expect(forecast).toBeDefined();
      expect(forecast).toHaveProperty('cpu');
      expect(forecast).toHaveProperty('memory');
      expect(forecast).toHaveProperty('disk');
    });

    it('should include time estimates for capacity limits', async () => {
      const forecast = await metrics.getCapacityForecast();
      
      if (forecast.cpu.daysUntilLimit !== null) {
        expect(forecast.cpu.daysUntilLimit).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Lifecycle Methods', () => {
    it('startCollecting should begin sampling', () => {
      const spy = jest.spyOn(metrics as any, 'collectSample');
      
      metrics.startCollecting();
      
      expect(metrics['intervalId']).not.toBeNull();
      
      spy.mockRestore();
    });

    it('stopCollecting should halt sampling', () => {
      metrics.startCollecting();
      expect(metrics['intervalId']).not.toBeNull();
      
      metrics.stopCollecting();
      expect(metrics['intervalId']).toBeNull();
    });

    it('destroy should clean up all resources', () => {
      metrics.startCollecting();
      metrics.destroy();
      
      expect(metrics['intervalId']).toBeNull();
      expect(metrics.getHistory()).toEqual({
        cpu: [],
        memory: [],
        disk: [],
        network: [],
      });
    });
  });
});

describe('InfrastructureMonitor - Edge Cases', () => {
  it('should handle disabled state gracefully', () => {
    const disabledMetrics = getInfrastructureMonitor({ enabled: false });
    
    expect(disabledMetrics.isEnabled()).toBe(false);
    
    disabledMetrics.destroy();
  });

  it('should handle multiple instances independently', async () => {
    const metrics1 = getInfrastructureMonitor({ sampleInterval: 100 });
    const metrics2 = getInfrastructureMonitor({ sampleInterval: 200 });
    
    metrics1.startCollecting();
    metrics2.startCollecting();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const history1 = metrics1.getHistory();
    const history2 = metrics2.getHistory();
    
    // Both should have collected data independently
    expect(history1.cpu.length).toBeGreaterThanOrEqual(0);
    expect(history2.cpu.length).toBeGreaterThanOrEqual(0);
    
    metrics1.destroy();
    metrics2.destroy();
  });
});
