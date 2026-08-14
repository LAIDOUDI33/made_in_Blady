/**
 * AlgeriaTrade.dz - Monitoring & Observability Module
 * 
 * Main entry point for all monitoring-related utilities.
 * Import from here for clean imports.
 */

// Sentry Error Tracking
export {
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
  DEFAULT_CONFIG as SENTRY_DEFAULT_CONFIG,
} from './sentry';

export type {
  SentryConfig,
  UserContext,
  ErrorContext,
  Breadcrumb,
  TransactionContext,
} from './sentry';

// Structured Logging
export {
  createLogger,
  getLogger,
  createLoggingMiddleware,
  logger,
  securityLogger,
  apiLogger,
  dbLogger,
  paymentLogger,
  auditLogger,
  DEFAULT_CONFIG as LOGGER_DEFAULT_CONFIG,
} from './logger';

export type {
  Logger,
  LoggerConfig,
  LogEntry,
  LogLevel,
  ChildLogger,
} from './logger';

// Health Checks & Uptime
export {
  getHealthMonitor,
  HealthMonitor,
  registry,
  dependencyTracker,
  incidentTracker,
  DEFAULT_CHECK_CONFIG as HEALTH_DEFAULT_CONFIG,
} from './health';

export type {
  HealthStatus,
  HealthCheckResult,
  DependencyHealth,
  SystemHealth,
  IncidentSummary,
  HealthCheckConfig,
  UptimeStats,
} from './health';

// Application Performance Monitoring (APM)
export {
  getAPMManager,
  APMManager,
  apm,
  metricsStore,
  traceCollector,
} from './apm';

export type {
  MetricPoint,
  TimeSeries,
  Span,
  Trace,
  EndpointPerformance,
  DashboardData,
} from './apm';

// Alerting & Notifications
export {
  getAlertManager,
  AlertManager,
  alerts,
  SlackChannel,
  EmailChannel,
  PagerDutyChannel,
  DiscordChannel,
  TelegramChannel,
  WebhookChannel,
} from './alerts';

export type {
  Alert,
  AlertSeverity,
  AlertStatus,
  ChannelType,
  ChannelResult,
  AlertRule,
  AlertCondition,
  EscalationPolicy,
  ChannelConfig,
  MaintenanceWindow,
} from './alerts';

// Multi-Tenant Observability
export {
  getTenantMetricsStore,
  TenantMetricsStore,
  tenantMetrics,
  PLAN_DEFINITIONS,
} from './multi-tenant';

export type {
  TenantMetrics,
  TenantQuota,
  TenantBillingRecord,
  TenantEvent,
  PlanType,
} from './multi-tenant';

// Default exports
export { default as sentry } from './sentry';
export { default as logging } from './logger';
export { default as health } from './health';
export { default as apm } from './apm';
export { default as alerts } from './alerts';
export { default as multiTenant } from './multi-tenant';
