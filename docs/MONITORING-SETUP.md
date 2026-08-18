# AlgeriaTrade.dz Monitoring Setup Guide - Phase 8

**Comprehensive Monitoring Infrastructure Configuration**
**Version:** 8.0.0
**Last Updated:** $(date +%Y-%m-%d)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prometheus Metrics Collection](#2-prometheus-metrics-collection)
3. [Grafana Dashboard Setup](#3-grafana-dashboard-setup)
4. [Loki Log Aggregation](#4-loki-log-aggregation)
5. [AlertManager Rules](#5-alertmanager-rules)
6. [Uptime Monitoring](#6-uptime-monitoring)
7. [Error Tracking (Sentry)](#7-error-tracking-sentry)
8. [Alert Thresholds Reference](#8-alert-thresholds-reference)
9. [Quick Start Commands](#9-quick-start-commands)

---

## 1. Architecture Overview

### Monitoring Stack Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AlgeriaTrade.dz Platform                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐  │
│  │   Next.js │  │ Payment  │  │   ERP    │  │ WebRTC   │  │   AR     │  │
│  │   App    │  │ Services │  │  Sync    │  │ Signaling│  │ Viewer   │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘  │
│        │              │              │              │             │       │
│        ▼              ▼              ▼              ▼             ▼       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Metrics Exporters (Prometheus)                    │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│    Prometheus   │  │      Loki        │  │       Sentry        │
│  (Metrics DB)   │  │   (Log Aggregation)│  │  (Error Tracking)   │
└────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│     Grafana     │  │    Grafana       │  │    Sentry UI        │
│  (Dashboards)   │  │  (Log Explorer)  │  │  (Issue Tracking)   │
└────────┬────────┘  └──────────────────┘  └─────────────────────┘
         │
         ▼
┌─────────────────┐
│   AlertManager  │
│  (Notifications)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Notification Channels                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Slack   │  │ PagerDuty│  │   Email  │  │   Webhook/Custom │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Retention Policies

| Data Type | Hot Storage | Cold Storage | Archive |
|-----------|-------------|--------------|---------|
| Metrics | 15 days | 6 months | 1 year |
| Logs | 7 days | 30 days | 90 days |
| Traces | 7 days | 30 days | N/A |
| Error Events | 30 days | 90 days | 1 year |

---

## 2. Prometheus Metrics Collection

### 2.1 Prometheus Configuration

Create `/etc/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'algeriatrade'
    environment: 'production'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 'alertmanager:9093'

# Rule files
rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  # ====================
  # Core Application
  # ====================
  - job_name: 'algeriatrade-app'
    metrics_path: '/api/metrics'
    scheme: https
    basic_auth:
      username: 'prometheus'
      password: '${PROMETHEUS_AUTH_TOKEN}'
    static_configs:
      - targets: ['app-1:3000', 'app-2:3000', 'app-3:3000']
        labels:
          service: 'application'
          environment: 'production'
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: '${1}'

  # ====================
  # Node Exporter (Infrastructure)
  # ====================
  - job_name: 'node-exporter'
    scrape_interval: 10s
    static_configs:
      - targets: ['node-exporter-1:9100', 'node-exporter-2:9100', 'node-exporter-3:9100']
        labels:
          environment: 'production'

  # ====================
  # PostgreSQL Exporter
  # ====================
  - job_name: 'postgres-exporter'
    scrape_interval: 30s
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          service: 'database'
          db_type: 'postgresql'

  # ====================
  # Redis Exporter
  # ====================
  - job_name: 'redis-exporter'
    scrape_interval: 15s
    static_configs:
      - targets: ['redis-exporter:9121']
        labels:
          service: 'cache'
          db_type: 'redis'

  # ====================
  # Docker / Container Metrics
  # ====================
  - job_name: 'cadvisor'
    scrape_interval: 15s
    static_configs:
      - targets: ['cadvisor:8080']
        labels:
          service: 'containers'

  # ====================
  # Nginx/Caddy Metrics
  # ====================
  - job_name: 'web-server'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['nginx-exporter:9113']
        labels:
          service: 'reverse-proxy'

  # ====================
  # WebRTC Signaling Server
  # ====================
  - job_name: 'webrtc-signaling'
    scrape_interval: 10s
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['webrtc-service:3002']
        labels:
          service: 'realtime-communication'

  # ====================
  # ERP Sync Service (if separate)
  # ====================
  - job_name: 'erp-sync-service'
    scrape_interval: 30s
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['erp-sync:3004']
        labels:
          service: 'integration'
```

### 2.2 Application Metrics Instrumentation

Add to your Next.js application (`src/lib/metrics.ts`):

```typescript
// Prometheus client for Node.js
import client from 'prom-client';

// Create registry
const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register, prefix: 'algeriatrade_' });

// ====================
// Custom Metrics Definitions
// ====================

// HTTP Request Duration Histogram
const httpRequestDuration = new client.Histogram({
  name: 'algeriatrade_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// HTTP Requests Total Counter
const httpRequestsTotal = new client.Counter({
  name: 'algeriatrade_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

// Active WebSocket Connections Gauge
const activeWebSocketConnections = new client.Gauge({
  name: 'algeriatrade_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['type'], // webrtc, chat, negotiation
});

// Payment Transactions Counter
const paymentTransactionsTotal = new client.Counter({
  name: 'algeriatrade_payment_transactions_total',
  help: 'Total number of payment transactions',
  labelNames: ['provider', 'status', 'currency'],
});

// Payment Transaction Amount (for value tracking)
const paymentTransactionAmount = new client.Histogram({
  name: 'algeriatrade_payment_transaction_amount_dzd',
  help: 'Payment transaction amounts in DZD',
  labelNames: ['provider', 'currency'],
  buckets: [1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000],
});

// Database Query Duration
const dbQueryDuration = new client.Histogram({
  name: 'algeriatrade_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

// Cache Operations
const cacheOperations = new client.Counter({
  name: 'algeriatrade_cache_operations_total',
  help: 'Cache operations count',
  labelNames: ['operation', 'result'], // hit, miss, set, delete
});

// ERP Sync Operations
const erpSyncOperations = new client.Counter({
  name: 'algeriatrade_erp_sync_operations_total',
  help: 'ERP synchronization operations',
  labelNames: ['integration_type', 'operation', 'status'],
});

// AR Model Load Performance
const arModelLoadDuration = new client.Histogram({
  name: 'algeriatrade_ar_model_load_duration_seconds',
  help: 'AR model load duration in seconds',
  labelNames: ['model_format', 'file_size_range'],
  buckets: [0.5, 1, 2, 3, 5, 10, 15, 30],
});

// Currency Conversion Operations
const currencyConversions = new client.Counter({
  name: 'algeriatrade_currency_conversions_total',
  help: 'Currency conversion operations',
  labelNames: ['from_currency', 'to_currency', 'cached'],
});

// Invoice Generation
const invoiceGenerationDuration = new client.Histogram({
  name: 'algeriatrade_invoice_generation_duration_seconds',
  help: 'Invoice generation duration in seconds',
  labelNames: ['invoice_type'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
});

// CRM Pipeline Events
const crmPipelineEvents = new client.Counter({
  name: 'algeriatrade_crm_pipeline_events_total',
  help: 'CRM pipeline events',
  labelNames: ['event_type', 'pipeline_id', 'stage_from', 'stage_to'],
});

// Background Job Queue Depth
const jobQueueDepth = new client.Gauge({
  name: 'algeriatrade_job_queue_depth',
  help: 'Number of jobs in queue',
  labelNames: ['queue_name', 'priority'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeWebSocketConnections);
register.registerMetric(paymentTransactionsTotal);
register.registerMetric(paymentTransactionAmount);
register.registerMetric(dbQueryDuration);
register.registerMetric(cacheOperations);
register.registerMetric(erpSyncOperations);
register.registerMetric(arModelLoadDuration);
register.registerMetric(currencyConversions);
register.registerMetric(invoiceGenerationDuration);
register.registerMetric(crmPipelineEvents);
register.registerMetric(jobQueueDepth);

export {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeWebSocketConnections,
  paymentTransactionsTotal,
  paymentTransactionAmount,
  dbQueryDuration,
  cacheOperations,
  erpSyncOperations,
  arModelLoadDuration,
  currencyConversions,
  invoiceGenerationDuration,
  crmPipelineEvents,
  jobQueueDepth,
};
```

### 2.3 API Endpoint for Metrics

Create `src/app/api/metrics/route.ts`:

```typescript
import { register } from '@/lib/metrics';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Require Bearer token for security
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
```

---

## 3. Grafana Dashboard Setup

### 3.1 Import Phase 8 Dashboards

The dashboard configuration is available at `docs/grafana/phase8-dashboards.json`.

**Import via Grafana UI:**
1. Navigate to Dashboards → Import
2. Upload `phase8-dashboards.json` or paste JSON content
3. Select Prometheus as data source
4. Click Import

**Import via API:**

```bash
# Get list of dashboards from JSON
cat docs/grafana/phase8-dashboards.json | jq '.[] | .title'

# Import individual dashboard
DASHBOARD_JSON=$(jq '.[0]' docs/grafana/phase8-dashboards.json)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  --data "$DASHBOARD_JSON" \
  "http://grafana:3000/api/dashboards/db"
```

### 3.2 Dashboard Panels Overview

The Phase 8 dashboard includes **51 panels** organized into sections:

#### Section 1: Overview (6 panels)
| Panel | Type | Metric | Description |
|-------|------|--------|-------------|
| Request Rate | Time Series | `rate(http_requests_total[5m])` | Requests per second |
| Error Rate | Gauge | `error rate %` | Current error percentage |
| P50 Latency | Stat | `histogram_quantile(0.5, ...)` | Median response time |
| P95 Latency | Stat | `histogram_quantile(0.95, ...)` | 95th percentile |
| P99 Latency | Stat | `histogram_quantile(0.99, ...)` | 99th percentile |
| Active Users | Stat | Custom gauge | Current active sessions |

#### Section 2: Payment Metrics (12 panels)
| Panel | Type | Metric | Description |
|-------|------|--------|-------------|
| SATIM Success Rate | Gauge | SATIM transactions success % | CIB payment health |
| Stripe Success Rate | Gauge | Stripe transactions success % | Stripe payment health |
| Crypto Success Rate | Gauge | Crypto confirmations % | Blockchain payments |
| Transaction Volume | Time Series | `payment_transaction_amount sum` | Revenue over time |
| Transactions by Provider | Pie Chart | By provider label | Distribution |
| Avg Transaction Value | Stat | Mean amount | AOV metric |
| Pending Settlements | Table | Status=pending | Awaiting confirmation |
| Failed Payments | Log | Error logs from payments | Failure analysis |
| Payment Method Distribution | Bar Chart | By method type | User preferences |
| DPA Processing Time | Gauge | Avg DPA cycle time | Bank guarantee speed |
| Daily Revenue | Stat | Sum of completed txns | Today's revenue |
| Refund Rate | Gauge | Refunds / total txns | Customer satisfaction |

#### Section 3: Infrastructure (10 panels)
| Panel | Type | Metric | Description |
|-------|------|--------|-------------|
| CPU Usage | Graph | `node_cpu_seconds_total` | Per-instance CPU |
| Memory Usage | Graph | `node_memory_*` | RAM utilization |
| Disk Usage | Singlestat | `node_filesystem_*` | Storage capacity |
| Network I/O | Graph | `node_network_*` | Traffic throughput |
| Container Count | Stat | Running containers | Orchestration status |
| Database Connections | Gauge | `pg_stat_activity count` | Connection pool usage |
| Database Size | Stat | Database size in GB | Growth trend |
| Redis Memory | Gauge | `redis_memory_used_bytes` | Cache memory usage |
| Redis Hit Rate | Gauge | Cache hit / total | Cache efficiency |
| Uptime | Stat | Instance availability | SLA tracking |

#### Section 4: Feature-Specific (15 panels)
| Panel | Type | Feature | Description |
|-------|------|---------|-------------|
| CRM Deals Created | Counter | CRM | New deals today |
| Pipeline Velocity | Gauge | CRM | Stage transition rate |
| ERP Sync Status | Table | ERP | Last sync per integration |
| Sync Errors | Log | ERP | Recent failures |
| AR Model Loads | Counter | AR | Models viewed today |
| AR Load Time P95 | Histogram | AR | Load performance |
| Currency Rates Age | Gauge | Multi-currency | Last update time |
| Conversions Today | Counter | Multi-currency | Usage volume |
| Active Calls | Gauge | WebRTC | Live calls now |
| Call Quality Score | Gauge | WebRTC | Average MOS score |
| Invoices Generated | Counter | Invoicing | Documents created |
| Invoice Queue Depth | Gauge | Invoicing | Pending generation |
| Negotiation Activity | Time Series | Negotiation | Active negotiations |
| Background Jobs | Table | Jobs | Queue status by type |
| WebSocket Connections | Gauge | Real-time | Connected clients |

#### Section 5: Business KPIs (8 panels)
| Panel | Type | Description |
|-------|------|-------------|
| GMV (Gross Merchandise Value) | Stat | Total transaction value |
| Active Buyers | Stat | Unique buying users |
| Active Sellers | Stat | Unique selling users |
| Product Views | Counter | Catalog engagement |
| RFQs Created | Counter | Quote requests |
| Conversion Rate | Funnel | View → Purchase rate |
| Avg Order Value | Stat | Mean basket size |
| Revenue Trend | Time Series | Revenue over time |

### 3.3 Grafana Data Source Configuration

```json
{
  "name": "Prometheus",
  "type": "prometheus",
  "url": "http://prometheus:9090",
  "access": "proxy",
  "isDefault": true,
  "jsonData": {
    "httpMethod": "POST",
    "manageAlerts": true,
    "prometheusType": "Prometheus"
  }
}

{
  "name": "Loki",
  "type": "loki",
  "url": "http://loki:3100",
  "access": "proxy",
  "jsonData": {
    "maxLines": 1000
  }
}
```

---

## 4. Loki Log Aggregation

### 4.1 Loki Configuration

Create `/etc/loki/local-config.yaml`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
    heartbeat_period: 60s
  chunk_idle_period: 5m
  chunk_retain_period: 30s
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  max_query_length: 721h
  max_query_parallelism: 20

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
```

### 4.2 Promtail Configuration (Log Collector)

Create `/etc/promtail/config.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Application Logs
  - job_name: algeriatrade-app
    static_configs:
      - targets:
          - localhost
        labels:
          job: algeriatrade-app
          environment: production
          __path__: /var/log/algeriatrade/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            timestamp: timestamp
            service: service
            requestId: request_id
      - timestamp:
          source: timestamp
          format: RFC3339
      - labels:
          level:
          service:

  # Nginx Access Logs
  - job_name: nginx-access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          type: access
          __path__: /var/log/nginx/access.log
    pipeline_stages:
      - regex:
          expression: '^(?P<remote_addr>[\w\.]+) - (?P<remote_user>[^ ]*) \[(?P<time_local>[^\]]+)\] "(?P<method>\w+)(?P<path>[^\"]*).*" (?P<status>\d{3}) (?P<body_sent>\d+) "(?P<referer>[^\"]*)" "(?P<user_agent>[^\"]*)"'

  # Nginx Error Logs
  - job_name: nginx-error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          type: error
          __path__: /var/log/nginx/error.log

  # Docker Container Logs
  - job_name: docker-containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'

  # System Logs (for infrastructure issues)
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: system
          __path__: /var/log/syslog
```

### 4.3 Structured Logging Format

Ensure application logs follow this structure:

```typescript
// Logger utility for structured logging
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

// Example log output (JSON):
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Payment processing failed",
  "service": "payment-satim",
  "requestId": "req_abc123",
  "userId": "user_xyz789",
  "endpoint": "/api/payments/satim/process",
  "method": "POST",
  "statusCode": 500,
  "duration": 2345,
  "error": {
    "name": "SATIMConnectionError",
    "message": "Timeout connecting to CIB gateway"
  },
  "metadata": {
    "transactionId": "txn_456",
    "amount": 150000,
    "currency": "DZD"
  }
}
```

### 4.4 Useful Loki Queries

```logql
# All errors in last hour
{job="algeriatrade-app"} |= "ERROR" | line_format "{{.message}}"

# Errors by service
sum by (service) (count_over_time({job="algeriatrade-app", level="error"}[1h]))

# 5xx errors from nginx
{job="nginx", type="access"} |~ "5\\d\\d" | json | status >= 500

# Slow requests (>2s)
{job="algeriatrade-app"} | json | duration > 2000

# Payment errors
{job="algeriatrade-app"} |= "payment" |= "error" |="failed"

# Authentication failures
{job="algeriatrade-app"} |= "401" or |= "unauthorized" or |= "forbidden"

# WebRTC connection issues
{job="algeriatrade-app", service=~"webrtc.*"} |= "error" or |= "disconnect"

# ERP sync failures
{job="algeriatrade-app", service="erp-sync"} |= "error" or |= "failed"

# Error rate calculation (errors / total * 100)
(
  sum(count_over_time({level="error"}[5m])) 
  / 
  sum(count_over_time({}[5m])) 
) * 100

# Top error messages
topk(10, sum by (message) (count_over_time({level="error"}[1h])))
```

---

## 5. AlertManager Rules

### 5.1 AlertManager Configuration

Create `/etc/alertmanager/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@algeriatrade.dz'
  smtp_auth_username: 'alerts@algeriatrade.dz'
  smtp_auth_password: '${SMTP_PASSWORD}'
  slack_api_url: '${SLACK_WEBHOOK_URL}'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    # Critical alerts - immediate page
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      group_wait: 10s
      repeat_interval: 1m
      continue: true
    
    # High severity alerts
    - match:
        severity: high
      receiver: 'slack-high'
      group_wait: 30s
      repeat_interval: 15m
      continue: true
    
    # Warning alerts
    - match:
        severity: warning
      receiver: 'slack-warning'
      repeat_interval: 1h

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'ops-team@algeriatrade.dz'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - routing_key: '${PAGERDUTY_INTEGRATION_KEY}'
        severity: critical
        description: '{{ .CommonAnnotations.summary }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
          resolved: '{{ template "pagerduty.default.instances" .Alerts.Resolved }}'

  - name: 'slack-high'
    slack_configs:
      - channel: '#incidents-high'
        color: danger
        title: '🚨 [HIGH] {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        actions:
          - type: button
            text: 'Runbook'
            url: '{{ (index .Alerts 0).Annotations.runbook_url }}'
          - type: button
            text: 'Dashboard'
            url: 'https://grafana.algeriatrade.dz/d/{{ (index .Alerts 0).Labels.dashboard_uid }}'

  - name: 'slack-warning'
    slack_configs:
      - channel: '#ops-alerts'
        color: warning
        title: '⚠️ [WARNING] {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

### 5.2 Prometheus Alert Rules

Create `/etc/prometheus/rules/algeriatrade-alerts.yml`:

```yaml
groups:
  # ========================================
  # ALERT GROUP: Payment Systems (CRITICAL)
  # ========================================
  - name: payment_alerts
    rules:
      # Payment success rate drops below threshold
      - alert: PaymentSuccessRateLow
        expr: |
          (
            sum(rate(algeriatrade_payment_transactions_total{status="success"}[5m]))
            /
            sum(rate(algeriatrade_payment_transactions_total[5m]))
          ) * 100 < 95
        for: 2m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: Payment success rate below 95%
          description: >
            Payment success rate is {{ $value | humanizePercentage }} 
            over the last 5 minutes. Normal is >98%.
          runbook_url: https://docs.algeriatrade.dz/runbooks/payment-low-success-rate

      # SATIM specifically failing
      - alert: SATIMPaymentFailure
        expr: |
          sum(rate(algeriatrade_payment_transactions_total{provider="satim", status="failed"}[5m]))
          > 5
        for: 1m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: Multiple SATIM payment failures detected
          description: >
            {{ $value }} SATIM payment(s) failed in the last 5 minutes.
            Check CIB gateway connectivity.
          runbook_url: https://docs.algeriatrade.dz/runbooks/satim-failure

      # Stripe webhook not received
      - alert: StripeWebhookStale
        expr: |
          time() - max(algeriatrade_stripe_webhook_received_timestamp) > 300
        for: 5m
        labels:
          severity: high
          team: payments
        annotations:
          summary: No Stripe webhooks received in 5 minutes
          description: >
            Last Stripe webhook was received more than 5 minutes ago.
            Possible connectivity issue.

      # Crypto transaction stuck pending
      - alert: CryptoTransactionStuck
        expr: |
          sum(algeriatrade_crypto_transactions_pending{age_minutes > 60}) > 10
        for: 10m
        labels:
          severity: warning
          team: treasury
        annotations:
          summary: Multiple crypto transactions pending > 1 hour
          description: >
            {{ $value }} crypto transactions have been pending for over an hour.

  # ========================================
  # ALERT GROUP: Application Health
  # ========================================
  - name: application_health
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(algeriatrade_http_requests_total{status_code=~"5.."}[5m]))
            /
            sum(rate(algeriatrade_http_requests_total[5m]))
          ) * 100 > 1
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: Error rate exceeds 1%
          description: >
            Error rate is {{ $value | humanizePercentage }} (threshold: 1%).
            Immediate investigation required.

      # API latency too high
      - alert: APILatencyHigh
        expr: |
          histogram_quantile(0.99, 
            sum(rate(algeriatrade_http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 5m
        labels:
          severity: high
          team: platform
        annotations:
          summary: P99 API latency above 2 seconds
          description: >
            P99 latency is {{ $value | humanizeDuration }} (threshold: 2s).

      # 5xx errors spike
      - alert: High5xxErrors
        expr: |
          sum(rate(algeriatrade_http_requests_total{status_code=~"5.."}[5m])) > 10
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: High rate of 5xx errors
          description: >
            {{ $value | humanize }} 5xx errors per second.

  # ========================================
  # ALERT GROUP: Infrastructure
  # ========================================
  - name: infrastructure_alerts
    rules:
      # Database connections high
      - alert: DatabaseConnectionsHigh
        expr: |
          pg_stat_activity_count / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
          team: database
        annotations:
          summary: Database connections above 80%
          description: >
            Database connections at {{ $value | humanizePercentage }} of maximum.

      # Redis memory high
      - alert: RedisMemoryHigh
        expr: |
          redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: Redis memory usage above 90%
          description: >
            Redis using {{ $value | humanizePercentage }} of allocated memory.

      # Disk space running low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} 
           / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
        for: 10m
        labels:
          severity: warning
          team: ops
        annotations:
          summary: Disk space below 15%
          description: >
            Root filesystem has {{ $value | humanizePercentage }} free space.

      # Disk space critical
      - alert: DiskSpaceCritical
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} 
           / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 5
        for: 5m
        labels:
          severity: critical
          team: ops
        annotations:
          summary: Disk space critically low (<5%)
          description: >
            Only {{ $value | humanizePercentage }} disk space remaining!

      # Container OOM kills
      - alert: ContainerOOMKilled
        expr: |
          increase(container_oom_events[1h]) > 0
        for: 0m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: Container experienced OOM kill
          description: >
            Container {{ $labels.container }} was OOM killed.

      # Instance down
      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          team: ops
        annotations:
          summary: Instance {{ $labels.instance }} is down
          description: >
            {{ $labels.instance }} of job {{ $labels.job }} has been unreachable.

  # ========================================
  # ALERT GROUP: Business Logic
  # ========================================
  - name: business_alerts
    rules:
      # ERP sync failing repeatedly
      - alert: ERPSyncFailing
        expr: |
          sum(rate(algeriatrade_erp_sync_operations_total{status="failed"}[1h])) 
          > 10
        for: 15m
        labels:
          severity: high
          team: integrations
        annotations:
          summary: ERP sync experiencing repeated failures
          description: >
            {{ $value }} ERP sync operations failed in the last hour.

      # Invoice generation backlog
      - alert: InvoiceBacklogHigh
        expr: |
          algeriatrade_job_queue_depth{queue_name="invoices"} > 100
        for: 30m
        labels:
          severity: warning
          team: billing
        annotations:
          summary: Invoice generation backlog growing
          description: >
            {{ $value }} invoices waiting to be generated.

      # WebSocket connections unusual drop
      - alert: WebSocketConnectionsDrop
        expr: |
          (
            algeriatrade_websocket_connections_active{type="webrtc"}
            - algeriatrade_websocket_connections_active{type="webrtc"} offset 5m
          ) / 
          algeriatrade_websocket_connections_active{type="webrtc"} offset 5m * 100 < -50
        for: 2m
        labels:
          severity: warning
          team: realtime
        annotations:
          summary: WebRTC connections dropped significantly
          description: >
            Active WebRTC connections dropped by more than 50%.

      # AR model loading slow
      - alert: ARModelLoadSlow
        expr: |
          histogram_quantile(0.95, 
            sum(rate(algeriatrade_ar_model_load_duration_seconds_bucket[10m])) by (le)
          ) > 5
        for: 10m
        labels:
          severity: warning
          team: ar
        annotations:
          summary: AR model P95 load time above 5 seconds
          description: >
            AR models taking {{ $value | humanizeDuration }} to load on average.
```

---

## 6. Uptime Monitoring

### 6.1 UptimeRobot Configuration

Configure monitors for critical endpoints:

| Monitor Name | Type | URL | Frequency |
|--------------|------|-----|----------|
| AlgeriaTrade Main Site | HTTP(S) | https://algeriatrade.dz | 1 minute |
| API Health Endpoint | HTTP(S) | https://algeriatrade.dz/api/health | 1 minute |
| Payment Status | HTTP(S) | https://algeriatrade.dz/api/payments/status | 1 minute |
| CRM API | HTTP(S) | https://algeriatrade.dz/api/crm/pipelines | 5 minutes |
| ERP Sync Status | HTTP(S) | https://algeriatrade.dz/api/erp/status | 5 minutes |
| AR Model CDN | HTTP(S) | https://cdn.algeriatrade.dz/ar/test.glb | 5 minutes |
| WebRTC Signaling | Port | signaling.algeriatrade.dz:3002 | 1 minute |

**UptimeRobot API Setup:**

```bash
# Add monitors via API
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -d "api_key=$UPTIMEROBOT_API_KEY" \
  -d "friendly_name=AlgeriaTrade Main Site" \
  -d "url=https://algeriatrade.dz" \
  -d "type=1" \
  -d "sub_type=1" \
  -d "interval=60"
```

### 6.2 Pingdom Alternative

```json
{
  "name": "AlgeriaTrade Production",
  "type": "http",
  "host": "algeriatrade.dz",
  "url": "/api/health",
  "encryption": true,
  "should_contain": "\"status\":\"ok\"",
  "interval": 1,
  "alert_contacts": ["SLACK_WEBHOOK_ID", "PAGERDUTY_ID"],
  "regions": ["EU-Africa"]
}
```

### 6.3 Status Page Integration

Deploy a public status page at `https://status.algeriatrade.dz`:

```yaml
# Status page configuration
site:
  title: "AlgeriaTrade.dz System Status"
  logo: "https://algeriatrade.dz/logo.svg"
  timezone: "Africa/Algiers"

monitors:
  - name: "Website & Applications"
    description: "Main marketplace platform"
    components:
      - name: "Web Application"
        id: main-site
      - name: "API Services"
        id: api-services
      - name: "Buyer Dashboard"
        id: buyer-dashboard
      - name: "Seller Dashboard"
        id: seller-dashboard

  - name: "Payment Systems"
    description: "Payment processing services"
    components:
      - name: "SATIM / CIB"
        id: satim-payments
      - name: "Stripe"
        id: stripe-payments
      - name: "Crypto Payments"
        id: crypto-payments
      - name: "DPA (Bank Guarantee)"
        id: dpa-payments

  - name: "Integrations"
    description: "Third-party integrations"
    components:
      - name: "ERP Synchronization"
        id: erp-sync
      - name: "Video Calls (WebRTC)"
        id: webrtc-calls
      - name: "AR Showroom"
        id: ar-showroom

  - name: "Infrastructure"
    description: "Core infrastructure"
    components:
      - name: "Database"
        id: database
      - name: "Cache Layer (Redis)"
        id: redis-cache
      - name: "CDN"
        id: cdn
```

---

## 7. Error Tracking (Sentry)

### 7.1 Sentry Configuration

Install Sentry SDK:

```bash
bun add @sentry/nextjs @sentry/profiler
```

Initialize Sentry (`sentry.client.config.ts` and `sentry.server.config.ts`):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  enableTracing: true,
  tracesSampleRate: 0.1, // Sample 10% of transactions for profiling

  // Environment info
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Performance monitoring
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions

  // Filter noise
  ignoreErrors: [
    // Known non-critical errors
    "Network request failed",
    "Failed to fetch dynamically imported module",
    "Loading chunk",
    "Loading CSS chunk",
    "Non-Error promise rejection captured",
  ],

  // Tag events for better filtering
  initialScope: {
    tags: {
      platform: "algeriatrade-dz",
      phase: "8",
    },
  },

  // Before send hook for enrichment
  beforeSend(event) {
    // Add custom context
    if (event.user) {
      event.context = {
        ...event.context,
        feature_flags: getActiveFeatureFlags(),
      };
    }

    // Sanitize sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies.session_token;
      delete event.request.cookies.auth_token;
    }

    return event;
  },

  // Integrations
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### 7.2 Custom Error Context

Add business context to errors:

```typescript
// src/lib/error-context.ts
import * as Sentry from "@sentry/nextjs";

export function setPaymentContext(paymentData: {
  provider: string;
  amount: number;
  currency: string;
  orderId: string;
}) {
  Sentry.setContext("payment", paymentData);
}

export function setUserContext(user: {
  id: string;
  role: string;
  companyId?: string;
  plan?: string;
}) {
  Sentry.setUser({
    id: user.id,
    segment: user.role,
    company: user.companyId,
    plan: user.plan,
  });
}

export function setFeatureContext(feature: string, action: string) {
  Sentry.setTag("feature", feature);
  Sentry.setTag("action", action);
}

export function capturePaymentError(error: Error, context: {
  provider: string;
  transactionId: string;
  stage: 'initiation' | 'processing' | 'callback' | 'verification';
}) {
  Sentry.captureException(error, {
    tags: {
      feature: "payments",
      provider: context.provider,
      stage: context.stage,
    },
    extra: {
      transactionId: context.transactionId,
    },
    fingerprint: [
      "payment-error",
      context.provider,
      context.stage,
      error.message.slice(0, 50),
    ],
  });
}

export function captureERPError(error: Error, context: {
  integrationType: 'sap' | 'odoo' | 'rest';
  operation: string;
  entityType: string;
}) {
  Sentry.captureException(error, {
    tags: {
      feature: "erp-sync",
      integration: context.integrationType,
      operation: context.operation,
    },
    extra: {
      entityType: context.entityType,
    },
    fingerprint: [
      "erp-error",
      context.integrationType,
      context.operation,
    ],
  });
}
```

### 7.3 Sentry Alerts Configuration

Set up these alerts in Sentry:

| Alert Name | Condition | Severity | Notification |
|------------|-----------|----------|--------------|
| New Critical Issue | Issue level: fatal + first seen | Critical | PagerDuty + Slack |
| Error Rate Spike | > 2x baseline for 10 min | High | Slack #incidents |
| Payment Error Group | tag:feature=payments + count > 5/min | Critical | PagerDuty |
| ERP Sync Failures | tag:feature=erp-sync + count > 10/hr | High | Slack #integrations |
| Performance Regression | p95 > 2x baseline | Medium | Email digest |
| Auth Failures Spike | 401 errors > 5x baseline | Medium | Security review |

---

## 8. Alert Thresholds Reference

### Complete Threshold Quick Reference

| Metric | Warning | Critical | Check Interval | For Duration |
|--------|---------|----------|----------------|--------------|
| **Payment Success Rate** | < 98% | < 95% | 1 min | 2 min |
| **API Response Time (p95)** | > 500ms | > 2s | 1 min | 5 min |
| **API Response Time (p99)** | > 1s | > 3s | 1 min | 5 min |
| **Error Rate** | > 0.5% | > 1% | 1 min | 5 min |
| **5xx Error Rate** | > 0.1% | > 1% | 1 min | 2 min |
| **Database Connections** | > 70% | > 85% | 30 sec | 5 min |
| **Redis Memory Usage** | > 80% | > 92% | 15 sec | 5 min |
| **Disk Space** | > 80% | > 92% | 1 min | 10 min |
| **CPU Usage** | > 70% | > 90% | 15 sec | 5 min |
| **Memory Usage** | > 75% | > 90% | 15 sec | 5 min |
| **SATIM Failure Rate** | > 2% | > 5% | 1 min | 1 min |
| **Stripe Webhook Gap** | > 2 min | > 5 min | 30 sec | 5 min |
| **Crypto Pending TX** | > 5 | > 20 | 5 min | 15 min |
| **ERP Sync Failures** | > 5/hr | > 15/hr | 5 min | 15 min |
| **Invoice Backlog** | > 50 | > 200 | 5 min | 30 min |
| **AR Model Load (p95)** | > 3s | > 8s | 1 min | 10 min |
| **WebSocket Drop** | > 20% | > 50% | 30 sec | 2 min |
| **SSL Certificate Expiry** | < 14 days | < 7 days | 1 hour | N/A |

### Alert Priority Matrix

```
                    IMPACT
                    Low    Med    High   Critical
AVAILABILITY  Low    P4     P3     P2      P1
              Med    P3     P2     P1      P1
              High   P2     P1     P1      P1
              Crit   P1     P1     P1      P1
```

---

## 9. Quick Start Commands

### Deploy Full Monitoring Stack (Docker Compose)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./config/alertmanager:/etc/alertmanager
      - alertmanager-data:/alertmanager
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.2.2
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./dashboards:/etc/grafana/provisioning/dashboards
      - ./datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
      - loki
    networks:
      - monitoring

  loki:
    image: grafana/loki:2.9.2
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./config/loki:/etc/loki
      - loki-data:/loki
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:2.9.2
    container_name: promtail
    volumes:
      - ./config/promtail:/etc/promtail
      - /var/log:/var/log:ro
      - /var/run/docker.sock:/var/run.docker.sock:ro
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--rootfs=/rootfs'
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
  alertmanager-data:
  grafana-data:
  loki-data:
```

### Start Monitoring Stack

```bash
# Create directories
mkdir -p config/{prometheus,alertmanager,loki,promtail} dashboards datasources logs

# Copy configurations (from this guide)
# Then start:
docker compose -f docker-compose.monitoring.yml up -d

# Verify all services are running
docker compose -f docker-compose.monitoring.yml ps

# Access dashboards:
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093
```

### Test Alerts

```bash
# Trigger test alert via Prometheus API
curl -X POST http://localhost:9090/api/v1/alerts \
  -d '{
    "alerts": [
      {
        "labels": {
          "alertname": "TestAlert",
          "severity": "warning",
          "instance": "test"
        },
        "annotations": {
          "description": "This is a test alert"
        }
      }
    ]
  }'

# Verify AlertManager received it
curl http://localhost:9093/api/v2/alerts | jq
```

---

*This guide should be reviewed quarterly and updated as the platform evolves.*
