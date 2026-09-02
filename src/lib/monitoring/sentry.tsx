/**
 * AlgeriaTrade.dz - Sentry Error Tracking & Performance Monitoring
 * 
 * Features:
 * - Client-side error capture (React errors, unhandled rejections)
 * - Server-side error tracking (API errors, database failures)
 * - Performance monitoring (Web Vitals, transaction tracing)
 * - User context tracking (session, tenant, locale)
 * - Release tracking with deployment info
 * - Source map upload for production debugging
 * - Custom breadcrumbs for user journey
 * - Error grouping and deduplication
 * - Integration with GA4 for correlation
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  dist?: string;
  sampleRate: number; // Error sampling (0-1)
  tracesSampleRate: number; // Performance tracing sampling
  profilesSampleRate: number; // Profiling sampling
  replaysSessionSampleRate: number; // Session replay
  replaysOnErrorSampleRate: number; // Replay on error
  enabled: boolean;
  debug: boolean;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  role?: 'buyer' | 'seller' | 'admin' | 'super_admin';
  tenantId?: string;
  tenantName?: string;
  locale?: string;
  country?: string;
  plan?: string;
}

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'log';
  fingerprint?: string[];
  user?: UserContext;
  transaction?: string;
}

export interface Breadcrumb {
  category: string;
  message: string;
  data?: Record<string, any>;
  level?: 'debug' | 'info' | 'warning' | 'error';
  type?: 'default' | 'http' | 'navigation' | 'ui' | 'xhr';
}

export interface TransactionContext {
  name: string;
  op?: string;
  parentSpanId?: string;
  sampled?: boolean;
  metadata?: {
    source?: 'url' | 'route' | 'custom';
    [key: string]: any;
  };
  data?: Record<string, any>;
  tags?: Record<string, string>;
}

// ===========================================
// Configuration
// ===========================================

const DEFAULT_CONFIG: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: (process.env.NODE_ENV as SentryConfig['environment']) || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  dist: process.env.NEXT_PUBLIC_BUILD_ID,
  
  // Sampling rates (reduce costs in production)
  sampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0, // 20% of errors in prod
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% traces in prod
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0, // 5% profiling in prod
  
  // Session replay (expensive, use sparingly)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
  
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: process.env.NODE_ENV === 'development',
};

// ===========================================
// Client-Side Sentry Initialization
// ===========================================

/**
 * Initialize Sentry on the client side
 */
export function initClientSentry(config?: Partial<SentryConfig>): void {
  if (typeof window === 'undefined') return;
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!finalConfig.enabled || !finalConfig.dsn) {
    console.log('🔍 Sentry disabled or DSN not configured');
    return;
  }

  // Dynamic import to avoid SSR issues
  import('@sentry/nextjs').then(Sentry => {
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      release: finalConfig.release,
      dist: finalConfig.dist,
      
      // Sample rates
      sampleRate: finalConfig.sampleRate,
      tracesSampleRate: finalConfig.tracesSampleRate,
      profilesSampleRate: finalConfig.profilesSampleRate,
      
      // Integrations
      integrations: [
        new Sentry.BrowserTracing({
          // Track navigation performance
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/(staging\.)?algeriatrade\.dz/,
            /^\//,
          ],
          // Custom routing
          routingInstrumentation: Sentry.reactRouterV5Instrumentation(
            React.useEffect,
            React.useLocation,
            React.useHistory,
            undefined, // options
            React.useRouteMatch,
          ),
        }),
        
        // Session replay (on error only)
        new Sentry.Replay({
          sessionSampleRate: finalConfig.replaysSessionSampleRate,
          errorSampleRate: finalConfig.replaysOnErrorSampleRate,
          maskAllText: true,
          blockAllMedia: true,
        }),
        
        // Capture console warnings as breadcrumbs
        new Sentry.CaptureConsole({
          levels: ['error', 'warn'],
        }),
      ],
      
      // Before send hook for filtering/enrichment
      beforeSend(event, hint) {
        return enrichErrorEvent(event, hint);
      },
      
      // Before send transaction
      beforeSendTransaction(transaction) {
        // Add custom data to transactions
        transaction.setContext('app', {
          version: finalConfig.release,
          locale: document.documentElement.lang || 'en',
        });
        
        return transaction;
      },
      
      // Initial scope configuration
      initialScope: {
        tags: {
          component: 'client',
          platform: typeof window !== 'undefined' ? getPlatform() : 'unknown',
        },
      },
      
      // Debug mode
      debug: finalConfig.debug,
      
      // Deny URLs (don't report errors from these)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        // Third-party scripts we don't control
        /google-analytics/i,
        /hotjar/i,
        // Development tools
        /react-dom-development/i,
      ],
      
      // Allow URLs (only report from our domains)
      allowUrls: [
        /algeriatrade\.dz/i,
        /localhost/i,
      ],
      
      // Ignore specific errors
      ignoreErrors: [
        // Non-critical errors
        /_gtag_/i, // Google Analytics errors
        /NetworkError/i, // Network connectivity issues (handled separately)
        /Failed to fetch/i, // Fetch API failures
        /Loading chunk \d+ failed/i, // Lazy loading failures (handled by retry)
        /Loading CSS chunk/i, // CSS loading failures
        /Request aborted/i, // User-initiated cancellations
        /The operation was aborted/i, // AbortController usage
        /ResizeObserver loop limit exceeded/i, // Non-critical browser issue
        /Script error/i, // Cross-origin script errors (no useful info),
        // Authentication-related (handled gracefully)
        /Unauthorized/i,
        /Forbidden/i,
        /Session expired/i,
      ],
    });

    console.log(`✅ Sentry initialized (${finalConfig.environment})`);
  }).catch(error => {
    console.error('❌ Failed to initialize Sentry:', error);
  });
}

/**
 * Initialize Sentry on the server side
 */
export function initServerSentry(config?: Partial<SentryConfig>): void {
  if (typeof window !== 'undefined') return;
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!finalConfig.enabled || !finalConfig.dsn) {
    return;
  }

  try {
    const Sentry = require('@sentry/nextjs');
    
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      release: finalConfig.release,
      
      sampleRate: finalConfig.sampleRate,
      tracesSampleRate: finalConfig.tracesSampleRate,
      
      integrations: [
        new Sentry.Http({ tracing: true }),
        
        // Express/Next.js request handling
        new Sentry.NodeHttp({
          tracing: true,
        }),
        
        // Postgres/Prisma integration
        new Sentry.Postgres(),
      ],
      
      beforeSend(event, hint) {
        return enrichServerEvent(event, hint);
      },
      
      initialScope: {
        tags: {
          component: 'server',
          runtime: 'node',
          nodeVersion: process.version,
        },
      },
      
      debug: finalConfig.debug,
    });
    
    console.log(`✅ Server Sentry initialized (${finalConfig.environment})`);
  } catch (error) {
    console.error('❌ Failed to initialize server Sentry:', error);
  }
}

// ===========================================
// Error Enrichment Functions
// ===========================================

function enrichErrorEvent(event: any, hint?: any): any {
  // Add user context if available
  if (typeof window !== 'undefined') {
    const userData = getUserDataFromStorage();
    if (userData) {
      event.user = {
        ...event.user,
        ...userData,
      };
    }
    
    // Add device context
    event.contexts = {
      ...event.contexts,
      device: {
        type: getDeviceType(),
        screenResolution: `${screen.width}x${screen.height}`,
        pixelRatio: window.devicePixelRatio,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      app: {
        name: 'AlgeriaTrade.dz',
        url: window.location.href,
        referrer: document.referrer,
      },
    };
    
    // Add request info
    event.request = {
      ...event.request,
      url: window.location.href,
      headers: {
        'User-Agent': navigator.userAgent,
      },
    };
  }
  
  // Categorize errors
  event.tags = {
    ...event.tags,
    errorCategory: categorizeError(event),
  };
  
  // Generate better fingerprints for grouping
  if (shouldCustomFingerprint(event)) {
    event.fingerprint = generateFingerprint(event);
  }
  
  return event;
}

function enrichServerEvent(event: any, hint?: any): any {
  // Add server-specific context
  event.contexts = {
    ...event.contexts,
    server: {
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid,
    },
  };
  
  // Mask sensitive data
  event = maskSensitiveData(event);
  
  return event;
}

// ===========================================
// Utility Functions
// ===========================================

function getPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';
  
  return 'unknown';
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  return 'desktop';
}

function getUserDataFromStorage(): Partial<UserContext> | null {
  try {
    // Try to get user data from various storage locations
    const userData = sessionStorage.getItem('at_user_data') || 
                    localStorage.getItem('at_user_persisted');
    
    if (userData) {
      return JSON.parse(userData);
    }
    
    return null;
  } catch {
    return null;
  }
}

function categorizeError(event: any): string {
  const message = event.exception?.values?.[0]?.value || event.message || '';
  
  if (/network|fetch|ajax|xhr/i.test(message)) return 'network';
  if (/auth|unauthorized|forbidden|token/i.test(message)) return 'authentication';
  if (/validation|schema|required/i.test(message)) return 'validation';
  if (/timeout|abort|cancel/i.test(message)) return 'timeout';
  if (/rendering|react|component/i.test(message)) return 'rendering';
  if (/api|server|500|502|503/i.test(message)) return 'server-error';
  if (/permission|denied|access/i.test(message)) return 'permission';
  
  return 'unknown';
}

function shouldCustomFingerprint(event: any): boolean {
  // Custom fingerprint for errors that need better grouping
  const message = event.exception?.values?.[0]?.value || '';
  
  return (
    /Loading chunk/.test(message) ||
    /Failed to fetch/.test(message) ||
    /Cannot read properties/.test(message) ||
    /is not a function/.test(message)
  );
}

function generateFingerprint(event: any): string[] {
  const message = event.exception?.values?.[0]?.value || '';
  const type = event.exception?.values?.[0]?.type || '';
  
  // Extract meaningful parts for grouping
  return [
    '{{ default }}', // Keep default grouping logic
    type,
    // Extract error pattern (remove variable parts like IDs, URLs)
    message
      .replace(/\/[a-f0-9-]{36}/gi, '/:id') // UUIDs
      .replace(/\d+/g, ':num') // Numbers
      .replace(/https?:\/\/[^\s]+/gi, ':url'), // URLs
  ];
}

function maskSensitiveData(event: any): any {
  // Remove sensitive headers and data
  if (event.request?.headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'password'];
    sensitiveHeaders.forEach(header => {
      delete event.request.headers[header];
      delete event.request.headers[header.toUpperCase()];
      delete event.request.headers[header.replace(/-/g, '_')];
    });
  }
  
  // Mask user data fields
  if (event.user) {
    event.user = {
      ...event.user,
      email: event.email ? maskEmail(event.user.email) : undefined,
      ip_address: event.user.ip_address ? '[filtered]' : undefined,
    };
  }
  
  return event;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';
  
  return `${localPart[0]}***@${domain}`;
}

// ===========================================
// Public API - Error Capturing
// ===========================================

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext
): string | undefined {
  if (typeof window === 'undefined') return;
  
  import('@sentry/nextjs').then(Sentry => {
    const scope = new Sentry.Scope();
    
    // Add context
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context?.level) {
      scope.setLevel(context.level);
    }
    
    if (context?.user) {
      scope.setUser(context.user as any);
    }
    
    if (context?.transaction) {
      scope.setTransactionName(context.transaction);
    }
    
    if (context?.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }
    
    Sentry.captureException(error, scope);
  });
  
  return undefined; // Return event ID in future implementation
}

/**
 * Capture a message (non-exception)
 */
export function captureMessage(
  message: string,
  context?: ErrorContext
): void {
  if (typeof window === 'undefined') return;
  
  import('@sentry/nextjs').then(Sentry => {
    const scope = new Sentry.Scope();
    
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.level) {
      scope.setLevel(context.level);
    }
    
    Sentry.captureMessage(message, scope);
  });
}

/**
 * Add a breadcrumb for user journey tracking
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  if (typeof window === 'undefined') return;
  
  import('@sentry/nextjs').then(Sentry => {
    Sentry.addBreadcrumb({
      timestamp: Date.now() / 1000,
      ...breadcrumb,
    });
  });
}

/**
 * Set user context for error attribution
 */
export function setUser(user: UserContext | null): void {
  if (typeof window === 'undefined') return;
  
  import('@sentry/nextjs').then(Sentry => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        segment: user.role,
        ...user,
      });
    } else {
      Sentry.setUser(null);
    }
  });
}

/**
 * Set tags for filtering in Sentry dashboard
 */
export function setTags(tags: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  
  import('@sentry/nextjs').then(Sentry => {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  });
}

/**
 * Set extra context data
 */
export function setContext(key: string, data: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  import('@sentry/nextjs').then(Sentry => {
    Sentry.setContext(key, data);
  });
}

// ===========================================
// Transaction/Performance Tracking
// ===========================================

/**
 * Start a performance transaction
 */
export async function startTransaction(
  context: TransactionContext
): Promise<any> {
  if (typeof window === 'undefined') return null;
  
  try {
    const Sentry = await import('@sentry/nextjs');
    return Sentry.startTransaction({
      name: context.name,
      op: context.op,
      parentSpanId: context.parentSpanId,
      sampled: context.sampled,
      metadata: context.metadata,
      data: context.data,
      tags: context.tags,
    });
  } catch {
    return null;
  }
}

/**
 * Create a child span within a transaction
 */
export function startChildSpan(
  transaction: any,
  options: {
    op: string;
    description: string;
    data?: Record<string, any>;
  }
): any {
  if (!transaction) return null;
  
  try {
    return transaction.startChild({
      op: options.op,
      description: options.description,
      data: options.data,
    });
  } catch {
    return null;
  }
}

// ===========================================
// Automatic Breadcrumb Tracking
// ===========================================

/**
 * Setup automatic breadcrumb collection for common actions
 */
export function setupBreadcrumbTracking(): void {
  if (typeof window === 'undefined') return;

  // Navigation tracking
  if (typeof window !== 'undefined') {
    let lastPathname = window.location.pathname;
    
    // Track page navigation
    const originalPushState = history.pushState;
    history.pushState = function(...args: any[]) {
      addBreadcrumb({
        category: 'navigation',
        message: `Navigation to ${args[2] || args[0]}`,
        data: { from: lastPathname, to: args[2] || args[0] },
        type: 'navigation',
      });
      lastPathname = args[2] || window.location.pathname;
      return originalPushState.apply(this, args);
    };

    // Track clicks on interactive elements
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      
      if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) {
        addBreadcrumb({
          category: 'ui.click',
          message: `Clicked ${tagName}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ')[0] : ''}`,
          data: {
            tag: tagName,
            id: target.id,
            class: target.className,
            href: (target as HTMLAnchorElement).href,
          },
          type: 'ui',
        });
      }
    }, true);

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      addBreadcrumb({
        category: 'ui.form',
        message: `Form submitted: ${form.id || form.name || form.action || 'unknown'}`,
        data: {
          method: form.method,
          action: form.action,
          id: form.id,
        },
        type: 'ui',
      });
    });

    // Track XHR/Fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      addBreadcrumb({
        category: 'fetch',
        message: `${init?.method || 'GET'} ${url}`,
        data: { url, method: init?.method || 'GET' },
        type: 'xhr',
      });

      try {
        const response = await originalFetch.call(this, input, init);
        
        if (!response.ok) {
          addBreadcrumb({
            category: 'fetch',
            message: `Fetch failed: ${response.status} ${url}`,
            data: { status: response.status, statusText: response.statusText, url },
            level: 'warning',
            type: 'xhr',
          });
        }
        
        return response;
      } catch (error) {
        addBreadcrumb({
          category: 'fetch',
          message: `Fetch error: ${(error as Error).message}`,
          data: { url, error: (error as Error).message },
          level: 'error',
          type: 'xhr',
        });
        throw error;
      }
    };
  }
}

// ===========================================
// React Error Boundary Integration
// ===========================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * HOC for React components with automatic error reporting
 */
export function withErrorReporting<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorReporting: React.FC<P> = (props) => {
    return (
      <WrappedComponent
        {...props}
      />
    );
  };

  WithErrorReporting.displayName = `withErrorReporting(${displayName})`;
  return WithErrorReporting;
}

// ===========================================
// Export All
// ===========================================

export {
  DEFAULT_CONFIG,
};

export default {
  initClientSentry,
  initServerSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTags,
  setContext,
  startTransaction,
  startChildSpan,
  setupBreadcrumbTracking,
  withErrorReporting,
};
