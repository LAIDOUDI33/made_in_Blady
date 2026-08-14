#!/bin/bash
# =============================================================================
# Monitoring Setup Script for AlgeriaTrade.dz
# =============================================================================
# Script de Configuration de la Surveillance pour AlgeriaTrade.dz
#
# This script sets up comprehensive monitoring for your production deployment:
# Ce script configure une surveillance complète pour votre déploiement de production:
#
# 1. Prometheus - Metrics collection / Collecte des métriques
# 2. Grafana - Visualization dashboards / Tableaux de bord de visualisation
# 3. Uptime monitoring with health checks / Surveillance disponibilité avec contrôles santé
# 4. Log aggregation with Loki / Agrégation des logs avec Loki
# 5. Alerting configuration / Configuration des alertes
#
# Usage / Utilisation:
#   ./scripts/setup-monitoring.sh              # Full setup
#   ./scripts/setup-monitoring.sh --prometheus # Prometheus only
#   ./scripts/setup-monitoring.sh --grafana    # Grafana only
#   ./scripts/setup-monitoring.sh --minimal    # Basic monitoring only
#   ./scripts/setup-monitoring.sh --teardown   # Remove all monitoring
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration / Configuration
# =============================================================================

# Colors / Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Paths / Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
COMPOSE_FILE="$MONITORING_DIR/docker-compose.monitoring.yml"
LOG_FILE="$PROJECT_ROOT/logs/monitoring-setup.log"

# Versions / Versions
PROMETHEUS_VERSION="v2.49.0"
GRAFANA_VERSION="10.2.0"
LOKI_VERSION="2.9.0"
PROMTAIL_VERSION="2.9.0"

# Ports / Ports
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
LOKI_PORT=3100
PROMTAIL_PORT=9080
ALERTMANAGER_PORT=9093

# Credentials / Identifiants (change in production!)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=changeme_in_production

# Options / Options
SETUP_PROMETHEUS=true
SETUP_GRAFANA=true
SETUP_LOKI=true
SETUP_ALERTS=true
MINIMAL_MODE=false
TEARDOWN_MODE=false
FORCE_MODE=false

# =============================================================================
# Functions / Fonctions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

die() {
    error "$1"
    exit 1
}

show_banner() {
    echo ""
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║${NC}   ${BOLD}📊 AlgeriaTrade.dz - Monitoring Setup${NC}               ${BOLD}${CYAN}║${NC}"
    echo -e "${BOLD}${CYAN}║${NC}   ${BOLD}Configuration de la Surveillance${NC}                    ${BOLD}${CYAN}║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$MONITORING_DIR"
    touch "$LOG_FILE"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --prometheus)
                SETUP_PROMETHEUS=true
                SETUP_GRAFANA=false
                SETUP_LOKI=false
                shift
                ;;
            --grafana)
                SETUP_GRAFANA=true
                SETUP_PROMETHEUS=false
                SETUP_LOKI=false
                shift
                ;;
            --loki)
                SETUP_LOKI=true
                SETUP_PROMETHEUS=false
                SETUP_GRAFANA=false
                shift
                ;;
            --minimal)
                MINIMAL_MODE=true
                SETUP_LOKI=false
                shift
                ;;
            --teardown|-d)
                TEARDOWN_MODE=true
                shift
                ;;
            --force|-f)
                FORCE_MODE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                die "Unknown argument: $1 / Argument inconnu: $1"
                ;;
        esac
    done
}

show_help() {
    cat << 'EOF'
📊 AlgeriaTrade.dz Monitoring Setup

Set up production monitoring stack.

Usage: ./setup-monitoring.sh [OPTIONS]

Options:
  --prometheus     Setup Prometheus only
  --grafana        Setup Grafana only
  --loki           Setup Loki (logs) only
  --minimal        Minimal setup (Prometheus + Grafana, no Loki)
  -d, --teardown   Remove all monitoring stacks
  -f, --force      Force without confirmation
  -h, --help       Show this help

Components:
  📈 Prometheus    Metrics collection at :9090
  📊 Grafana       Dashboards at :3001
  📋 Loki          Log aggregation at :3100
  🔔 AlertManager  Alerts at :9093

Examples:
  ./setup-monitoring.sh              # Full setup
  ./setup-monitoring.sh --minimal    # Basic monitoring
  ./setup-monitoring.sh --teardown   # Remove everything

After setup:
  - Grafana: http://localhost:3001 (admin/changeme_in_production)
  - Prometheus: http://localhost:9090
EOF
}

# Check prerequisites / Vérifier les prérequis
check_prerequisites() {
    log "Checking prerequisites... / Vérification des prérequis..."

    # Docker check / Vérification Docker
    if ! command -v docker &> /dev/null; then
        die "Docker is required but not installed / Docker est requis mais n'est pas installé"
    fi
    
    if ! docker compose version &> /dev/null; then
        die "Docker Compose is required / Docker Compose est requis"
    fi

    success "Docker environment ready / Environnement Docker prêt"

    # Port checks / Vérifications des ports
    local ports_to_check=()
    
    [[ "$SETUP_PROMETHEUS" == true ]] && ports_to_check+=($PROMETHEUS_PORT $ALERTMANAGER_PORT)
    [[ "$SETUP_GRAFANA" == true ]] && ports_to_check+=($GRAFANA_PORT)
    [[ "$SETUP_LOKI" == true ]] && ports_to_check+=($LOKI_PORT)

    for port in "${ports_to_check[@]}"; do
        if ss -tlnp 2>/dev/null | grep -q ":$port " || netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            warn "Port $port is already in use / Le port $port est déjà utilisé"
        fi
    done

    success "Prerequisites check passed / Vérification des prérequis réussie"
}

# Create Prometheus configuration / Créer la configuration Prometheus
create_prometheus_config() {
    log "Creating Prometheus configuration... / Création de la configuration Prometheus..."

    mkdir -p "$MONITORING_DIR/prometheus"
    mkdir -p "$MONITORING_DIR/prometheus/rules"
    mkdir -p "$MONITORING_DIR/prometheus/file_sd"

    cat > "$MONITORING_DIR/prometheus/prometheus.yml" << 'PROMEOF'
# =============================================================================
# Prometheus Configuration for AlgeriaTrade.dz
# =============================================================================
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s
  external_labels:
    monitor: 'algeriatrade'
    environment: 'production'

# Alertmanager configuration / Configuration Alertmanager
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# Rule files / Fichiers de règles
rule_files:
  - '/etc/prometheus/rules/*.yml'
  - '/etc/prometheus/rules/*.yaml'

# Scrape configurations / Configurations de scraping
scrape_configs:
  # Prometheus self-monitoring / Auto-surveillance Prometheus
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # AlgeriaTrade Application Metrics / Métriques Application AlgeriaTrade
  - job_name: 'algeriatrade-app'
    metrics_path: '/api/metrics'
    scrape_interval: 30s
    static_configs:
      - targets: ['host.docker.internal:3000']
        labels:
          service: 'algeriatrade-app'
          environment: 'production'

  # Node Exporter (server metrics) / Exportateur Nœud (métriques serveur)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          service: 'node-exporter'

  # PostgreSQL Exporter / Exportateur PostgreSQL
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          service: 'postgres'

  # Redis Exporter / Exportateur Redis
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
        labels:
          service: 'redis'

  # Nginx metrics / Métriques Nginx
  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']
        labels:
          service: 'nginx'

  # Docker metrics / Métriques Docker
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
        labels:
          service: 'docker'
PROMEOF

    # Create alert rules / Créer les règles d'alerte
    cat > "$MONITORING_DIR/prometheus/rules/alerts.yml" << 'ALERTEOF'
# =============================================================================
# Alert Rules for AlgeriaTrade.dz
# =============================================================================
groups:
  - name: algeriatrade-alerts
    interval: 30s
    rules:
      # Application down / Application hors ligne
      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ $labels.instance }} down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 1 minute."

      # High error rate / Taux d'erreur élevé
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) 
            / sum(rate(http_requests_total[5m]))
          ) * 100 > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes."

      # High response time / Temps de réponse élevé
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      # Low memory available / Mémoire disponible faible
      - alert: LowMemory
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low memory on {{ $labels.instance }}"
          description: "Memory usage is above 85% (current: {{ $value }}%)"

      # High CPU usage / Utilisation CPU élevée
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% (current: {{ $value }}%)"

      # Database connection pool exhausted / Pool de connexions BDD épuisé
      - alert: PostgresConnectionPoolExhausted
        expr: pg_stat_activity_count / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL connection pool nearly exhausted"
          description: "Connection pool is at {{ $value }}% capacity"

      # Disk space low / Espace disque faible
      - alert: LowDiskSpace
        expr: (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"})) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is above 85% (current: {{ $value }}%)"

      # SSL certificate expiring soon / Certificat SSL expire bientôt
      - alert: SSLCertExpiringSoon
        expr: (ssl_cert_not_after - time()) / 86400 < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "Certificate will expire in {{ $value }} days"
ALERTEOF

    success "Prometheus configuration created / Configuration Prometheus créée"
}

# Create Grafana configuration / Créer la configuration Grafana
create_grafana_config() {
    log "Creating Grafana configuration... / Création de la configuration Grafana..."

    mkdir -p "$MONITORING_DIR/grafana/provisioning/datasources"
    mkdir -p "$MONITORING_DIR/grafana/provisioning/dashboards"
    mkdir -p "$MONITORING_DIR/grafana/dashboards"

    # Grafana datasource / Source de données Grafana
    cat > "$MONITORING_DIR/grafana/provisioning/datasources/datasources.yml" << 'DATASOURCEEOF'
# Grafana Datasource Provisioning
apiVersion: 1

datasources:
  # Prometheus datasource / Source Prometheus
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
      prometheusVersion: 2.0.0

  # Loki datasource (if enabled) / Source Loki (si activé)
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false
    jsonData:
      maxLines: 1000
DATASOURCEEOF

    # Dashboard provisioning / Provisionnement des tableaux de bord
    cat > "$MONITORING_DIR/grafana/provisioning/dashboards/dashboards.yml" << 'DASHBOARDEOF'
# Grafana Dashboard Provisioning
apiVersion: 1

providers:
  - name: 'AlgeriaTrade Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
DASHBOARDEOF

    # Create main dashboard / Créer le tableau de bord principal
    cat > "$MONITORING_DIR/grafana/dashboards/algeriatrade-overview.json" << 'DASHBOARDJSON'
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "description": "AlgeriaTrade.dz Production Overview",
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
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
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 80},
              {"color": "red", "value": 95}
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {"h": 6, "w": 6, "x": 0, "y": 0},
      "id": 1,
      "options": {
        "orientation": "auto",
        "reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": false},
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "title": "CPU Usage / Utilisation CPU",
      "type": "gauge"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {"mode": "thresholds"},
          "mappings": [],
          "thresholds": {
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 75},
              {"color": "red", "value": 90}
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {"h": 6, "w": 6, "x": 6, "y": 0},
      "id": 2,
      "options": {
        "orientation": "auto",
        "reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": false},
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "title": "Memory Usage / Utilisation Mémoire",
      "type": "gauge"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {"mode": "palette-classic"},
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {"legend": false, "tooltip": false, "viz": false},
            "lineInterpolation": "linear",
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
      "gridPos": {"h": 6, "w": 12, "x": 12, "y": 0},
      "id": 3,
      "options": {
        "legend": {"calcs": ["mean", "max"], "displayMode": "table", "placement": "bottom"},
        "tooltip": {"mode": "single", "sort": "none"}
      },
      "title": "Request Rate / Taux de Requêtes",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {"mode": "palette-classic"},
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "Duration / Durée",
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
            "thresholdsStyle": {"mode": "area"}
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 0.5},
              {"color": "red", "value": 2}
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6},
      "id": 4,
      "options": {
        "legend": {"calcs": ["mean", "max", "p95"], "displayMode": "table", "placement": "bottom"},
        "tooltip": {"mode": "multi", "sort": "desc"}
      },
      "title": "Response Time Distribution / Distribution du Temps de Réponse",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {"mode": "thresholds"},
          "custom": {
            "align": "auto",
            "cellOptions": {"type": "auto"},
            "inspect": false
          },
          "mappings": [],
          "thresholds": {
            "steps": [
              {"color": "green", "value": null},
              {"color": "red", "value": 1}
            ]
          }
        },
        "overrides": [
          {"matcher": {"id": "byName", "options": "Status"}, "properties": [{"id": "custom.displayMode", "value": "color-background"}]},
          {"matcher": {"id": "byName", "options": "Instance"}, "properties": [{"id": "links", "value": [{"targetBlank": true, "title": "Open instance", "url": "/d/instance?var-instance=${__data.fields.Instance}"}]}]}
        ]
      },
      "gridPos": {"h": 8, "w": 12, "x": 12, "y": 6},
      "id": 5,
      "options": {
        "cellHeight": "sm",
        "footer": {"countRows": false, "fields": "", "reducer": ["sum"], "show": false},
        "showHeader": true
      },
      "title": "Service Status / Statut des Services",
      "type": "table"
    }
  ],
  "refresh": "30s",
  "schemaVersion": 38,
  "tags": ["algeriatrade", "production"],
  "templating": {
    "list": []
  },
  "time": {"from": "now-1h", "to": "now"},
  "timepicker": {},
  "timezone": "browser",
  "title": "🇩🇿 AlgeriaTrade Overview",
  "uid": "algeriatrade-overview",
  "version": 1,
  "weekStart": ""
}
DASHBOARDJSON

    success "Grafana configuration created / Configuration Grafana créée"
}

# Create Loki configuration / Créer la configuration Loki
create_loki_config() {
    log "Creating Loki configuration... / Création de la configuration Loki..."

    mkdir -p "$MONITORING_DIR/loki"
    mkdir -p "$MONITORING_DIR/promtail"

    # Loki config / Configuration Loki
    cat > "$MONITORING_DIR/loki/local-config.yaml" << 'LOKIEOF'
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
    num_tokens: 512

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
    filesystem:
      directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  max_query_parallelism: 16

compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
  delete_request_store: filesystem
LOKIEOF

    # Promtail config / Configuration Promtail
    cat > "$MONITORING_DIR/promtail/config.yml" << 'PROMTAILEOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # App logs / Logs application
  - job_name: algeriatrade-app
    static_configs:
      - targets:
          - localhost
        labels:
          job: algeriatrade-app
          __path__: /var/log/docker/*algeriatrade*.log

  # Nginx logs / Logs Nginx
  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log

  # System logs / Logs système
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: system
          __path__: /var/log/syslog
PROMTAILEOF

    success "Loki configuration created / Configuration Loki créée"
}

# Create AlertManager configuration / Créer la configuration AlertManager
create_alertmanager_config() {
    log "Creating AlertManager configuration... / Création de la configuration AlertManager..."

    mkdir -p "$MONITORING_DIR/alertmanager"

    cat > "$MONITORING_DIR/alertmanager/alertmanager.yml" << 'ALERTMANAGEREOF'
# AlertManager Configuration for AlgeriaTrade.dz
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@algeriatrade.dz'
  smtp_auth_username: 'alerts@algeriatrade.dz'
  smtp_auth_password: 'your-smtp-password'

# Templates / Modèles
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Inhibition rules / Règles d'inhibition
inhibit_rules:
  # If critical alert is firing, silence warnings for same instance
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']

# Routing tree / Arbre de routage
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
      continue: true
      group_wait: 10s
      repeat_interval: 1h

    # Warning alerts / Alertes warning
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 4h

# Receivers / Récepteurs
receivers:
  - name: 'default-receiver'
    webhook_configs:
      - url: 'http://localhost:5001/webhook'
        send_resolved: true

  - name: 'critical-alerts'
    slack_configs:
      - channel: '#alerts-critical'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        send_resolved: true
    webhook_configs:
      - url: '${SLACK_WEBHOOK_URL}'
        send_resolved: true

  - name: 'warning-alerts'
    slack_configs:
      - channel: '#alerts-warning'
        title: '⚠️ WARNING: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        send_resolved: true
ALERTMANAGEREOF

    success "AlertManager configuration created / Configuration AlertManager créée"
}

# Create Docker Compose for monitoring / Créer Docker Compose pour la surveillance
create_docker_compose() {
    log "Creating Docker Compose configuration... / Création de la configuration Docker Compose..."

    local compose_content="# =============================================================================
# Docker Compose - Monitoring Stack for AlgeriaTrade.dz
# =============================================================================

version: '3.8'

services:
"

    # Add Prometheus / Ajouter Prometheus
    if [[ "$SETUP_PROMETHEUS" == true ]]; then
        compose_content+="
  # ---------------------------------------------------------------------------
  # Prometheus - Metrics Collection
  # ---------------------------------------------------------------------------
  prometheus:
    image: prom/prometheus:${PROMETHEUS_VERSION}
    container_name: algeriatrade-prometheus
    restart: unless-stopped
    ports:
      - \"${PROMETHEUS_PORT}:9090\"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    networks:
      - monitoring-network

  # ---------------------------------------------------------------------------
  # AlertManager - Alert Handling
  # ---------------------------------------------------------------------------
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: algeriatrade-alertmanager
    restart: unless-stopped
    ports:
      - \"${ALERTMANAGER_PORT}:9093\"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    networks:
      - monitoring-network

  # ---------------------------------------------------------------------------
  # Node Exporter - Server Metrics
  # ---------------------------------------------------------------------------
  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: algeriatrade-node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--rootfs=/rootfs'
    networks:
      - monitoring-network

  # ---------------------------------------------------------------------------
  # Cadvisor - Container Metrics
  # ---------------------------------------------------------------------------
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: algeriatrade-cadvisor
    restart: unless-stopped
    ports:
      - '8080:8080'
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /cgroup:/cgroup:ro
    networks:
      - monitoring-network
"
    fi

    # Add Grafana / Ajouter Grafana
    if [[ "$SETUP_GRAFANA" == true ]]; then
        compose_content+="
  # ---------------------------------------------------------------------------
  # Grafana - Visualization Dashboards
  # ---------------------------------------------------------------------------
  grafana:
    image: grafana/grafana:${GRAFANA_VERSION}
    container_name: algeriatrade-grafana
    restart: unless-stopped
    ports:
      - \"${GRAFANA_PORT}:3000\"
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:${GRAFANA_PORT}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    depends_on:
      - prometheus
    networks:
      - monitoring-network
"
    fi

    # Add Loki / Ajouter Loki
    if [[ "$SETUP_LOKI" == true ]]; then
        compose_content+="
  # ---------------------------------------------------------------------------
  # Loki - Log Aggregation
  # ---------------------------------------------------------------------------
  loki:
    image: grafana/loki:${LOKI_VERSION}
    container_name: algeriatrade-loki
    restart: unless-stopped
    ports:
      - \"${LOKI_PORT}:3100\"
    volumes:
      - ./loki/local-config.yaml:/mnt/config/loki-config.yaml:ro
      - loki-data:/loki
    command: -config.file=/mnt/config/loki-config.yaml
    networks:
      - monitoring-network

  # ---------------------------------------------------------------------------
  # Promtail - Log Collector
  # ---------------------------------------------------------------------------
  promtail:
    image: grafana/promtail:${PROMTAIL_VERSION}
    container_name: algeriatrade-promtail
    restart: unless-stopped
    volumes:
      - ./promtail/config.yml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - monitoring-network
"
    fi

    # Add volumes and networks / Ajouter volumes et réseaux
    compose_content+="
# =============================================================================
# Volumes / Volumes persistants
# =============================================================================
volumes:
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  alertmanager-data:
    driver: local
"

    [[ "$SETUP_LOKI" == true ]] && compose_content+="
  loki-data:
    driver: local
"

    # Add network / Ajouter réseau
    compose_content+="
# =============================================================================
# Network / Réseau
# =============================================================================
networks:
  monitoring-network:
    driver: bridge
"

    echo "$compose_content" > "$COMPOSE_FILE"
    success "Docker Compose configuration created / Configuration Docker Compose créée"
}

# Start monitoring stack / Démarrer la pile de surveillance
start_monitoring() {
    log "Starting monitoring stack... / Démarrage de la pile de surveillance..."

    cd "$MONITORING_DIR"

    if docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE"; then
        success "Monitoring stack starting... / Pile de surveillance en cours de démarrage..."
        
        sleep 15
        
        # Check services / Vérifier les services
        info "Checking services status..."
        docker compose -f "$COMPOSE_FILE" ps
        
    else
        die "Failed to start monitoring stack / Échec du démarrage de la pile de surveillance"
    fi
}

# Stop and remove monitoring / Arrêter et supprimer la surveillance
teardown_monitoring() {
    warn "Tearing down monitoring stack... / Démontage de la pile de surveillance..."

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        warn "No monitoring stack found / Aucune pile de surveillance trouvée"
        return
    fi

    cd "$MONITORING_DIR"

    read -rp "This will DELETE all monitoring data. Continue? [yes/No] " confirm
    [[ "$confirm" != "yes" ]] && { info "Cancelled / Annulé"; return; }

    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>&1 | tee -a "$LOG_FILE"

    success "Monitoring stack removed / Pile de surveillance supprimée"
}

# Display information / Afficher les informations
display_info() {
    echo ""
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${GREEN}  📊 MONITORING SETUP COMPLETE!                           ${NC}"
    echo -e "${BOLD}${GREEN}  CONFIGURATION DE LA SURVEILLANCE TERMINÉE!              ${NC}"
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BOLD}Services Available:/ Services Disponibles:${NC}"
    
    [[ "$SETUP_PROMETHEUS" == true ]] && \
        echo -e "  📈 Prometheus:    ${CYAN}http://localhost:${PROMETHEUS_PORT}${NC}"
    [[ "$SETUP_PROMETHEUS" == true ]] && \
        echo -e "  🔔 AlertManager:  ${CYAN}http://localhost:${ALERTMANAGER_PORT}${NC}"
    [[ "$SETUP_GRAFANA" == true ]] && \
        echo -e "  📊 Grafana:       ${CYAN}http://localhost:${GRAFANA_PORT}${NC}"
    [[ "$SETUP_LOKI" == true ]] && \
        echo -e "  📋 Loki:          ${CYAN}http://localhost:${LOKI_PORT}${NC}"
    
    echo ""
    [[ "$SETUP_GRAFANA" == true ]] && {
        echo -e "  ${BOLD}Grafana Login:${NC}"
        echo -e "     Username: ${GREEN}${GRAFANA_ADMIN_USER}${NC}"
        echo -e "     Password: ${RED}${GRAFANA_ADMIN_PASSWORD}${NC}"
        echo -e "     ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!"
        echo ""
    }

    echo -e "  ${BOLD}Useful Commands:/ Commandes Utiles:${NC}"
    echo -e "     View status:  ${YELLOW}cd $MONITORING_DIR && docker compose ps${NC}"
    echo -e "     View logs:    ${YELLOW}cd $MONITORING_DIR && docker compose logs -f${NC}"
    echo -e "     Stop all:     ${YELLOW}cd $MONITORING_DIR && docker compose down${NC}"
    echo -e "     Teardown:     ${YELLOW}$0 --teardown${NC}"
    echo ""
}

# Create health check endpoint / Créer le point de contrôle de santé
create_health_endpoint() {
    log "Setting up health check endpoints... / Configuration des points de contrôle de santé..."

    # Create a simple health check script / Créer un script de contrôle de santé simple
    cat > "$MONITORING_DIR/health-check.sh" << 'HEALTHSCRIPT'
#!/bin/bash
# Health Check Script for AlgeriaTrade.dz Monitoring

echo "Running health checks for AlgeriaTrade.dz..."
echo ""

# Define services to check
declare -A SERVICES=(
    ["App"]="http://localhost:3000/api/health"
    ["Prometheus"]="http://localhost:9090/-/healthy"
    ["Grafana"]="http://localhost:3001/api/health"
    ["PostgreSQL"]="localhost:5432"
    ["Redis"]="localhost:6379"
)

ALL_HEALTHY=true

for SERVICE in "${!SERVICES[@]}"; do
    ENDPOINT="${SERVICES[$SERVICE]}"
    
    if [[ "$ENDPOINT" == http* ]]; then
        if curl -sf --max-time 5 "$ENDPOINT" > /dev/null 2>&1; then
            echo "✅ $SERVICE: HEALTHY"
        else
            echo "❌ $SERVICE: UNHEALTHY"
            ALL_HEALTHY=false
        fi
    else
        # For TCP services like PostgreSQL and Redis
        if timeout 5 bash -c "echo > /dev/tcp/${ENDPOINT%%:*}/${ENDPOINT##*:}" 2>/dev/null; then
            echo "✅ $SERVICE: HEALTHY"
        else
            echo "❌ $SERVICE: UNHEALTHY"
            ALL_HEALTHY=false
        fi
    fi
done

echo ""
if [ "$ALL_HEALTHY" = true ]; then
    echo "✅ All systems operational"
    exit 0
else
    echo "⚠️ Some services are unhealthy"
    exit 1
fi
HEALTHSCRIPT

    chmod +x "$MONITORING_DIR/health-check.sh"
    success "Health check script created / Script de contrôle de santé créé"
}

# =============================================================================
# Main / Principal
# =============================================================================

main() {
    setup_logging
    parse_args "$@"
    show_banner

    # Handle teardown / Gérer le démontage
    if [[ "$TEARDOWN_MODE" == true ]]; then
        teardown_monitoring
        exit 0
    fi

    # Confirm / Confirmer
    if [[ "$FORCE_MODE" != true ]]; then
        echo "This will set up monitoring components:"
        [[ "$SETUP_PROMETHEUS" == true ]] && echo "  ✅ Prometheus + AlertManager + Node Exporter"
        [[ "$SETUP_GRAFANA" == true ]] && echo "  ✅ Grafana Dashboards"
        [[ "$SETUP_LOKI" == true ]] && echo "  ✅ Loki + Promtail (Log Aggregation)"
        echo ""
        read -rp "Continue with setup? [y/N] " confirm
        [[ "$confirm" != "y" && "$confirm" != "Y" ]] && { info "Cancelled / Annulé"; exit 0; }
    fi

    # Execute setup steps / Exécuter les étapes de configuration
    check_prerequisites

    [[ "$SETUP_PROMETHEUS" == true ]] && create_prometheus_config
    [[ "$SETUP_PROMETHEUS" == true ]] && create_alertmanager_config
    [[ "$SETUP_GRAFANA" == true ]] && create_grafana_config
    [[ "$SETUP_LOKI" == true ]] && create_loki_config
    create_docker_compose
    start_monitoring
    create_health_endpoint
    display_info
}

main "$@"
