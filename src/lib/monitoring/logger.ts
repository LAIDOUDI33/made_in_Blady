/**
 * AlgeriaTrade.dz - Structured Logging System
 * 
 * Features:
 * - JSON-structured logs for easy parsing
 * - Multiple log levels (debug, info, warn, error, fatal)
 * - Correlation IDs for request tracing
 * - Log aggregation readiness (ELK/CloudWatch compatible)
 * - Sensitive data masking
 * - Performance logging
 * - Multi-output support (console, file, remote)
 * - Tenant-aware logging
 */

// ===========================================
// Types & Interfaces
// ===========================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number; // ms
  source?: {
    file?: string;
    line?: number;
    function?: string;
    component?: string;
  };
  request?: {
    method?: string;
    url?: string;
    statusCode?: number;
    userAgent?: string;
    ip?: string;
  };
  [key: string]: any;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  includeSource: boolean;
  maskSensitiveData: boolean;
  maxMetadataSize: number; // bytes
  batchSize: number; // For batch sending
  flushInterval: number; // ms
  tenantAware: boolean;
}

export interface Logger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void;
  fatal(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void;
  
  child(context: string): ChildLogger;
  withContext(context: Record<string, any>): Logger;
  
  setCorrelationId(id: string): void;
  setRequestId(id: string): void;
  setUser(user: { id: string; email?: string }): void;
  setTenant(tenantId: string, tenantName?: string): void;
  
  measure<T>(name: string, fn: () => T): T;
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
  
  flush(): Promise<void>;
}

export interface ChildLogger extends Logger {
  parentContext: string;
}

// ===========================================
// Configuration
// ===========================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableRemote: !!process.env.LOG_REMOTE_ENDPOINT,
  remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT,
  includeSource: process.env.NODE_ENV !== 'production',
  maskSensitiveData: true,
  maxMetadataSize: 10240, // 10KB
  batchSize: 50,
  flushInterval: 5000, // 5 seconds
  tenantAware: true,
};

// Sensitive field patterns to mask
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
  /bank[_-]?account/i,
];

// ===========================================
// Correlation ID Management
// ===========================================

class CorrelationManager {
  private static instance: CorrelationManager;
  private currentId: string = '';
  private requestId: string = '';

  static getInstance(): CorrelationManager {
    if (!CorrelationManager.instance) {
      CorrelationManager.instance = new CorrelationManager();
    }
    return CorrelationManager.instance;
  }

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  getCorrelationId(): string {
    if (!this.currentId) {
      this.currentId = this.generateId();
    }
    return this.currentId;
  }

  setCorrelationId(id: string): void {
    this.currentId = id;
  }

  getRequestId(): string {
    if (!this.requestId) {
      this.requestId = this.generateId();
    }
    return this.requestId;
  }

  setRequestId(id: string): void {
    this.requestId = id;
  }

  reset(): void {
    this.currentId = '';
    this.requestId = '';
  }
}

// ===========================================
// Main Logger Implementation
// ===========================================

class StructuredLogger implements Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private context: string = '';
  private additionalContext: Record<string, any> = {};
  private user: { id: string; email?: string } | null = null;
  private tenant: { id: string; name?: string } | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private correlationManager: CorrelationManager;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.correlationManager = CorrelationManager.getInstance();
    
    // Start auto-flush if remote logging enabled
    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.startAutoFlush();
    }
  }

  // ===========================================
  // Core Logging Methods
  // ===========================================

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    let finalMetadata = metadata;
    let errorObj: Error | undefined;

    if (errorOrMetadata instanceof Error) {
      errorObj = errorOrMetadata;
      finalMetadata = {
        ...metadata,
        errorMessage: errorOrMetadata.message,
        errorStack: errorOrMetadata.stack,
      };
    } else if (typeof errorOrMetadata === 'object') {
      finalMetadata = { ...errorOrMetadata, ...metadata };
    }

    this.log('error', message, finalMetadata, errorObj);
  }

  fatal(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    let finalMetadata = metadata;
    let errorObj: Error | undefined;

    if (errorOrMetadata instanceof Error) {
      errorObj = errorOrMetadata;
      finalMetadata = {
        ...metadata,
        errorMessage: errorOrMetadata.message,
        errorStack: errorOrMetadata.stack,
      };
    } else if (typeof errorOrMetadata === 'object') {
      finalMetadata = { ...errorOrMetadata, ...metadata };
    }

    this.log('fatal', message, finalMetadata, errorObj);
    
    // Fatal errors should be flushed immediately
    this.flush();
  }

  // ===========================================
  // Context Methods
  // ===========================================

  child(context: string): ChildLogger {
    const childLogger = new ChildLoggerImpl(
      this.config,
      this.context ? `${this.context}:${context}` : context,
      this
    );
    return childLogger;
  }

  withContext(context: Record<string, any>): Logger {
    this.additionalContext = { ...this.additionalContext, ...context };
    return this;
  }

  setCorrelationId(id: string): void {
    this.correlationManager.setCorrelationId(id);
  }

  setRequestId(id: string): void {
    this.correlationManager.setRequestId(id);
  }

  setUser(user: { id: string; email?: string }): void {
    this.user = user;
  }

  setTenant(tenantId: string, tenantName?: string): void {
    this.tenant = { id: tenantId, name: tenantName };
  }

  // ===========================================
  // Performance Measurement
  // ===========================================

  measure<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.debug(`[Measure] ${name}`, { duration: Math.round(duration * 100) / 100 });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.error(`[Measure] ${name} failed`, error as Error, { duration: Math.round(duration * 100) / 100 });
      throw error;
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.debug(`[Measure] ${name}`, { duration: Math.round(duration * 100) / 100 });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.error(`[Measure] ${name} failed`, error as Error, { duration: Math.round(duration * 100) / 100 });
      throw error;
    }
  }

  // ===========================================
  // Flush & Cleanup
  // ===========================================

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entries,
            source: 'algeriatrade-dz',
            version: process.env.npm_package_version || '1.0.0',
            hostname: typeof window !== 'undefined' ? window.location.hostname : require('os').hostname(),
          }),
        });
      } catch (error) {
        // If remote logging fails, log to console as fallback
        console.error('[Logger] Failed to send logs to remote endpoint:', error);
        
        // Re-add entries to buffer for retry (with limit)
        this.buffer.push(...entries.slice(-this.config.batchSize));
      }
    }
  }

  private startAutoFlush(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Don't prevent process exit in Node.js
    if (typeof process !== 'undefined' && this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  // ===========================================
  // Private Methods
  // ===========================================

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    // Check if we should log at this level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) {
      return;
    }

    // Build log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context || undefined,
      correlationId: this.correlationManager.getCorrelationId(),
      requestId: this.correlationManager.getRequestId(),
      userId: this.user?.id,
      tenantId: this.tenant?.id,
      ...(this.tenant?.name && { tenantName: this.tenant.name }),
      ...(this.additionalContext),
    };

    // Add metadata (with size limit and masking)
    if (metadata) {
      entry.metadata = this.processMetadata(metadata);
    }

    // Add error details
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeSource ? error.stack : undefined,
        code: (error as any).code,
      };
    }

    // Add source location in development
    if (this.config.includeSource && typeof Error.captureStackTrace === 'function') {
      entry.source = this.getSourceLocation();
    }

    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // Buffer for remote sending
    if (this.config.enableRemote) {
      this.buffer.push(entry);
      
      // Auto-flush if batch size reached
      if (this.buffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = this.formatPrefix(entry);
    const args: any[] = [prefix, entry.message];

    if (entry.metadata) {
      args.push(entry.metadata);
    }
    if (entry.error) {
      args.push(entry.error);
    }

    switch (entry.level) {
      case 'debug':
        console.debug(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'error':
      case 'fatal':
        console.error(...args);
        break;
    }
  }

  private formatPrefix(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
    const parts = [
      timestamp,
      `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.context) {
      parts.push(`[${entry.context}]`);
    }
    if (entry.correlationId) {
      parts.push(`(${entry.correlationId.substring(0, 8)})`);
    }

    return parts.join(' ');
  }

  private processMetadata(metadata: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Mask sensitive fields
      if (this.shouldMaskField(key)) {
        processed[key] = '[MASKED]';
        continue;
      }

      // Handle large values
      const valueStr = JSON.stringify(value);
      if (valueStr.length > this.config.maxMetadataSize) {
        processed[key] = JSON.parse(valueStr.substring(0, this.config.maxMetadataSize)) + '... [TRUNCATED]';
        continue;
      }

      // Handle circular references
      try {
        processed[key] = JSON.parse(JSON.stringify(value));
      } catch {
        processed[key] = '[CIRCULAR]';
      }
    }

    return processed;
  }

  private shouldMaskField(fieldName: string): boolean {
    if (!this.config.maskSensitiveData) return false;
    
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
  }

  private getSourceLocation(): { file?: string; line?: number; function?: string } {
    // This is a simplified implementation
    // In production, consider using source-map-support or similar
    const stack = new Error().stack;
    if (!stack) return {};

    const lines = stack.split('\n').slice(3, 6); // Skip internal calls
    
    for (const line of lines) {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3], 10),
        };
      }
    }

    return {};
  }
}

// ===========================================
// Child Logger Implementation
// ===========================================

class ChildLoggerImpl implements ChildLogger {
  parentContext: string;
  private parent: StructuredLogger;

  constructor(config: LoggerConfig, context: string, parent: StructuredLogger) {
    this.parentContext = context;
    this.parent = parent;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.parent.debug(message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.parent.info(message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.parent.warn(message, metadata);
  }

  error(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    this.parent.error(message, errorOrMetadata, metadata);
  }

  fatal(message: string, errorOrMetadata?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    this.parent.fatal(message, errorOrMetadata, metadata);
  }

  child(context: string): ChildLogger {
    return this.parent.child(`${this.parentContext}:${context}`);
  }

  withContext(context: Record<string, any>): Logger {
    return this.parent.withContext(context);
  }

  setCorrelationId(id: string): void {
    this.parent.setCorrelationId(id);
  }

  setRequestId(id: string): void {
    this.parent.setRequestId(id);
  }

  setUser(user: { id: string; email?: string }): void {
    this.parent.setUser(user);
  }

  setTenant(tenantId: string, tenantName?: string): void {
    this.parent.setTenant(tenantId, tenantName);
  }

  measure<T>(name: string, fn: () => T): T {
    return this.parent.measure(name, fn);
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.parent.measureAsync(name, fn);
  }

  async flush(): Promise<void> {
    return this.parent.flush();
  }
}

// ===========================================
// Factory & Singleton
// ===========================================

let defaultLoggerInstance: Logger | null = null;

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new StructuredLogger(config);
}

export function getLogger(): Logger {
  if (!defaultLoggerInstance) {
    defaultLoggerInstance = createLogger();
  }
  return defaultLoggerInstance;
}

// Convenience exports
export const logger = getLogger();

// ===========================================
// Request-Specific Logger Middleware
// ===========================================

/**
 * Create a middleware that sets up request-specific logging context
 */
export function createLoggingMiddleware() {
  return async (request: Request, _context: any) => {
    const logger = getLogger();
    
    // Generate request-specific IDs
    const requestId = request.headers.get('x-request-id') || 
                      CorrelationManager.getInstance().generateId();
    const correlationId = request.headers.get('x-correlation-id') ||
                          CorrelationManager.getInstance().generateId();
    
    logger.setRequestId(requestId);
    logger.setCorrelationId(correlationId);
    
    // Log incoming request
    logger.info('Incoming request', {
      method: request.method,
      url: request.url.substring(0, 100), // Truncate long URLs
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
    });
    
    // Return cleanup function
    return {
      requestId,
      correlationId,
      cleanup: () => {
        logger.flush();
        CorrelationManager.getInstance().reset();
      },
    };
  };
}

// ===========================================
// Specialized Loggers
// ===========================================

/** Security event logger */
export const securityLogger = getLogger().child('security');

/** API request/response logger */
export const apiLogger = getLogger().child('api');

/** Database operation logger */
export const dbLogger = getLogger().child('database');

/** Payment transaction logger */
export const paymentLogger = getLogger().child('payment');

/** User action logger */
export const auditLogger = getLogger().child('audit');

// Export all
export {
  StructuredLogger,
  ChildLoggerImpl,
  CorrelationManager,
};

export default {
  createLogger,
  getLogger,
  createLoggingMiddleware,
  securityLogger,
  apiLogger,
  dbLogger,
  paymentLogger,
  auditLogger,
};
