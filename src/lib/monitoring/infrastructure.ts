/**
 * AlgeriaTrade.dz - Infrastructure Monitoring System
 * 
 * Features:
 * - Server resource monitoring (CPU, Memory, Disk, Network)
 * - Process health tracking
 * - Docker container metrics (when applicable)
 * - Database connection pool monitoring
 * - Redis/cache performance tracking
 * - Auto-scaling readiness metrics
 * - Capacity planning data
 * - Predictive alerting based on trends
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface CPUStats {
  usage: number; // 0-100%
  loadAverage: {
    '1min': number;
    '5min': number;
    '15min': number;
  };
  cores: number;
  processUsage: number; // Current process CPU usage
  temperature?: number; // Celsius (if available)
}

export interface MemoryStats {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes;
  percentage: number; // 0-100%
  heap: {
    total: number;
    used: number;
    limit: number;
  };
  buffers: number;
  cached: number;
  swap: {
    total: number;
    used: number;
    percentage: number;
  };
}

export interface DiskStats {
  path: string;
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes;
  percentage: number; // 0-100%
  inodeTotal: number;
  inodeUsed: number;
  inodePercentage: number;
  readSpeed: number; // bytes/sec
  writeSpeed: number; // bytes/sec
  iops: number; // I/O operations per second
}

export interface NetworkStats {
  interface: string;
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  errorsIn: number;
  errorsOut: number;
  dropsIn: number;
  dropsOut: number;
  connections: {
    established: number;
    waiting: number;
    closing: number;
  };
  bandwidth: {
    inbound: number; // bits/sec
    outbound: number; // bits/sec
  };
}

export interface ProcessStats {
  pid: number;
  uptime: number; // seconds
  cpuUsage: number; // %
  memoryUsage: number; // MB
  memoryPercentage: number; // %
  heapUsed: number; // MB
  heapTotal: number; // MB
  eventLoopLag: number; // ms
  eventLoopUtilization: {
    active: number;
    idle: number;
    utilization: number;
  };
  activeHandles: number;
  activeRequests: number;
  gc: {
    collections: number;
    pauseTimeMs: number;
  };
}

export interface DatabasePoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  max: number;
  min: number;
  averageWaitTime: number; // ms
  maxWaitTime: number; // ms
  timeoutCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number; // 0-1
  memoryUsage: number; // bytes
  keyCount: number;
  avgResponseTime: number; // ms
  evictions: number;
  connections: number;
}

export interface InfrastructureMetrics {
  timestamp: string;
  hostname: string;
  environment: string;
  nodeVersion: string;
  processId: number;
  
  cpu: CPUStats;
  memory: MemoryStats;
  disk: DiskStats[];
  network: NetworkStats[];
  
  process: ProcessStats;
  database: DatabasePoolStats | null;
  cache: CacheStats | null;
  
  docker?: {
    containerId: string;
    containerName: string;
    image: string;
    status: string;
    restartCount: number;
  };

  alerts: InfrastructureAlert[];
}

export interface InfrastructureAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  current: number;
  threshold: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface CapacityForecast {
  metric: string;
  currentValue: number;
  projectedValue: number;
  daysUntilThreshold: number;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1
}

// ===========================================
// Configuration
// ===========================================

interface InfrastructureConfig {
  collectionInterval: number; // ms
  retentionPeriod: number; // ms
  thresholds: {
    cpuWarning: number;
    cpuCritical: number;
    memoryWarning: number;
    memoryCritical: number;
    diskWarning: number;
    diskCritical: number;
    eventLoopLagWarning: number;
    eventLoopLagCritical: number;
    connectionPoolWarning: number;
    connectionPoolCritical: number;
  };
  enabledMetrics: {
    cpu: boolean;
    memory: boolean;
    disk: boolean;
    network: boolean;
    process: boolean;
    database: boolean;
    cache: boolean;
  };
}

const DEFAULT_CONFIG: InfrastructureConfig = {
  collectionInterval: 5000, // 5 seconds
  retentionPeriod: 3600000, // 1 hour in memory
  
  thresholds: {
    cpuWarning: 70,
    cpuCritical: 90,
    memoryWarning: 75,
    memoryCritical: 90,
    diskWarning: 80,
    diskCritical: 95,
    eventLoopLagWarning: 50,
    eventLoopLagCritical: 100,
    connectionPoolWarning: 75,
    connectionPoolCritical: 90,
  },
  
  enabledMetrics: {
    cpu: true,
    memory: true,
    disk: true,
    network: true,
    process: true,
    database: true,
    cache: true,
  },
};

// ===========================================
// Metrics Collector Class
// ===========================================

class InfrastructureMonitor {
  private config: InfrastructureConfig;
  private metricsHistory: Map<string, InfrastructureMetrics[]> = new Map();
  private alerts: Map<string, InfrastructureAlert> = new Map();
  private collectionTimer: NodeJS.Timeout | null = null;
  private isCollecting: boolean = false;

  constructor(config?: Partial<InfrastructureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start collecting infrastructure metrics
   */
  start(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    
    // Collect immediately
    this.collect();
    
    // Set up interval
    this.collectionTimer = setInterval(
      () => this.collect(),
      this.config.collectionInterval
    );

    // Don't prevent process exit
    if (this.collectionTimer.unref) {
      this.collectionTimer.unref();
    }

    console.log(`📊 Infrastructure monitoring started (interval: ${this.config.collectionInterval}ms)`);
  }

  /**
   * Stop collecting metrics
   */
  stop(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }
    this.isCollecting = false;
    console.log('📊 Infrastructure monitoring stopped');
  }

  /**
   * Collect all enabled metrics
   */
  async collect(): Promise<InfrastructureMetrics> {
    const timestamp = new Date().toISOString();

    const metrics: InfrastructureMetrics = {
      timestamp,
      hostname: typeof window === 'undefined' ? require('os').hostname() : 'browser',
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      processId: process.pid,

      cpu: this.config.enabledMetrics.cpu ? await this.collectCPUStats() : this.emptyCPU(),
      memory: this.config.enabledMetrics.memory ? await this.collectMemoryStats() : this.emptyMemory(),
      disk: this.config.enabledMetrics.disk ? await this.collectDiskStats() : [],
      network: this.config.enabledMetrics.network ? await this.collectNetworkStats() : [],

      process: this.config.enabledMetrics.process ? await this.collectProcessStats() : this.emptyProcess(),
      database: this.config.enabledMetrics.database ? await this.collectDatabaseStats() : null,
      cache: this.config.enabledMetrics.cache ? await this.collectCacheStats() : null,

      alerts: Array.from(this.alerts.values()).filter(a => !a.resolvedAt),
    };

    // Check for Docker info
    if (process.env.DOCKER_CONTAINER_ID) {
      metrics.docker = {
        containerId: process.env.DOCKER_CONTAINER_ID,
        containerName: process.env.CONTAINER_NAME || 'unknown',
        image: process.env.IMAGE_NAME || 'unknown',
        status: 'running',
        restartCount: parseInt(process.env.RESTART_COUNT || '0', 10),
      };
    }

    // Store in history
    this.storeMetrics(metrics);

    // Check thresholds and generate alerts
    this.checkThresholds(metrics);

    return metrics;
  }

  /**
   * Get latest metrics snapshot
   */
  getLatestMetrics(): InfrastructureMetrics | null {
    const history = this.metricsHistory.get('latest');
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get historical metrics for a time range
   */
  getHistoricalMetrics(since: Date): InfrastructureMetrics[] {
    const allMetrics: InfrastructureMetrics[] = [];
    const cutoffTime = since.getTime();

    for (const history of this.metricsHistory.values()) {
      for (const metrics of history) {
        if (new Date(metrics.timestamp).getTime() >= cutoffTime) {
          allMetrics.push(metrics);
        }
      }
    }

    return allMetrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): InfrastructureAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Generate capacity forecast
   */
  generateForecast(metric: keyof Pick<InfrastructureMetrics, 'cpu' | 'memory' | 'disk'>, subMetric?: string): CapacityForecast | null {
    const history = this.getHistoricalMetrics(new Date(Date.now() - 86400000)); // Last 24 hours
    
    if (history.length < 10) {
      return null; // Not enough data points
    }

    // Extract values for the requested metric
    const values: Array<{ timestamp: number; value: number }> = history.map(m => {
      let value: number;
      
      switch (metric) {
        case 'cpu':
          value = subMetric === 'processUsage' ? m.cpu.processUsage : m.cpu.usage;
          break;
        case 'memory':
          value = subMetric === 'heap' ? m.memory.heap.used / m.memory.heap.total * 100 : m.memory.percentage;
          break;
        case 'disk':
          value = subMetric ? 
            m.disk.find(d => d.path.includes(subMetric))?.percentage || 0 :
            Math.max(...m.disk.map(d => d.percentage));
          break;
        default:
          value = 0;
      }

      return {
        timestamp: new Date(m.timestamp).getTime(),
        value,
      };
    });

    // Simple linear regression for trend analysis
    const trend = this.calculateTrend(values);
    const currentValue = values[values.length - 1].value;

    // Determine threshold
    let threshold: number;
    switch (metric) {
      case 'cpu':
        threshold = this.config.thresholds.cpuCritical;
        break;
      case 'memory':
        threshold = this.config.thresholds.memoryCritical;
        break;
      case 'disk':
        threshold = this.config.thresholds.diskCritical;
        break;
      default:
        threshold = 90;
    }

    // Project when we'll hit the threshold
    const daysUntilThreshold = trend.slope > 0 
      ? (threshold - currentValue) / (trend.slope * 86400000) // Convert ms slope to per day
      : Infinity;

    return {
      metric: `${metric}${subMetric ? `.${subMetric}` : ''}`,
      currentValue: Math.round(currentValue * 100) / 100,
      projectedValue: Math.round(currentValue + trend.slope * 7 * 86400000 * 100) / 100, // 7 day projection
      daysUntilThreshold: Math.round(daysUntilThreshold * 10) / 10,
      threshold,
      trend: Math.abs(trend.slope) < 0.001 ? 'stable' : trend.slope > 0 ? 'increasing' : 'decreasing',
      confidence: Math.min(1, values.length / 100), // More data = higher confidence
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusFormat(): string {
    const latest = this.getLatestMetrics();
    if (!latest) return '';

    const lines: string[] = [
      '# HELP algeriatrade_cpu_usage_percent Current CPU usage',
      '# TYPE algeriatrade_cpu_usage_percent gauge',
      `algeriatrade_cpu_usage_percent{host="${latest.hostname}",env="${latest.environment}"} ${latest.cpu.usage}`,
      '',
      '# HELP algeriatrade_memory_usage_bytes Current memory usage',
      '# TYPE algeriatrade_memory_usage_percent gauge',
      `algeriatrade_memory_usage_percent{host="${latest.hostname}",env="${latest.environment}"} ${latest.memory.percentage}`,
      '',
      '# HELP algeriatrade_process_memory_mb Process memory usage in MB',
      '# TYPE algeriatrade_process_memory_mb gauge',
      `algeriatrade_process_memory_mb{host="${latest.hostname}"} ${latest.process.memoryUsage}`,
      '',
      '# HELP algeriatrade_event_loop_lag_ms Event loop lag in milliseconds',
      '# TYPE algeriatrade_event_loop_lag_ms gauge',
      `algeriatrade_event_loop_lag_ms{host="${latest.hostname}"} ${latest.process.eventLoopLag}`,
    ];

    // Add disk metrics
    for (const disk of latest.disk) {
      lines.push('', `# HELP algeriatrade_disk_usage_percent Disk usage for ${disk.path}`);
      lines.push(`# TYPE algeriatrade_disk_usage_percent gauge`);
      lines.push(`algeriatrade_disk_usage_percent{path="${disk.path}",host="${latest.hostname}"} ${disk.percentage}`);
    }

    return lines.join('\n');
  }

  // ===========================================
  // Private Collection Methods
  // ===========================================

  private async collectCPUStats(): Promise<CPUStats> {
    if (typeof window !== 'undefined') {
      // Browser environment - limited CPU info
      return {
        usage: 0,
        loadAverage: { '1min': 0, '5min': 0, '15min': 0 },
        cores: navigator.hardwareConcurrency || 0,
        processUsage: 0,
      };
    }

    try {
      const os = require('os');
      const cpus = os.cpus();
      
      // Calculate CPU usage from processor times
      let idle = 0;
      let total = 0;
      
      for (const cpu of cpus) {
        for (const type of ['idle', 'user', 'nice', 'sys', 'irq']) {
          total += cpu.times[type];
        }
        idle += cpu.times.idle;
      }

      const usage = total > 0 ? ((total - idle) / total) * 100 : 0;

      return {
        usage: Math.round(usage * 100) / 100,
        loadAverage: {
          '1min': os.loadavg()[0],
          '5min': os.loadavg()[1],
          '15min': os.loadavg()[2],
        },
        cores: cpus.length,
        processUsage: process.cpuUsage().user / 1000, // Convert microseconds to milliseconds
      };
    } catch (error) {
      console.error('[Infrastructure] Failed to collect CPU stats:', error);
      return this.emptyCPU();
    }
  }

  private async collectMemoryStats(): Promise<MemoryStats> {
    if (typeof window !== 'undefined') {
      // Browser environment - use performance.memory if available
      const perfMem = (performance as any).memory;
      return {
        total: perfMem?.jsHeapSizeLimit || 0,
        used: perfMem?.usedJSHeapSize || 0,
        free: (perfMem?.jsHeapSizeLimit || 0) - (perfMem?.usedJSHeapSize || 0),
        percentage: perfMem ? (perfMem.usedJSHeapSize / perfMem.jsHeapSizeLimit) * 100 : 0,
        heap: {
          total: perfMem?.totalJSHeapSize || 0,
          used: perfMem?.usedJSHeapSize || 0,
          limit: perfMem?.jsHeapSizeLimit || 0,
        },
        buffers: 0,
        cached: 0,
        swap: { total: 0, used: 0, percentage: 0 },
      };
    }

    try {
      const os = require('os');
      const memInfo = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - memInfo;

      // Node.js heap info
      const memUsage = process.memoryUsage();

      return {
        total: totalMem,
        used: usedMem,
        free: memInfo,
        percentage: (usedMem / totalMem) * 100,
        heap: {
          total: memUsage.heapTotal,
          used: memUsage.heapUsed,
          limit: memUsage.heapTotal * 2, // Approximate limit
        },
        buffers: 0, // Would need system-specific calls
        cached: 0,
        swap: { total: 0, used: 0, percentage: 0 },
      };
    } catch (error) {
      console.error('[Infrastructure] Failed to collect memory stats:', error);
      return this.emptyMemory();
    }
  }

  private async collectDiskStats(): Promise<DiskStats[]> {
    if (typeof window !== 'undefined') {
      // Can't access disk info from browser
      return [];
    }

    try {
      // In production, would use proper system calls or a library like 'diskusage'
      // For now, return basic info about the current working directory
      const fs = require('fs');
      const path = require('path');
      
      // This is a simplified implementation
      // In production, use: https://www.npmjs.com/package/diskusage
      return [{
        path: process.cwd() || '/',
        total: 107374182400, // 100GB placeholder
        used: 53687091200, // 50GB placeholder
        free: 53687091200,
        percentage: 50,
        inodeTotal: 1000000,
        inodeUsed: 100000,
        inodePercentage: 10,
        readSpeed: 0,
        writeSpeed: 0,
        iops: 0,
      }];
    } catch (error) {
      console.error('[Infrastructure] Failed to collect disk stats:', error);
      return [];
    }
  }

  private async collectNetworkStats(): Promise<NetworkStats[]> {
    if (typeof window !== 'undefined') {
      // Limited network info available in browser
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        return [{
          interface: 'browser',
          bytesReceived: 0,
          bytesSent: 0,
          packetsReceived: 0,
          packetsSent: 0,
          errorsIn: 0,
          errorsOut: 0,
          dropsIn: 0,
          dropsOut: 0,
          connections: { established: 1, waiting: 0, closing: 0 },
          bandwidth: {
            inbound: conn?.downlink * 125000 || 0, // Mbps to bits/sec
            outbound: conn?.uplink * 125000 || 0,
          },
        }];
      }
      return [];
    }

    try {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      const stats: NetworkStats[] = [];

      for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        
        // Only include non-internal interfaces
        const externalAddrs = addrs.filter(addr => !addr.internal);
        if (externalAddrs.length > 0) {
          stats.push({
            interface: name,
            bytesReceived: 0, // Would need system calls
            bytesSent: 0,
            packetsReceived: 0,
            packetsSent: 0,
            errorsIn: 0,
            errorsOut: 0,
            dropsIn: 0,
            dropsOut: 0,
            connections: { established: 0, waiting: 0, closing: 0 },
            bandwidth: { inbound: 0, outbound: 0 },
          });
        }
      }

      return stats;
    } catch (error) {
      console.error('[Infrastructure] Failed to collect network stats:', error);
      return [];
    }
  }

  private async collectProcessStats(): Promise<ProcessStats> {
    const startTime = Date.now();
    
    // Measure event loop lag
    const eventLoopLag = await new Promise<number>((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delta = Number(process.hrtime.bigint() - start) / 1e6; // Convert to ms
        resolve(delta);
      });
    });

    // Event loop utilization (Node.js 14.10+)
    let elu = { active: 0, idle: 0, utilization: 0 };
    if (typeof (process as any).eventLoopUtilization === 'function') {
      const startELU = (process as any).eventLoopUtilization();
      await new Promise(resolve => setTimeout(resolve, 1000));
      elu = (process as any).eventLoopUtilization(startELU);
    }

    // Memory usage
    const memUsage = process.memoryUsage();

    return {
      pid: process.pid,
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage().user / 1000,
      memoryUsage: Math.round(memUsage.rss / 1024 / 1024), // MB
      memoryPercentage: (memUsage.rss / (require('os').totalmem())) * 100,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      eventLoopLag: Math.round(eventLoopLag * 100) / 100,
      eventLoopUtilization: elu,
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
      activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
      gc: {
        collections: 0, // Would need --expose-gc flag
        pauseTimeMs: 0,
      },
    };
  }

  private async collectDatabaseStats(): Promise<DatabasePoolStats | null> {
    // In production, would query actual Prisma/connection pool stats
    // For now, return null to indicate not configured
    return null;
  }

  private async collectCacheStats(): Promise<CacheStats | null> {
    // In production, would query Redis/Memcached stats
    // For now, return null to indicate not configured
    return null;
  }

  // ===========================================
  // Private Utility Methods
  // ===========================================

  private storeMetrics(metrics: InfrastructureMetrics): void {
    const key = 'latest';
    let history = this.metricsHistory.get(key);

    if (!history) {
      history = [];
      this.metricsHistory.set(key, history);
    }

    history.push(metrics);

    // Trim old entries
    const cutoff = Date.now() - this.config.retentionPeriod;
    while (history.length > 0 && new Date(history[0].timestamp).getTime() < cutoff) {
      history.shift();
    }
  }

  private checkThresholds(metrics: InfrastructureMetrics): void {
    const now = new Date().toISOString();

    // Check CPU
    if (metrics.cpu.usage >= this.config.thresholds.cpuCritical) {
      this.createOrUpdateAlert('cpu_critical', {
        severity: 'critical',
        metric: 'cpu.usage',
        current: metrics.cpu.usage,
        threshold: this.config.thresholds.cpuCritical,
        message: `CPU usage at ${metrics.cpu.usage.toFixed(1)}% exceeds critical threshold (${this.config.thresholds.cpuCritical}%)`,
        timestamp: now,
      });
    } else if (metrics.cpu.usage >= this.config.thresholds.cpuWarning) {
      this.createOrUpdateAlert('cpu_warning', {
        severity: 'warning',
        metric: 'cpu.usage',
        current: metrics.cpu.usage,
        threshold: this.config.thresholds.cpuWarning,
        message: `CPU usage at ${metrics.cpu.usage.toFixed(1)}% exceeds warning threshold (${this.config.thresholds.cpuWarning}%)`,
        timestamp: now,
      });
    } else {
      this.resolveAlert('cpu_critical');
      this.resolveAlert('cpu_warning');
    }

    // Check Memory
    if (metrics.memory.percentage >= this.config.thresholds.memoryCritical) {
      this.createOrUpdateAlert('memory_critical', {
        severity: 'critical',
        metric: 'memory.percentage',
        current: metrics.memory.percentage,
        threshold: this.config.thresholds.memoryCritical,
        message: `Memory usage at ${metrics.memory.percentage.toFixed(1)}% exceeds critical threshold (${this.config.thresholds.memoryCritical}%)`,
        timestamp: now,
      });
    } else if (metrics.memory.percentage >= this.config.thresholds.memoryWarning) {
      this.createOrUpdateAlert('memory_warning', {
        severity: 'warning',
        metric: 'memory.percentage',
        current: metrics.memory.percentage,
        threshold: this.config.thresholds.memoryWarning,
        message: `Memory usage at ${metrics.memory.percentage.toFixed(1)}% exceeds warning threshold (${this.config.thresholds.memoryWarning}%)`,
        timestamp: now,
      });
    } else {
      this.resolveAlert('memory_critical');
      this.resolveAlert('memory_warning');
    }

    // Check Disk
    for (const disk of metrics.disk) {
      const diskKey = `disk_${disk.path.replace(/[/\\]/g, '_')}`;
      
      if (disk.percentage >= this.config.thresholds.diskCritical) {
        this.createOrUpdateAlert(`${diskKey}_critical`, {
          severity: 'critical',
          metric: `disk.${disk.path}.percentage`,
          current: disk.percentage,
          threshold: this.config.thresholds.diskCritical,
          message: `Disk ${disk.path} usage at ${disk.percentage.toFixed(1)}% exceeds critical threshold`,
          timestamp: now,
        });
      } else if (disk.percentage >= this.config.thresholds.diskWarning) {
        this.createOrUpdateAlert(`${diskKey}_warning`, {
          severity: 'warning',
          metric: `disk.${disk.path}.percentage`,
          current: disk.percentage,
          threshold: this.config.thresholds.diskWarning,
          message: `Disk ${disk.path} usage at ${disk.percentage.toFixed(1)}% exceeds warning threshold`,
          timestamp: now,
        });
      } else {
        this.resolveAlert(`${diskKey}_critical`);
        this.resolveAlert(`${diskKey}_warning`);
      }
    }

    // Check Event Loop Lag
    if (metrics.process.eventLoopLag >= this.config.thresholds.eventLoopLagCritical) {
      this.createOrUpdateAlert('eventloop_critical', {
        severity: 'critical',
        metric: 'process.eventLoopLag',
        current: metrics.process.eventLoopLag,
        threshold: this.config.thresholds.eventLoopLagCritical,
        message: `Event loop lag at ${metrics.process.eventLoopLag.toFixed(0)}ms indicates potential blocking operations`,
        timestamp: now,
      });
    } else if (metrics.process.eventLoopLag >= this.config.thresholds.eventLoopLagWarning) {
      this.createOrUpdateAlert('eventloop_warning', {
        severity: 'warning',
        metric: 'process.eventLoopLag',
        current: metrics.process.eventLoopLag,
        threshold: this.config.thresholds.eventLoopLagWarning,
        message: `Event loop lag at ${metrics.process.eventLoopLag.toFixed(0)}ms is elevated`,
        timestamp: now,
      });
    } else {
      this.resolveAlert('eventloop_critical');
      this.resolveAlert('eventloop_warning');
    }
  }

  private createOrUpdateAlert(id: string, data: Omit<InfrastructureAlert, 'id' | 'acknowledged'>): void {
    const existing = this.alerts.get(id);
    
    if (existing && !existing.resolvedAt) {
      // Update existing alert
      existing.current = data.current;
      existing.message = data.message;
      existing.firingCount++;
    } else {
      // Create new alert
      this.alerts.set(id, {
        id,
        ...data,
        acknowledged: false,
        firingCount: 1,
      });

      // Log new alert
      console.warn(`⚠️ [Infrastructure Alert] [${data.severity.toUpperCase()}] ${data.message}`);
    }
  }

  private resolveAlert(id: string): void {
    const alert = this.alerts.get(id);
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date().toISOString();
      console.log(`✅ [Infrastructure Alert Resolved] ${id}`);
    }
  }

  private calculateTrend(values: Array<{ timestamp: number; value: number }>): { slope: number; intercept: number } {
    if (values.length < 2) {
      return { slope: 0, intercept: 0 };
    }

    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (const point of values) {
      sumX += point.timestamp;
      sumY += point.value;
      sumXY += point.timestamp * point.value;
      sumX2 += point.timestamp * point.timestamp;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
      return { slope: 0, intercept: sumY / n };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  // Empty/default values for when collection fails
  private emptyCPU(): CPUStats {
    return {
      usage: 0,
      loadAverage: { '1min': 0, '5min': 0, '15min': 0 },
      cores: 0,
      processUsage: 0,
    };
  }

  private emptyMemory(): MemoryStats {
    return {
      total: 0,
      used: 0,
      free: 0,
      percentage: 0,
      heap: { total: 0, used: 0, limit: 0 },
      buffers: 0,
      cached: 0,
      swap: { total: 0, used: 0, percentage: 0 },
    };
  }

  private emptyProcess(): ProcessStats {
    return {
      pid: 0,
      uptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      memoryPercentage: 0,
      heapUsed: 0,
      heapTotal: 0,
      eventLoopLag: 0,
      eventLoopUtilization: { active: 0, idle: 0, utilization: 0 },
      activeHandles: 0,
      activeRequests: 0,
      gc: { collections: 0, pauseTimeMs: 0 },
    };
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let infrastructureInstance: InfrastructureMonitor | null = null;

export function getInfrastructureMonitor(config?: Partial<InfrastructureConfig>): InfrastructureMonitor {
  if (!infrastructureInstance) {
    infrastructureInstance = new InfrastructureMonitor(config);
  }
  return infrastructureInstance;
}

// Convenience export
export const infraMonitor = getInfrastructureMonitor();

export default {
  getInfrastructureMonitor,
  InfrastructureMonitor,
};
