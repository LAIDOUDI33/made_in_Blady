#!/bin/bash
# =============================================================================
# Production Monitoring Setup Script
# =============================================================================
# AlgeriaTrade.dz B2B Platform - Production Monitoring Configuration
#
# This script sets up comprehensive monitoring for production:
#   - Prometheus metrics scraping
#   - Grafana dashboard import
#   - Alert rules definition
#   - Log aggregation (Loki)
#   - Uptime monitoring configuration
#
# Usage:
#   chmod +x scripts/setup-production-monitoring.sh
#   ./scripts/setup-production-monitoring.sh [--install|--configure|--alerts]
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - Access to production server
#   - Grafana admin credentials
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
GRAFANA_ADMIN_USER="${GRAFANA_ADMIN_USER:-admin}"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"
GRAFANA_PORT="${GRAFANA_PORT:-3001}"
LOKI_PORT="${LOKI_PORT:-3100}"

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

create_monitoring_docker_compose() {
    log_info "Creating monitoring docker-compose configuration..."
    
    cat > "$PROJECT_ROOT/monitoring/docker-compose.monitoring.yml" << 'EOF'
# =============================================================================
# Monitoring Stack - Docker Compose
# =============================================================================
# Services: Prometheus, Grafana, Loki, Promtail, Node Exporter
# =============================================================================

version: '3.8'

services:

  # -------------------------------------------------------------------------
  # Prometheus - Metrics Collection & Alerting
  # -------------------------------------------------------------------------
  prometheus:
    image: prom/prometheus:v2.49.0
    container_name: algeriatrade-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring-network

  # -------------------------------------------------------------------------
  # Grafana - Visualization Dashboards
  # -------------------------------------------------------------------------
  grafana:
    image: grafana/grafana:10.2.2
    container_name: algeriatrade-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-changeme}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=${GRAFANA_DOMAIN:-monitor.algeriatrade.dz}
      - GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s/
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - GF_ALERTING_ENABLED=true
      - GF_UNIFIED_ALERTING_ENABLED=true
      - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    depends_on:
      - prometheus
      - loki
    networks:
      - monitoring-network

  # -------------------------------------------------------------------------
  # Loki - Log Aggregation System
  # -------------------------------------------------------------------------
  loki:
    image: grafana/loki:2.9.0
    container_name: algeriatrade-loki
    restart: unless-stopped
    ports:
      - "3100:3100"
    volumes:
      - ./loki/config.yml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - monitoring-network

  # -------------------------------------------------------------------------
  # Promtail - Log Collector (sends logs to Loki)
  # -------------------------------------------------------------------------
  promtail:
    image: grafana/promtail:2.9.0
    container_name: algeriatrade-promtail
    restart: unless-stopped
    volumes:
      - /var/log:/var/log:ro
      - ./promtail/config.yml:/etc/promtail/config.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring-network

  # -------------------------------------------------------------------------
  # Node Exporter - System Metrics
  # -------------------------------------------------------------------------
  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: algeriatrade-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)'
    networks:
      - monitoring-network

  # -------------------------------------------------------------------------
  # cAdvisor - Container Metrics
  # -------------------------------------------------------------------------
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: algeriatrade-cadvisor
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - monitoring-network

  # -------------------------------------------------------------------------
  # Alertmanager - Alert Routing & Notification
  # -------------------------------------------------------------------------
  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: algeriatrade-alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    networks:
      - monitoring-network

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
  alertmanager-data:

networks:
  monitoring-network:
    driver: bridge
EOF

    log_success "Monitoring docker-compose created"
}

create_prometheus_config() {
    log_info "Creating Prometheus configuration..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/prometheus"
    
    cat > "$PROJECT_ROOT/monitoring/prometheus/prometheus.yml" << 'EOF'
# =============================================================================
# Prometheus Configuration
# =============================================================================
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s
  external_labels:
    monitor: 'algeriatrade'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        targets:
          - alertmanager:9093

# Rule files for alerts
rule_files:
  - /etc/prometheus/alert_rules.yml

# Scrape configurations
scrape_configs:

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Next.js Application (custom metrics)
  - job_name: 'algeriatrade-app'
    scrape_interval: 15s
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['app:3000']
        labels:
          service: 'algeriatrade-app'
          environment: 'production'

  # Node Exporter (system metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          service: 'node-exporter'

  # cAdvisor (container metrics)
  - job_name: 'cadvisor'
    scrape_interval: 30s
    static_configs:
      - targets: ['cadvisor:8080']
        labels:
          service: 'cadvisor'

  # Nginx metrics (with nginx-prometheus-exporter)
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
        labels:
          service: 'nginx'

  # PostgreSQL exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          service: 'postgres'

  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
        labels:
          service: 'redis'
EOF

    log_success "Prometheus configuration created"
}

create_alert_rules() {
    log_info "Creating alert rules..."
    
    cat > "$PROJECT_ROOT/monitoring/prometheus/alert_rules.yml" << 'EOF'
# =============================================================================
# Alert Rules - AlgeriaTrade.dz
# =============================================================================
groups:
  - name: algeriatrade-application
    rules:
      # Application Health Alerts
      - alert: ApplicationDown
        expr: up{job="algeriatrade-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "AlgeriaTrade application is down"
          description: "Application {{ $labels.instance }} has been down for more than 1 minute."

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="algeriatrade-app"}[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s (> 1s threshold)"

      - alert: VeryHighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="algeriatrade-app"}[5m])) > 3
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Very high response time detected"
          description: "95th percentile response time is {{ $value }}s (> 3s threshold)"

      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5..", job="algeriatrade-app"}[5m]))
            /
            sum(rate(http_requests_total{job="algeriatrade-app"}[5m]))
          ) * 100 > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ printf "%.2f" $value }}% (> 1% threshold)"

      - alert: CriticalErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5..", job="algeriatrade-app"}[5m]))
            /
            sum(rate(http_requests_total{job="algeriatrade-app"}[5m]))
          ) * 100 > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical error rate detected"
          description: "Error rate is {{ printf "%.2f" $value }}% (> 5% threshold)"

  - name: infrastructure
    rules:
      # Server Resource Alerts
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is at {{ $value }}%"

      - alert: CriticalCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical CPU usage on {{ $labels.instance }}"
          description: "CPU usage is at {{ $value }}%"

      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is at {{ $value }}%"

      - alert: CriticalMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical memory usage on {{ $labels.instance }}"
          description: "Memory usage is at {{ $value }}%"

      - alert: DiskSpaceWarning
        expr: (1 - node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) * 100 > 80
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is at {{ $value }}% on {{ $labels.device }}"

      - alert: DiskSpaceCritical
        expr: (1 - node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) * 100 > 95
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Critical disk space on {{ $labels.instance }}"
          description: "Disk usage is at {{ $value }}% on {{ $labels.device }}"

  - name: database
    rules:
      # Database Alerts
      - alert: PostgresDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"
          description: "PostgreSQL instance {{ $labels.instance }} is not responding"

      - alert: HighDatabaseConnections
        expr: pg_stat_activity_count / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of PostgreSQL connections"
          description: "{{ $value }}% of max connections in use"

      - alert: SlowPostgresQueries
        expr: rate(pg_stat_statement_calls_total{calls>0}[5m]) > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow PostgreSQL queries detected"
          description: "Query rate exceeds 100 queries/sec"

      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis cache is down"
          description: "Redis instance {{ $labels.instance }} is not responding"

      - alert: HighRedisMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High Redis memory usage"
          description: "Redis memory usage at {{ $value }}%"

  - name: ssl_certificates
    rules:
      # SSL Certificate Expiry Alerts
      - alert: SSLCertExpiringSoon
        expr: (ssl_cert_not_after - time()) / 86400 < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "SSL certificate for {{ $labels.instance }} expires in {{ $value }} days"

      - alert: SSLCertExpired
        expr: (ssl_cert_not_after - time()) / 86400 < 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "SSL certificate has expired"
          description: "SSL certificate for {{ $labels.instance }} has expired!"
EOF

    log_success "Alert rules created"
}

create_grafana_dashboards() {
    log_info "Creating Grafana dashboard configurations..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/grafana/provisioning/datasources"
    mkdir -p "$PROJECT_ROOT/monitoring/grafana/provisioning/dashboards"
    mkdir -p "$PROJECT_ROOT/monitoring/grafana/dashboards"
    
    # Datasource provisioning
    cat > "$PROJECT_ROOT/monitoring/grafana/provisioning/datasources/datasources.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
    jsonData:
      httpMethod: POST
      manageAlerts: true
      prometheusType: Prometheus

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false
    jsonData:
      maxLines: 1000

  - name: Alertmanager
    type: alertmanager
    access: proxy
    url: http://alertmanager:9093
    editable: false
    jsonData:
      implementation: prometheus
EOF

    # Dashboard provisioning
    cat > "$PROJECT_ROOT/monitoring/grafana/provisioning/dashboards/dashboards.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'AlgeriaTrade Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: true
    editable: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: false
EOF

    # Main overview dashboard
    cat > "$PROJECT_ROOT/monitoring/grafana/dashboards/algeriatrade-overview.json" << 'DASHBOARD_EOF'
{
  "annotations": {
    "list": []
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 1,
  "id": null,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "yellow",
                "value": 500
              },
              {
                "color": "red",
                "value": 1000
              }
            ]
          },
          "unit": "ms"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 1,
      "options": {
        "legend": {
          "calcs": ["mean", "max"],
          "displayMode": "table",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "title": "API Response Time (P95)",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 20,
            "gradientMode": "opacity",
            "hideFrom": {"legend": false, "tooltip": false, "viz": false},
            "lineInterpolation": "smooth",
            "lineWidth": 2,
            "pointSize": 5,
            "scaleDistribution": {"type": "linear"},
            "showPoints": "never",
            "spanNulls": false,
            "stacking": {"group": "A", "mode": "none"},
            "thresholdsStyle": {"mode": "off"}
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {"color": "green", "value": null},
              {"color": "red", "value": 80}
            ]
          },
          "unit": "reqps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "id": 2,
      "options": {
        "legend": {
          "calcs": ["sum"],
          "displayMode": "table",
          "placement": "bottom"
        },
        "tooltip": {"mode": "multi"}
      },
      "title": "Request Rate",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {"color": "green", "value": null},
              {"color": "red", "value": 5}
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "id": 3,
      "options": {
        "orientation": "auto",
        "reduceOptions": {
          "calcs": ["lastNotNull"],
          "fields": "",
          "values": false
        },
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "title": "Error Rate",
      "type": "gauge"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "bars",
            "fillOpacity": 80,
            "gradientMode": "none",
            "hideFrom": {"legend": false, "tooltip": false, "viz": false},
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {"type": "linear"},
            "showPoints": "never",
            "spanNulls": false,
            "stacking": {"group": "A", "mode": "normal"},
            "thresholdsStyle": {"mode": "off"}
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [{"color": "green", "value": null}]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      },
      "id": 4,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom"
        },
        "tooltip": {"mode": "single"}
      },
      "title": "HTTP Status Codes Distribution",
      "type": "timeseries"
    }
  ],
  "refresh": "30s",
  "schemaVersion": 38,
  "style": "dark",
  "tags": ["algeriatrade", "overview"],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "browser",
  "title": "AlgeriaTrade Overview",
  "uid": "algeriatrade-overview",
  "version": 1,
  "weekStart": ""
}
DASHBOARD_EOF

    log_success "Grafana dashboards created"
}

create_loki_config() {
    log_info "Creating Loki configuration..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/loki"
    
    cat > "$PROJECT_ROOT/monitoring/loki/config.yml" << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
    chunk_idle_period: 5m
    chunk_retain_period: 30s
    max_transfer_retries: 0

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

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
  retention_period: 720h  # 30 days

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_work_interval: 10m
EOF

    log_success "Loki configuration created"
}

create_promtail_config() {
    log_info "Creating Promtail configuration..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/promtail"
    
    cat > "$PROJECT_ROOT/monitoring/promtail/config.yml" << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Nginx access logs
  - job_name: nginx-access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx-access
          __path__: /var/log/nginx/access.log

  # Nginx error logs
  - job_name: nginx-error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx-error
          __path__: /var/log/nginx/error.log

  # Docker container logs
  - job_name: docker-containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'

  # Application logs (if mounted)
  - job_name: algeriatrade-app
    static_configs:
      - targets:
          - localhost
        labels:
          job: algeriatrade-app
          __path__: /var/log/app/*.log
EOF

    log_success "Promtail configuration created"
}

create_alertmanager_config() {
    log_info "Creating Alertmanager configuration..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/alertmanager"
    
    cat > "$PROJECT_ROOT/monitoring/alertmanager/alertmanager.yml" << 'EOF'
global:
  resolve_timeout: 5m
  smtp_smarthost: '${SMTP_HOST}:${SMTP_PORT:-587}'
  smtp_from: '${EMAIL_FROM:-alerts@algeriatrade.dz}'
  smtp_auth_username: '${SMTP_USER}'
  smtp_auth_password: '${SMTP_PASS}'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      repeat_interval: 1h
      continue: true
    
    # Warning alerts - less frequent
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 6h

receivers:
  - name: 'default-receiver'
    slack_configs:
      - channel: '#general'
        send_resolved: true
        title: '{{ .Status | toUpper }}: {{ .CommonLabels.alertname }}'
        text: |-
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Severity:* {{ .Labels.severity }}
          *Labels:* {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }}  {{ end }}
          {{ end }}

  - name: 'critical-alerts'
    slack_configs:
      - channel: '#incidents'
        send_resolved: true
        color: 'danger'
        title: '🚨 CRITICAL: {{ .CommonLabels.alertname }}'
        text: |-
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Runbook:* https://wiki.algeriatrade.dz/runbooks/{{ .Labels.alertname }}
          {{ end }}
    email_configs:
      - to: 'oncall@algeriatrade.dz'
        send_resolved: true

  - name: 'warning-alerts'
    slack_configs:
      - channel: '#ops'
        send_resolved: true
        color: 'warning'
        title: '⚠️ WARNING: {{ .CommonLabels.alertname }}'
        text: |-
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
EOF

    log_success "Alertmanager configuration created"
}

create_uptime_monitoring_config() {
    log_info "Creating uptime monitoring configuration..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/uptime"
    
    # UptimeRobot-style JSON config for reference
    cat > "$PROJECT_ROOT/monitoring/uptime/endpoints.json" << 'EOF'
{
  "monitors": [
    {
      "name": "AlgeriaTrade Main Site",
      "url": "https://algeriatrade.dz",
      "type": "https",
      "interval": 300,
      "expected_status_codes": [200, 301, 304],
      "contact_groups": ["oncall", "engineering"]
    },
    {
      "name": "API Health Endpoint",
      "url": "https://algeriatrade.dz/api/health",
      "type": "https",
      "interval": 60,
      "expected_status_codes": [200],
      "contact_groups": ["oncall"]
    },
    {
      "name": "Grafana Dashboard",
      "url": "https://monitor.algeriatrade.dz",
      "type": "https",
      "interval": 300,
      "contact_groups": ["engineering"]
    },
    {
      "name": "PostgreSQL Connection",
      "type": "port",
      "host": "localhost",
      "port": 5432,
      "interval": 60,
      "contact_groups": ["oncall"]
    },
    {
      "name": "Redis Connection",
      "type": "port",
      "host": "localhost",
      "port": 6379,
      "interval": 60,
      "contact_groups": ["oncall"]
    }
  ],
  "notification_channels": {
    "slack": {
      "webhook_url": "${SLACK_WEBHOOK_URL}",
      "channels": {
        "incidents": "#incidents",
        "ops": "#ops",
        "engineering": "#engineering"
      }
    },
    "email": {
      "smtp_host": "${SMTP_HOST}",
      "recipients": {
        "oncall": "oncall@algeriatrade.dz",
        "engineering": "engineering@algeriatrade.dz"
      }
    }
  },
  "sla_targets": {
    "availability_99": 99.9,
    "availability_995": 99.95,
    "response_time_p50": 200,
    "response_time_p95": 1000,
    "response_time_p99": 3000
  }
}
EOF

    log_success "Uptime monitoring configuration created"
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all           Set up all monitoring components"
    echo "  --install       Install monitoring stack only"
    echo "  --configure     Create all configurations only"
    echo "  --alerts        Set up alert rules only"
    echo "  --dashboards    Set up Grafana dashboards only"
    echo "  --start         Start monitoring services"
    echo "  --stop          Stop monitoring services"
    echo "  --status        Show monitoring status"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Full setup and start"
    echo "  $0 --configure --dashboards # Create configs only"
    echo "  $0 --start                  # Start existing stack"
}

main() {
    local action="${1:---help}"
    
    case "$action" in
        --all)
            log_info "Setting up complete monitoring stack..."
            create_monitoring_docker_compose
            create_prometheus_config
            create_alert_rules
            create_grafana_dashboards
            create_loki_config
            create_promtail_config
            create_alertmanager_config
            create_uptime_monitoring_config
            
            log_info "Starting monitoring services..."
            cd "$PROJECT_ROOT/monitoring"
            docker compose -f docker-compose.monitoring.yml up -d
            
            log_success "Monitoring stack is now running!"
            echo ""
            echo "Services available at:"
            echo "  - Prometheus:  http://localhost:$PROMETHEUS_PORT"
            echo "  - Grafana:     http://localhost:$GRAFANA_PORT"
            echo "  - Loki:        http://localhost:$LOKI_PORT"
            echo "  - Alertmanager:http://localhost:9093"
            ;;
            
        --install)
            cd "$PROJECT_ROOT/monitoring"
            docker compose -f docker-compose.monitoring.yml up -d
            ;;
            
        --configure)
            create_monitoring_docker_compose
            create_prometheus_config
            create_alert_rules
            create_grafana_dashboards
            create_loki_config
            create_promtail_config
            create_alertmanager_config
            create_uptime_monitoring_config
            ;;
            
        --alerts)
            create_alert_rules
            create_alertmanager_config
            ;;
            
        --dashboards)
            create_grafana_dashboards
            ;;
            
        --start)
            cd "$PROJECT_ROOT/monitoring"
            docker compose -f docker-compose.monitoring.yml up -d
            log_success "Monitoring services started"
            ;;
            
        --stop)
            cd "$PROJECT_ROOT/monitoring"
            docker compose -f docker-compose.monitoring.yml down
            log_success "Monitoring services stopped"
            ;;
            
        --status)
            cd "$PROJECT_ROOT/monitoring"
            docker compose -f docker-compose.monitoring.yml ps
            ;;
            
        -h|--help)
            print_usage
            ;;
            
        *)
            log_error "Unknown option: $action"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function with provided arguments
main "$@"
