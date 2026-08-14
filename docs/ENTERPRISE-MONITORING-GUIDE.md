# AlgeriaTrade.dz - Enterprise Monitoring & Observability Guide

## 📊 Overview

AlgeriaTrade.dz implements a **comprehensive enterprise-grade monitoring system** designed to surpass competitors like made-in-china.com. Our observability stack provides real-time insights into system health, application performance, user behavior, and business metrics.

### Key Features

- **🔍 Error Tracking**: Sentry integration with intelligent error grouping and source maps
- **💪 Health Monitoring**: Multi-layer health checks with dependency tracking
- **📈 APM Dashboard**: Real-time performance metrics with custom dashboards
- **🚨 Alerting System**: Multi-channel alerts (Slack, Email, PagerDuty, Discord)
- **🖥️ Infrastructure Monitoring**: CPU, Memory, Disk, Network metrics
- **📊 Business Analytics**: Conversion funnels, revenue tracking, cohort analysis
- **🏢 Multi-Tenant Observability**: Per-tenant metrics and quota management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING DASHBOARD                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Overview   │ │Infrastructure│ │ Performance │ │ Business  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING API LAYER                          │
│  /api/admin/monitoring - Real-time data aggregation             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    CORE MONITORING MODULES                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Sentry  │ │  Logger  │ │   APM    │ │  Alerts  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Health  │ │ Infra    │ │ Business │ │Multi-Ten.│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  Sentry • Slack • PagerDuty • Email • Prometheus (optional)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Environment Variables

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_APP_VERSION=2.4.1
NEXT_PUBLIC_BUILD_ID=your-build-id

# Logging
LOG_REMOTE_ENDPOINT=https://logs.algeriatrade.dz/ingest

# Alert Channels (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PAGERDUTY_INTEGRATION_KEY=your-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=your-token
```

### 2. Initialize Monitoring

```typescript
// In your app layout or initialization file
import { 
  initClientSentry, 
  initServerSentry,
  getInfrastructureMonitor,
} from '@/lib/monitoring';

// Client-side initialization
if (typeof window !== 'undefined') {
  initClientSentry({
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% in production
  });
}

// Server-side initialization
initServerSentry();

// Start infrastructure monitoring (server only)
if (typeof window === 'undefined') {
  const infraMonitor = getInfrastructureMonitor();
  infraMonitor.start();
}
```

### 3. Use the Monitoring Dashboard

```tsx
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <MonitoringDashboard />
    </div>
  );
}
```

---

## 📁 Module Reference

### 1. Sentry Error Tracking (`sentry.ts`)

**Purpose**: Capture, categorize, and analyze application errors.

#### Features:
- Client & server-side error capture
- Automatic error enrichment with user/device context
- Custom breadcrumbs for user journey tracking
- Intelligent error fingerprinting for better grouping
- Session replay on errors
- Source map support for production debugging

#### Usage:

```typescript
import { 
  captureException, 
  captureMessage, 
  addBreadcrumb,
  setUser,
  setTags,
} from '@/lib/monitoring';

// Capture exceptions
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { feature: 'checkout', action: 'payment' },
    level: 'error',
    context: 'payment-processing',
  });
}

// Track user journey
addBreadcrumb({
  category: 'ui.click',
  message: 'User clicked "Add to Cart"',
  data: { productId: '123', variant: 'red' },
});

// Set user context
setUser({ id: 'user_123', email: 'user@example.com', role: 'buyer' });
```

#### React Error Boundary:

```tsx
import { SentryErrorBoundary } from '@/lib/monitoring';

function ProductPage() {
  return (
    <SentryErrorBoundary
      componentName="ProductPage"
      onError={(error, info) => console.error('Product page crashed:', error)}
      maxRetries={3}
    >
      <ProductContent />
    </SentryErrorBoundary>
  );
}
```

---

### 2. Structured Logging (`logger.ts`)

**Purpose**: JSON-structured logging with correlation IDs for distributed tracing.

#### Features:
- Multiple log levels (debug, info, warn, error, fatal)
- Correlation IDs for request tracing
- Child loggers for component isolation
- Sensitive data masking
- Remote log aggregation ready
- Performance measurement utilities

#### Usage:

```typescript
import { logger, apiLogger, securityLogger } from '@/lib/monitoring';

// Basic logging
logger.info('User logged in', { userId: '123', method: 'oauth' });

// With correlation ID
logger.setCorrelationId('req_abc123');
logger.info('Processing request');

// Child logger for specific context
const orderLogger = logger.child('order-service');
orderLogger.info('Order created', { orderId: 'ord_456' });

// Specialized loggers
apiLogger.debug('API call completed', { endpoint: '/api/products', duration: 45 });
securityLogger.warn('Failed login attempt', { ip: '192.168.1.1', attempts: 5 });

// Performance measurement
const result = logger.measureAsync('database-query', async () => {
  return await db.query('SELECT * FROM products');
});
```

---

### 3. Health Checks (`health.ts`)

**Purpose**: Monitor system health and dependencies.

#### Features:
- Shallow/deep health checks
- Dependency status tracking (DB, Redis, APIs)
- SSL certificate monitoring
- Geographic availability checks
- Incident detection and tracking
- Status page data generation

#### Usage:

```typescript
import { getHealthMonitor, registry } from '@/lib/monitoring';

const healthMonitor = getHealthMonitor();

// Register custom health check
registry.registerCheck('database', {
  name: 'Database Connection',
  type: 'deep',
  timeout: 5000,
  check: async () => {
    const start = Date.now();
    await db.query('SELECT 1');
    return {
      status: 'healthy',
      duration: Date.now() - start,
      message: 'Database responding normally',
    };
  },
});

// Get full system health
const health = await healthMonitor.getFullStatus();
console.log(health.overallStatus); // 'healthy' | 'degraded' | 'unhealthy'
```

---

### 4. Application Performance Monitoring (`apm.ts`)

**Purpose**: Track application performance metrics.

#### Features:
- Request tracing with spans
- Custom metrics (counters, gauges, histograms)
- Endpoint performance tracking
- Geographic breakdown
- User experience scoring (APDEX)
- Prometheus export format

#### Usage:

```typescript
import { apm } from '@/lib/monitoring';

// Record request metrics
apm.recordRequest({
  method: 'GET',
  path: '/api/products',
  statusCode: 200,
  duration: 45, // ms
  userId: 'user_123',
  country: 'DZ',
});

// Create custom metrics
apm.increment('products.searched', 1, { category: 'electronics' });
apm.setGauge('queue.length', 150);
apm.recordHistogram('api.response_time', 45, { endpoint: '/api/orders' });

// Generate dashboard data
const dashboardData = await apm.generateDashboard('24h');
console.log(dashboardData.overview.errorRate); // 0.5%
console.log(dashboardData.userExperience.apdexScore); // 95.2

// Export to Prometheus format
const prometheusMetrics = apm.exportPrometheusFormat();
```

---

### 5. Alerting System (`alerts.ts`)

**Purpose**: Send notifications based on metric thresholds.

#### Features:
- Multi-channel alerts (Slack, Email, PagerDuty, Discord, Telegram)
- Severity-based routing
- Alert deduplication and grouping
- Rate limiting to prevent alert fatigue
- Escalation policies
- Maintenance windows
- Alert history and audit trail

#### Usage:

```typescript
import { getAlertManager, SlackChannel, EmailChannel } from '@/lib/monitoring';

const alertManager = getAlertManager();

// Configure channels
alertManager.registerChannel('slack-devops', new SlackChannel({
  webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  channel: '#devops-alerts',
  username: 'AlgeriaTrade Monitor',
}));

alertManager.registerChannel('email-oncall', new EmailChannel({
  smtpConfig: { /* ... */ },
  recipients: ['oncall@algeriatrade.dz'],
}));

// Create alert rules
await alertManager.createRule({
  name: 'High Error Rate',
  condition: {
    metric: 'errors.total',
    operator: '>',
    threshold: 100,
    window: '5m',
  },
  severity: 'critical',
  channels: ['slack-devops', 'email-oncall'],
  cooldown: '15m',
});

// Manual alert trigger
await alertManager.triggerAlert({
  name: 'Database Connection Lost',
  severity: 'critical',
  message: 'Cannot connect to primary database',
  source: 'database-monitor',
});
```

---

### 6. Infrastructure Monitoring (`infrastructure.ts`)

**Purpose**: Monitor server resources and system health.

#### Features:
- CPU usage with load averages
- Memory utilization (including heap)
- Disk space and I/O metrics
- Network bandwidth tracking
- Process-specific stats (event loop lag, handles)
- Database connection pool monitoring
- Cache performance metrics
- Capacity forecasting
- Prometheus-compatible exports

#### Usage:

```typescript
import { getInfrastructureMonitor } from '@/lib/monitoring';

const infraMonitor = getInfrastructureMonitor();

// Start collecting (server-side only)
infraMonitor.start();

// Get latest metrics
const metrics = infraMonitor.getLatestMetrics();
console.log(metrics.cpu.usage); // 65%
console.log(metrics.memory.percentage); // 72%

// Get active alerts
const alerts = infraMonitor.getActiveAlerts();

// Generate capacity forecast
const forecast = infraMonitor.generateForecast('memory');
console.log(`Memory will reach critical in ${forecast.daysUntilThreshold} days`);

// Export to Prometheus
const prometheusOutput = infraMonitor.exportPrometheusFormat();

// Stop when done
infraMonitor.stop();
```

---

### 7. Business Metrics (`business-metrics.ts`)

**Purpose**: Track business KPIs and user behavior.

#### Features:
- Conversion funnel analysis
- User session analytics
- Product performance tracking
- Supplier effectiveness metrics
- Revenue analytics and forecasting
- Cohort analysis support
- Custom event tracking

#### Usage:

```typescript
import { businessMetrics } from '@/lib/monitoring';

// Track events
businessMetrics.trackEvent('product_view', {
  productId: 'prod_123',
  userId: 'user_456',
}, { url: '/products/prod_123' });

businessMetrics.trackEvent('order_place', {
  orderId: 'ord_789',
  amount: 2500,
  currency: 'DZD',
});

// Record revenue
businessMetrics.recordRevenue({
  amount: 2500,
  currency: 'DZD',
  paymentMethod: 'baridimob',
  orderId: 'ord_789',
  userId: 'user_456',
  isNewCustomer: false,
});

// Get conversion funnels
const ecommerceFunnel = businessMetrics.getEcommerceFunnel();
console.log(ecommerceFunnel.conversionRate); // 3.9%

const rfqFunnel = businessMetrics.getRfqFunnel();

// Product analytics
const productMetrics = businessMetrics.getProductMetrics('prod_123');
console.log(productMetrics.views); // 1250
console.log(productMetrics.conversionRate); // 2.8%

// Revenue dashboard
const revenue = businessMetrics.getRevenueMetrics('daily', 7);
console.log(revenue[0].grossRevenue); // $45,000

// Full dashboard data
const dashboard = businessMetrics.generateDashboard();
```

---

### 8. Multi-Tenant Observability (`multi-tenant.ts`)

**Purpose**: Per-tenant metrics isolation and billing.

#### Features:
- Tenant-specific metrics collection
- Usage quota tracking
- SLA compliance monitoring
- Billing data generation
- Plan-based limits
- Resource utilization per tenant

#### Usage:

```typescript
import { tenantMetrics, PLAN_DEFINITIONS } from '@/lib/monitoring';

// Record tenant-specific metric
tenantMetrics.recordMetric('tenant_abc', 'api_calls', 1);

// Get tenant metrics
const metrics = await tenantMetrics.getTenantMetrics('tenant_abc');
console.log(metrics.requests.total); // 50,000
console.log(metrics.sla.overallStatus); // 'compliant'

// Check quotas
const quotaStatus = await tenantMetrics.checkQuota('tenant_abc', 'api_call');
if (!quotaStatus.allowed) {
  console.warn(`Quota exceeded! Remaining: ${quotaStatus.remaining}`);
}

// Generate billing record
const bill = await tenantMetrics.generateBilling(
  'tenant_abc',
  new Date('2024-01-01'),
  new Date('2024-02-01'),
);
console.log(bill.totals.total); // $99.00
```

---

## 🔧 API Endpoints

### GET `/api/admin/monitoring`

Returns comprehensive monitoring data for the dashboard.

**Query Parameters:**
- `infrastructure=true|false` - Include infrastructure metrics (default: true)
- `business=true|false` - Include business metrics (default: false)
- `period=1h|6h|24h|7d|30d` - Time period for APM data

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "health": { "overallStatus": "healthy", "uptime": 99.95, ... },
  "performance": { "requestsPerSecond": 120, "avgResponseTime": 85, ... },
  "infrastructure": { "cpu": {...}, "memory": {...}, ... },
  "business": { "totalRevenue": 45000, "ordersToday": 75, ... },
  "alerts": [...],
  "meta": { "version": "2.4.1", "cacheTTL": 5000 }
}
```

### POST `/api/admin/monitoring`

Perform actions on the monitoring system.

**Actions:**
- `acknowledge_alert` - Acknowledge an alert
- `clear_cache` - Clear monitoring cache
- `trigger_health_check` - Run all health checks
- `get_metrics` - Get specific metrics by name

**Example:**
```json
POST /api/admin/monitoring
{
  "action": "acknowledge_alert",
  "alertId": "alert_123"
}
```

---

## 🎨 Dashboard Components

### MonitoringDashboard

Full-featured monitoring dashboard with tabs for:
- **Overview**: System health, key metrics, recent alerts
- **Infrastructure**: CPU, Memory, Disk, Network details
- **Performance**: Endpoint performance table, response times
- **Business**: Revenue, conversions, funnels
- **Alerts**: Active alerts, alert history

```tsx
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

<MonitoringDashboard />
```

### StatusBadge

Display system status with appropriate styling.

```tsx
import { StatusBadge } from '@/components/monitoring/MonitoringDashboard';

<StatusBadge status="healthy" /> // Green badge
<StatusBadge status="degraded" /> // Yellow badge
<StatusBadge status="unhealthy" /> // Red badge
```

---

## 🔒 Security Considerations

1. **Sensitive Data Masking**: All logs automatically mask passwords, tokens, API keys
2. **IP Anonymization**: Optional IP anonymization for GDPR compliance
3. **Access Control**: Admin-only access to monitoring endpoints
4. **CORS Restrictions**: API endpoints restricted to admin origins
5. **Rate Limiting**: Built-in rate limiting on all monitoring APIs

---

## 📈 Best Practices

### 1. Sampling in Production

```typescript
// Reduce costs while maintaining visibility
initClientSentry({
  sampleRate: 0.2,        // 20% of errors
  tracesSampleRate: 0.1,  // 10% of traces
  replaysOnErrorSampleRate: 0.5, // 50% of error sessions
});
```

### 2. Correlate Logs Across Services

```typescript
// Set correlation IDs in middleware
const correlationId = generateCorrelationId();
logger.setCorrelationId(correlationId);

// Pass to downstream services
fetch('/api/service', {
  headers: { 'X-Correlation-ID': correlationId }
});
```

### 3. Define Meaningful Alerts

```typescript
// Good: Actionable alert with clear threshold
await alertManager.createRule({
  name: 'Payment Failure Rate High',
  condition: {
    metric: 'payment.failures',
    operator: '>',
    threshold: 5, // More than 5 failures per hour
    window: '1h',
  },
  message: 'Payment failure rate exceeds threshold. Check payment gateway.',
  
  // Bad: Vague alert that fires too often
  // name: 'Something might be wrong'
  // condition: { metric: 'errors', operator: '>', threshold: 0 }
});
```

### 4. Monitor Business Metrics, Not Just Technical

```typescript
// Track what matters to the business
businessMetrics.trackEvent('conversion', {
  step: 'purchase_completed',
  value: 2500,
  userId: customer.id,
});

// Not just technical metrics
// Don't focus solely on: server.cpu.usage, memory.free
// Also track: conversion_rate, revenue_per_user, nps_score
```

---

## 🚀 Deployment Checklist

- [ ] Configure Sentry DSN for each environment
- [ ] Set up alert channels (Slack, PagerDuty)
- [ ] Configure infrastructure monitoring thresholds
- [ ] Define SLA targets for each service
- [ ] Set up business metric tracking
- [ ] Test error boundary components
- [ ] Verify log aggregation pipeline
- [ ] Configure maintenance windows for planned outages
- [ ] Set up on-call rotation and escalation policies
- [ ] Document runbooks for common alerts

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Observability Patterns](https://observability.dev/)

---

## 🤝 Contributing

When adding new monitoring capabilities:

1. Follow existing patterns in `/src/lib/monitoring/`
2. Export from `index.ts` for clean imports
3. Add TypeScript types for all interfaces
4. Include JSDoc comments for public APIs
5. Update this documentation

---

**Last Updated**: January 2024  
**Version**: 2.4.1  
**Maintained By**: AlgeriaTrade.dz Engineering Team
