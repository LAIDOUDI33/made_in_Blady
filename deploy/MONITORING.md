# Monitoring Setup Guide - AlgeriaTrade.dz B2B Marketplace

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prometheus Setup](#prometheus-setup)
4. [Grafana Dashboard Configuration](#grafana-dashboard-configuration)
5. [Sentry Error Tracking](#sentry-error-tracking)
6. [Uptime Monitoring](#uptime-monitoring)
7. [Log Aggregation](#log-aggregation)
8. [Alerting Configuration](#alerting-configuration)
9. [Custom Metrics](#custom-metrics)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers setting up comprehensive monitoring for the AlgeriaTrade.dz B2B marketplace platform. A robust monitoring system is essential for:

- **Reliability**: Detect and respond to issues before they impact users
- **Performance**: Identify bottlenecks and optimization opportunities
- **Security**: Detect anomalies and potential security incidents
- **Business Intelligence**: Track KPIs and user behavior

### Key Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| Metrics Collection | System & application metrics | Prometheus |
| Visualization | Dashboards and alerts | Grafana |
| Error Tracking | Exception monitoring | Sentry |
| Uptime Monitoring | Availability tracking | UptimeRobot / Pingdom |
| Log Aggregation | Centralized logging | Loki / ELK Stack |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AlgeriaTrade.dz Monitoring                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │   Next.js   │    │  PostgreSQL │    │    Redis    │                │
│  │     App     │    │   Database  │    │     Cache   │                │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │
│         │                  │                   │                        │
│         ▼                  ▼                   ▼                        │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │                  Exporters / Agents                       │           │
│  │  ┌─────────┐  ┌─────────────┐  ┌───────────────────┐   │           │
│  │  │ Node.js │  │ PostgreSQL  │  │    Redis          │   │           │
│  │  │ Exporter│  │ Exporter    │  │    Exporter       │   │           │
│  │  └────┬────┘  └──────┬──────┘  └────────┬──────────┘   │           │
│  └───────┼──────────────┼─────────────────┼───────────────┘           │
│          ▼              ▼                 ▼                             │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │                     Prometheus                           │           │
│  │              (Time Series Database)                     │           │
│  └─────────────────────────┬───────────────────────────────┘           │
│                            │                                       │
│          ┌─────────────────┼─────────────────┐                     │
│          ▼                 ▼                 ▼                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │   Grafana   │   │ Alertmanager│   │    Loki     │               │
│  │ (Dashboards)│   │  (Alerts)   │   │   (Logs)    │               │
│  └─────────────┘   └─────────────┘   └─────────────┘               │
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐                                     │
│  │   Sentry    │   │ UptimeRobot │                                     │
│  │  (Errors)   │   │ (Uptime)    │                                     │
│  └─────────────┘   └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Prometheus Setup

### 1. Docker Compose Configuration

Add to your `docker-compose.yml` or create a separate monitoring compose file:

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: algeriatrade-prometheus
    restart: unless-stopped
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.2.0
    container_name: algeriatrade-grafana
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-changeme}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://grafana.algeriatrade.dz
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
    depends_on:
      - prometheus
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: algeriatrade-alertmanager
    restart: unless-stopped
    ports:
      - "127.0.0.1:9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/config.yml:ro
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=https://alertmanager.algeriatrade.dz'
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.6.1
    container_name: algeriatrade-node-exporter
    restart: unless-stopped
    ports:
      - "127.0.0.1:9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/:rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  postgres-exporter:
    image: prom/postgres_exporter:v0.12.0
    container_name: algeriatrade-postgres-exporter
    restart: unless-stopped
    ports:
      - "127.0.0.1:9187:9187"
    environment:
      DATA_SOURCE_NAME="postgresql://algeriatrade:${POSTGRES_PASSWORD}@postgres:5432/algeriatrade?sslmode=disable"
    depends_on:
      - postgres
    networks:
      - algeriatrade-internal
      - monitoring

  redis-exporter:
    image: oliver006/redis_exporter:v1.55.0
    container_name: algeriatrade-redis-exporter
    restart: unless-stopped
    ports:
      - "127.0.0.1:9121:9121"
    environment:
      - REDIS_ADDR=redis://:${REDIS_PASSWORD:-changeme}@redis:6379
    depends_on:
      - redis
    networks:
      - algeriatrade-internal
      - monitoring

  loki:
    image: grafana/loki:2.9.0
    container_name: algeriatrade-loki
    restart: unless-stopped
    ports:
      - "127.0.0.1:3100:3100"
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:2.9.0
    container_name: algeriatrade-promtail
    restart: unless-stopped
    volumes:
      - /var/log:/var/log:ro
      - ./monitoring/promtail-config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
  loki-data:

networks:
  monitoring:
    driver: bridge
  algeriatrade-internal:
    external: true
```

### 2. Prometheus Configuration

Create `monitoring/prometheus.yml`:

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
            - alertmanager:9093

# Rule files for recording and alerting rules
rule_files:
  - 'alerts/*.yml'

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (Server Metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    metrics_path: /metrics
    scrape_interval: 15s

  # AlgeriaTrade Application (Custom Metrics)
  - job_name: 'algeriatrade-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/admin/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

  # PostgreSQL Exporter
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 15s

  # Nginx (if using nginx-vts-exporter)
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    scrape_interval: 15s

  # Docker Container Metrics (optional, using cAdvisor)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
    scrape_interval: 15s
```

### 3. Alert Rules

Create `monitoring/alerts/rules.yml`:

```yaml
groups:
  - name: algeriatrade-alerts
    rules:
      # Application Health
      - alert: ApplicationDown
        expr: up{job="algeriatrade-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "AlgeriaTrade application is down"
          description: "Application {{ $labels.instance }} has been down for more than 1 minute."

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "P95 latency is {{ $value }}s (threshold: 2s)"

      # Infrastructure
      - name: infrastructure-alerts
        rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"

      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}%"

      - alert: DiskSpaceRunningLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 20
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Disk space running low"
          description: "Disk usage is above 80% on {{ $labels.instance }}"

      # Database Alerts
      - name: database-alerts
        rules:
      - alert: PostgreSQLDown
        expr: up{job="postgresql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL database is not responding."

      - alert: PostgreSQLHighConnections
        expr: pg_stat_activity_count > 150
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of PostgreSQL connections"
          description: "{{ $value }} active connections (threshold: 150)"

      - alert: PostgreSQLSlowQueries
        expr: rate(pg_stat_statements_calls_total{latency > 1000}[5m]) > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High number of slow queries"
          description: "{{ $value }} slow queries per second"

      # Redis Alerts
      - name: redis-alerts
        rules:
      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis is down"
          description: "Redis cache is not responding."

      - alert: RedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"
          description: "Redis is using {{ $value }}% of max memory"
```

---

## Grafana Dashboard Configuration

### 1. Provisioning Dashboards

Create `monitoring/grafana/provisioning/datasources/datasource.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false
```

Create `monitoring/grafana/provisioning/dashboards/dashboard.yml`:

```yaml
apiVersion: 1

providers:
  - name 'AlgeriaTrade Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: true
    editable: true
    options:
      path: /var/lib/grafana/dashboards
```

### 2. Sample Dashboard JSON

Import this dashboard or create it in Grafana UI. Key panels to include:

**Panel 1: Request Rate**
```json
{
  "title": "Request Rate",
  "type": "timeseries",
  "targets": [
    {
      "expr": "sum(rate(http_requests_total[5m])) by (method, route)",
      "legendFormat": "{{method}} {{route}}"
    }
  ]
}
```

**Panel 2: Error Rate**
```json
{
  "title": "Error Rate",
  "type": "gauge",
  "targets": [
    {
      "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
      "legendFormat": "Error %"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "thresholds": {
        "steps": [
          {"color": "green", "value": 0},
          {"color": "yellow", "value": 1},
          {"color": "red", "value": 5}
        ]
      },
      "unit": "percent",
      "max": 100,
      "min": 0
    }
  }
}
```

**Panel 3: Response Time (P50, P95, P99)**
```json
{
  "title": "Response Time Percentiles",
  "type": "timeseries",
  "targets": [
    {
      "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
      "legendFormat": "P50"
    },
    {
      "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
      "legendFormat": "P95"
    },
    {
      "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
      "legendFormat": "P99"
    }
  ]
}
```

**Panel 4: Active Users**
```json
{
  "title": "Active Users (Real-time)",
  "type": "stat",
  "targets": [
    {
      "expr": "active_users_total",
      "legendFormat": "Active Users"
    }
  ]
}
```

**Panel 5: System Resources**
```json
{
  "title": "System Resources",
  "type": "row",
  "panels": [
    {
      "title": "CPU Usage",
      "type": "gauge",
      "targets": [{"expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"}]
    },
    {
      "title": "Memory Usage",
      "type": "gauge",
      "targets": [{"expr": "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100"}]
    },
    {
      "title": "Disk Usage",
      "type": "gauge",
      "targets": [{"expr": "(1 - node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpath=\"/\"}) * 100"}]
    }
  ]
}
```

### 3. Business Metrics Dashboard

For a B2B marketplace, track these business KPIs:

| Metric | Description | PromQL Query |
|--------|-------------|--------------|
| New Registrations | Daily new user signups | `increase(user_registrations_total[24h])` |
| Active Companies | Companies with recent activity | `companies_active_total` |
| Products Listed | Total products on platform | `products_total` |
| RFQs Created | Requests for quotes | `increase(rfqs_created_total[24h])` |
| Negotiations Active | Ongoing negotiations | `negotiations_active_total` |
| Orders Completed | Successful orders | `increase(orders_completed_total[24h])` |
| Revenue (DZD) | Daily revenue | `increase(revenue_total_dzd[24h])` |
| Payment Success Rate | Successful payments / total | `rate(payments_success_total[1h]) / rate(payments_total[1h])` |

---

## Sentry Error Tracking

### 1. Setup

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (choose "Next.js")
3. Get your DSN

### 2. Environment Variables

Add to your `.env`:

```env
SENTRY_DSN=https://example@sentry.io/PROJECT_ID
NEXT_PUBLIC_SENTRY_DSN=https://public@sentry.io/PROJECT_ID
SENTRY_ENVIRONMENT=production
```

### 3. Integration with Next.js

The project already includes Sentry integration. Ensure these files are configured:

**`src/lib/sentry/client.ts`:**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  
  // Performance monitoring
  tracesSampleRate: 0.2,  // Sample 20% of transactions
  
  // Session replay (for debugging)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Ignore common noise
  ignoreErrors: [
    "Network Error",
    "Failed to fetch",
    "Non-Error promise rejection captured",
  ],
  
  // Add custom tags
  initialScope: {
    tags: {
      platform: "algeriatrade",
      region: "dz",
    },
  },
});

export default Sentry;
```

**`src/lib/sentry/server.ts`:**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});

export default Sentry;
```

**`sentry.client.config.ts` (root):**

```typescript
// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // ...
  
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also be attached to your source maps
});
```

**`sentry.server.config.ts` (root):**

```typescript
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever a server-side operation occurs.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // ...
});
```

**`sentry.edge.config.ts` (root):**

```typescript
// This file configures the initialization of Sentry for edge runtimes.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // ...
});
```

### 4. Custom Error Context

Add business context to errors:

```typescript
import * as Sentry from "@sentry/nextjs";

// In your API routes or error handlers
Sentry.captureException(error, {
  extra: {
    userId: session?.user?.id,
    company: company?.slug,
    endpoint: request.url,
    method: request.method,
  },
  tags: {
    feature: "payments",  // e.g., payments, auth, products
    region: "DZ",
  },
});
```

---

## Uptime Monitoring

### Option 1: UptimeRobot (Recommended)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:

| Monitor Type | URL | Frequency | Alert Threshold |
|--------------|-----|-----------|-----------------|
| HTTP(S) | https://algeriatrade.dz | 1 min | 2 failures |
| HTTP(S) | https://api.algeriatrade.dz/api/health | 1 min | 2 failures |
| Keyword | https://algeriatrade.dz (check for "AlgeriaTrade") | 5 min | 3 failures |
| Port | your-server-ip:443 | 1 min | 2 failures |

3. Configure alerts:
   - Email: ops@algeriatrade.dz
   - Slack webhook
   - SMS for critical alerts

### Option 2: Pingdom

Similar setup to UptimeRobot with additional features:
- Transaction monitoring (full user journeys)
- Real browser checks
- Multi-region checking

### Option 3: Self-hosted (Uptime Kuma)

For full control, deploy Uptime Kuma:

```yaml
# Add to docker-compose
uptime-kuma:
  image: louislam/uptime-kuma:1
  container_name: algeriatrade-uptime-kuma
  ports:
    - "127.0.0.1:3002:3001"
  volumes:
    - uptime-kuma-data:/app/data
  restart: unless-stopped
```

Access at `http://your-server:3002`

---

## Log Aggregation

### Option 1: Grafana Loki (Recommended)

Already included in the monitoring stack above.

**Promtail Configuration (`monitoring/promtail-config.yml`):**

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Nginx logs
  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log

  # Docker logs
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'

  # Application logs
  - job_name: algeriatrade
    static_configs:
      - targets:
          - localhost
        labels:
          job: application
          __path__: /opt/algeriatrade/logs/*.log
```

### Option 2: ELK Stack (Elasticsearch, Logstash, Kibana)

For advanced log analytics:

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "127.0.0.1:9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  kibana:
    image: kibana:8.10.0
    ports:
      - "127.0.0.1:5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  logstash:
    image: logstash:8.10.0
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline:ro
      - /var/log:/var/log:ro
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

volumes:
  es-data:
```

### LogQL Queries (for Loki)

```logql
# All errors in last hour
{job="application"} |= "error" | logfmt | line_format "{{.message}}"

# 5xx HTTP errors
{job="nginx"} | json | status >= 500

# Slow requests (>2s)
{job="application"} | pattern `<_> took <duration>ms` | duration > 2000

# Authentication failures
{job="application"} |= "authentication" |= "failed" | logfmt

# Payment-related logs
{job="application"} |= "payment" | logfmt | status != "success"
```

---

## Alerting Configuration

### Alertmanager Configuration

Create `monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@algeriatrade.dz'
  smtp_auth_username: 'alerts@algeriatrade.dz'
  smtp_auth_password: '${SMTP_PASSWORD}'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default-receiver'
  routes:
    # Critical alerts go to immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      repeat_interval: 1h
      
    # Warning alerts during business hours only
    - match:
        severity: warning
      receiver: 'warning-alerts'
      active_time_intervals:
        - business-hours

inhibitors:
  - source_match:
      severity: 'critical'
      target_match:
        severity: 'warning'
      equal: ['alertname', 'instance']

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'ops@algeriatrade.dz'

  - name: 'critical-alerts'
    email_configs:
      - to: 'ops@algeriatrade.dz'
        send_resolved: true
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#incidents'
        send_resolved: true
        title: '🚨 [{{ .Status }}] {{ .Labels.alertname }}'
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Instance:* {{ .Labels.instance }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}

  - name: 'warning-alerts'
    email_configs:
      - to: 'ops@algeriatrade.dz'
        send_resolved: true

time_intervals:
  - name: business-hours
    time_intervals:
      - weekdays: ['monday:tuesday:wednesday:thursday:friday']
        start_time: '08:00'
        end_time: '18:00'
        location: Africa/Algiers
```

---

## Custom Metrics

### Application Metrics Endpoint

Your Next.js app should expose metrics at `/api/admin/metrics`. Here's how to implement:

**`src/app/api/admin/metrics/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Initialize metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
});

const activeNegotiations = new Gauge({
  name: 'negotiations_active_total',
  help: 'Number of active negotiations',
});

// Collect default system metrics
collectDefaultMetrics({ register });

export async function GET() {
  try {
    // Update business metrics
    await updateBusinessMetrics();
    
    // Return metrics in Prometheus format
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
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

async function updateBusinessMetrics() {
  // Update active users count
  const userCount = await prisma.session.count({
    where: { expires: { gt: new Date() } },
  });
  activeUsers.set(userCount);
  
  // Update active negotiations
  const negotiationCount = await prisma.negotiation.count({
    where: { status: 'ACTIVE' },
  });
  activeNegotiations.set(negotiationCount);
}

// Middleware to record request metrics
export function recordMetrics(method: string, route: string, status: number, duration: number) {
  httpRequestsTotal.inc({ method, route, status: String(status) });
  httpRequestDuration.observe({ method, route, status: String(status) }, duration / 1000);
}

export { httpRequestDuration, httpRequestsTotal };
```

### Using the Metrics Middleware

In your middleware or API routes:

```typescript
import { recordMetrics } from '@/app/api/admin/metrics/route';

// Wrap your handler
export async function GET(request: Request) {
  const start = Date.now();
  const method = request.method;
  const route = '/api/products';
  
  try {
    // Your logic here...
    const data = await getProducts();
    
    const duration = Date.now() - start;
    recordMetrics(method, route, 200, duration);
    
    return NextResponse.json(data);
  } catch (error) {
    const duration = Date.now() - start;
    recordMetrics(method, route, 500, duration);
    
    throw error;
  }
}
```

---

## Troubleshooting

### Common Issues

**Prometheus not scraping targets:**
```bash
# Check target status
curl http://localhost:9090/api/v1/targets | jq

# Check Prometheus logs
docker compose logs prometheus
```

**Grafana not showing data:**
1. Verify datasource is connected (Configuration > Data Sources)
2. Check time range selector
3. Validate PromQL query in Explore tab

**Sentry not capturing errors:**
1. Verify DSN is correct
2. Check browser console for SDK errors
3. Test with: `throw new TestError('Sentry test')`

**High memory usage in Prometheus:**
```yaml
# In prometheus.yml, add retention settings
storage:
  tsdb:
    retention.size: 10GB  # Max storage size
```

### Useful Commands

```bash
# View all containers status
docker compose ps

# View application logs
docker compose logs -f app --tail=100

# View Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Trigger test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[{"labels":{"alertname":"TestAlert","severity":"warning"},"annotations":{"description":"Test alert from CLI"}}]'

# Backup Grafana dashboards
docker exec algeriatrade-grafana tar czf - /var/lib/grafana/db > grafana-backup.tar.gz

# Clean old Prometheus data
curl -X POST -g 'http://localhost:9090/api/v1/admin/tsdb/delete_series?match[]={}'

# Check disk usage by service
docker system df -v
```

### Monitoring Checklist

- [ ] Prometheus collecting from all exporters
- [ ] Grafana dashboards created and shared
- [ ] Alertmanager routing configured
- [ ] Slack/email notifications working
- [ ] Sentry capturing client and server errors
- [ ] Uptime monitors configured
- [ ] Logs flowing to Loki/ELK
- [ ] Alert thresholds tuned (reduce noise)
- [ ] On-call rotation established
- [ ] Runbook documented for each alert type
- [ ] Monthly review of dashboards and alerts

---

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Best Practices for Alerting](https://www.robustperception.io/on-call-notifications/)
- [Grafana Dashboard Gallery](https://grafana.com/grafana/dashboards/)

---

*Last Updated: $(date +%Y-%m-%d)*
*Version: 1.0.0*
*Maintained by: AlgeriaTrade.dz DevOps Team*
