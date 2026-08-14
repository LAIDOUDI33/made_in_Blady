// Monitoring & Error Tracking - AlgeriaTrade.dz
// Surveillance et suivi des erreurs

/**
 * Custom Logger with levels and structured output
 */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  requestId?: string;
}

class AppLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (process.env.NODE_ENV !== 'production') {
      const prefix = this.getPrefix(level);
      const logFn = this.getConsoleMethod(level);
      if (data) {
        logFn(`${prefix}${message}`, data);
      } else {
        logFn(`${prefix}${message}`);
      }
    }
  }

  debug(message: string, data?: any) { this.log(LogLevel.DEBUG, message, data); }
  info(message: string, data?: any) { this.log(LogLevel.INFO, message, data); }
  warn(message: string, data?: any) { this.log(LogLevel.WARN, message, data); }
  error(message: string, data?: any) { this.log(LogLevel.ERROR, message, data); }
  fatal(message: string, data?: any) { this.log(LogLevel.FATAL, message, data); }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  private getPrefix(level: LogLevel): string {
    const prefixes = {
      [LogLevel.DEBUG]: '🔍 [DEBUG] ',
      [LogLevel.INFO]: 'ℹ️  [INFO] ',
      [LogLevel.WARN]: '⚠️  [WARN] ',
      [LogLevel.ERROR]: '❌ [ERROR]',
      [LogLevel.FATAL]: '💀 [FATAL]',
    };
    return prefixes[level];
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG: return console.debug;
      case LogLevel.INFO: return console.info;
      case LogLevel.WARN: return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL: return console.error;
      default: return console.log;
    }
  }
}

export const logger = new AppLogger();

/**
 * Performance Monitoring
 */
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, { duration: number }> = new Map();

  startMark(name: string): void {
    this.marks.set(name, performance.now());
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMark(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) return null;

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.measures.set(name, { duration });
    this.marks.delete(name);

    if (duration > 100) {
      logger.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMark(name);
    try {
      return await fn();
    } finally {
      this.endMark(name);
    }
  }

  getMeasurements(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, { duration }] of this.measures.entries()) {
      result[name] = duration;
    }
    return result;
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Health Check Service
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }

  async runChecks(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const results: Record<string, boolean> = {};
    let healthyCount = 0;

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const result = await checkFn();
        results[name] = result;
        if (result) healthyCount++;
      } catch {
        results[name] = false;
      }
    }

    const totalChecks = this.checks.size;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyCount === totalChecks) status = 'healthy';
    else if (healthyCount > totalChecks / 2) status = 'degraded';
    else status = 'unhealthy';

    return { status, checks: results, timestamp: new Date().toISOString() };
  }

  registerDefaults(): void {
    this.registerCheck('api', async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
        return res.ok;
      } catch { return false; }
    });

    this.registerCheck('database', async () => {
      // Database health check would go here
      return true;
    });
  }
}

export const healthChecker = new HealthChecker();

/**
 * Initialize monitoring on app startup
 */
export function initializeMonitoring(): void {
  logger.info('Monitoring initialized');
  healthChecker.registerDefaults();

  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers();
    
    // Collect Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logger.debug(`Web Vital: ${entry.name} = ${entry.value}`);
          }
        });
        observer.observe({ type: ['paint', 'navigation'] });
      } catch (e) {
        // Performance Observer not fully supported
      }
    }
  }
}

function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', { reason: event.reason?.message || event.reason });
  });

  window.addEventListener('error', (event) => {
    logger.error('Global error', { message: event.message, filename: event.filename, lineno: event.lineno });
  });
}
