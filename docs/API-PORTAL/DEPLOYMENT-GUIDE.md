# AlgeriaTrade.dz API Developer Portal - Deployment Guide

## Guide de Déploiement Complet | دليل النشر الشامل

---

## Table des Matières / جدول المحتويات

1. [Prérequis](#prérequis)
2. [Installation - Docker (Recommandé)](#installation-docker-recommandé)
3. [Installation - Node.js Manuel](#installation-nodejs-manuel)
4. [Installation - Kubernetes](#installation-kubernetes)
5. [Configuration](#configuration)
6. [Sécurisation Renforcée](#sécurisation-renforcée)
7. [Surveillance & Maintenance](#surveillance--maintenance)

---

## Prérequis

### Exigences du Serveur

| Composant | Minimum | Recommandé | Production |
|-----------|---------|------------|------------|
| **CPU** | 2 cœurs | 4 cœurs | 8+ cœurs |
| **RAM** | 8 GB | 16 GB | 32 GB |
| **Stockage** | 50 GB SSD | 100 GB SSD | 200 GB SSD NVMe |
| **Bande passante** | 100 Mbps | 1 Gbps | 10 Gbps |
| **Système** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | RHEL 9 / Ubuntu 22.04 |

### Logiciels Requis

```bash
# Docker & Docker Compose
docker --version    # >= 24.0
docker-compose --version # >= 2.20

# Node.js (pour déploiement manuel)
node --version     # >= 18.17
npm --version      # >= 9.6

# Outils supplémentaires
openssl version
git --version
curl --version
```

### Configuration DNS

Configurez les enregistrements DNS suivants avant le déploiement:

```
Type    Nom                    Valeur                   TTL
A       portal.algeriatrade.dz  VOTRE_IP_SERVEUR        300
A       api.algeriatrade.dz     VOTRE_IP_SERVEUR        300
A       grafana.algeriatrade.dz VOTRE_IP_SERVEUR        3600
CNAME   www.algeriatrade.dz     portal.algeriatrade.dz  3600
MX      algeriatrade.dz         mail.votre-provider.dz  3600
TXT     _dmarc.algeriatrade.dz  v=DMARC1;p=quarantine   3600
TXT     algeriatrade.dz         v=spf1 include:... ~all 3600
```

### Certificats SSL

Pour la production, utilisez **Let's Encrypt** avec certbot:

```bash
# Installation de certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtention du certificat (après configuration nginx)
sudo certbot --nginx \
    -d portal.algeriatrade.dz \
    -d api.algeriatrade.dz \
    --non-interactive \
    --agree-tos \
    --email admin@algeriatrade.dz

# Renouvellement automatique
sudo systemctl enable certbot.timer
```

---

## Installation - Docker (Recommandé)

### Étape 1: Cloner le Repository

```bash
git clone https://github.com/algeriatrade/api-developer-portal.git
cd api-developer-portal
```

### Étape 2: Configuration Initiale

```bash
# Lancer le script d'initialisation
chmod +x deploy/api-portal/scripts/setup-developer-portal.sh
./deploy/api-portal/scripts/setup-developer-portal.sh
```

Le script va:
- ✅ Générer les secrets cryptographiques (JWT, encryption)
- ✅ Créer le schéma de base de données
- ✅ Peupler les données initiales (plans, documentation)
- ✅ Configurer les certificats SSL
- ✅ Paramétrer le service email

### Étape 3: Configurer l'Environnement

Éditez `deploy/api-portal/.env.production`:

```bash
# Base de données PostgreSQL
POSTGRES_PASSWORD=votre_mot_de_passe_securise_ici
POSTGRES_USER=apiportal
POSTGRES_DB=algeriatrade_portal

# Redis pour cache/limitation de taux
REDIS_PASSWORD=votre_redis_password

# Secrets JWT (générés automatiquement, à conserver!)
JWT_SECRET=xxx... (32+ caractères)
JWT_REFRESH_SECRET=yyy...
ENCRYPTION_KEY=zzz...

# Configuration Email SMTP
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@algeriatrade.dz
SMTP_PASS=votre_smtp_password

# Monitoring (optionnel)
GRAFANA_ADMIN_PASSWORD=votre_grafana_password
ELASTIC_PASSWORD=votre_elastic_password

# Paiements Algériens
CCP_API_KEY=votre_ccp_api_key
BARIDIMOB_MERCHANT_ID=votre_merchant_id
```

### Étape 4: Déploiement

```bash
# Déploiement complet avec vérifications
./deploy/api-portal/scripts/deploy.sh

# Ou manuellement:
cd deploy/api-portal
docker compose -f docker-compose.api-portal.yml up -d

# Suivi des logs
docker compose logs -f api-gateway
```

### Étape 5: Vérification Post-Déploiement

```bash
# Vérifier que tous les services tournent
docker compose ps

# Test de santé de l'API
curl https://portal.algeriatrade.dz/api/health

# Vérification HTTPS
curl -Iv https://api.algeriatrade.dz/v1/products
```

---

## Installation - Node.js Manuel

### Prérequis Système

```bash
# Installer Node.js 20 LTS via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib

# Installer Redis
sudo apt install redis-server
```

### Configuration PostgreSQL

```sql
-- Créer l'utilisateur et la base de données
CREATE USER apiportal WITH PASSWORD 'votre_password';
CREATE DATABASE algeriatrade_portal OWNER apiportal;
GRANT ALL PRIVILEGES ON DATABASE algeriatrade_portal TO apiportal;

-- Extensions requises
\c algeriatrade_portal
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Build et Démarrage

```bash
# Installation des dépendances
npm ci --production=false

# Génération du client Prisma
npx prisma generate

# Migrations de base de données
npx prisma migrate deploy

# Build de production
npm run build

# Démarrage en production
NODE_ENV=production node server.js
```

### Configuration Systemd

Créez `/etc/systemd/system/algeriatrade-api-portal.service`:

```ini
[Unit]
Description=AlgeriaTrade API Developer Portal
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/algeriatrade-api-portal
Environment=NODE_ENV=production
EnvironmentFile=/opt/algeriatrade-api-portal/.env.production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable algeriatrade-api-portal
sudo systemctl start algeriatrade-api-portal
```

---

## Installation - Kubernetes

### Prérequis K8s

- Kubernetes cluster v1.28+
- kubectl configuré
- cert-manager installé (pour TLS)
- Ingress Controller (nginx-ingress)

### Déploiement

```bash
# Appliquer les manifests
kubectl apply -f deploy/kubernetes/api-portal.yaml

# Créer le secret avec vos valeurs
kubectl create secret generic api-portal-secrets \
  --from-literal=JWT_SECRET=votre_secret \
  --from-literal=POSTGRES_PASSWORD=votre_password \
  --namespace=algeriatrade-api-portal

# Vérifier le déploiement
kubectl get pods -n algeriatrade-api-portal
kubectl get ingress -n algeriatrade-api-portal
```

### Autoscaling

L'HPA est configuré pour:
- **Minimum**: 3 replicas
- **Maximum**: 20 replicas
- **Seuil CPU**: 70% utilisation
- **Seuil Mémoire**: 80% utilisation

```bash
# Vérifier l'état HPA
kubectl get hpa -n algeriatrade-api-portal

# Forcer un scale-up test
kubectl scale deployment api-portal \
  --replicas=5 \
  -n algeriatrade-api-portal
```

---

## Configuration

### Variables d'Environnement Référence

| Variable | Description | Requise | Exemple |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environnement | Oui | `production` |
| `DATABASE_URL` | URL PostgreSQL | Oui | `postgresql://...` |
| `REDIS_URL` | URL Redis | Oui | `redis://:pass@host:6379` |
| `JWT_SECRET` | Secret JWT Access | Oui | 32+ caractères aléatoires |
| `JWT_REFRESH_SECRET` | Secret JWT Refresh | Oui | Différent de JWT_SECRET |
| `ENCRYPTION_KEY` | Clé AES-256-GCM | Oui | 64 caractères hex |
| `NEXT_PUBLIC_APP_URL` | URL publique | Oui | `https://portal.algeriatrade.dz` |
| `SMTP_*` | Configuration email | Oui | Voir section Email |
| `SENTRY_DSN` | Sentry error tracking | Non | `https://...@sentry.io/...` |
| `LOG_LEVEL` | Niveau de logging | Non | `info`, `debug`, `warn` |

### Pool de Connexions Database

Configuration optimisée pour PostgreSQL dans `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Dans next.config.ts ou configuration applicative:
const poolConfig = {
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};
```

### Configuration Redis Cluster

Pour les charges élevées, configurez Redis en mode cluster:

```yaml
# docker-compose.override.yml pour production
redis:
  command: >
    redis-server
    --cluster-enabled yes
    --cluster-config-file nodes.conf
    --cluster-node-timeout 5000
    --appendonly yes
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
```

### Intégration CDN

Configurez Cloudflare ou équivalent:

1. **Ajoutez votre domaine** au provider CDN
2. **Règles de cache**:
   ```
   /_next/static/* → Cache 1 an, Edge
   /static/* → Cache 30 jours, Edge
   /api/* → Pas de cache (bypass)
   /* → Cache 5 minutes, respect ETag
   ```
3. **Page Rules**:
   - SSL: Full (Strict)
   - Minification: Auto
   - Brotli: Activé

---

## Sécurisation Renforcée

### Politique de Rotation des Clés API

```bash
# Rotation automatique via cron (tous les 90 jours)
0 2 1 * * /opt/algeriatrade/scripts/rotate-keys.sh

# Script de rotation
#!/bin/bash
# rotate-keys.sh
# Avertit les développeurs dont la clé a > 80 jours
# Génère nouvelle clé
# Permet transition de 7 jours
# Révoque ancienne clé après transition
```

### Configuration Rate Limiting

Les limites sont configurées à plusieurs niveaux:

| Niveau | Endpoint | Limite | Fenêtre |
|--------|----------|--------|---------|
| Global IP | Tous | 100 req/s | Seconde |
| Authentification | `/api/auth/*` | 10 req/min | Minute |
| Création clé | `/api/portal/keys` | 3 req/heure | Heure |
| Par clé API | `/v1/*` | Variable par plan | Minute |

### Whitelisting IP

```nginx
# Dans nginx/api-portal.conf
geo $limit {
    default 1;
    192.168.0.0/16 0;  # Réseau interne
    10.0.0.0/8 0;       # Réseau privé
    # IPs spécifiques whitelistées
    41.xxx.xxx.xxx 0;   # Bureau AlgeriaTrade
}

map $limit $limit_key {
    0 "";
    1 $binary_remote_addr;
}
```

### Audit Logging

L'audit logging capture:
- Toutes les authentifications (succès/échec)
- Création/révocation de clés API
- Changements de plan
- Accès aux endpoints sensibles
- Export de données

```sql
-- Table d'audit (créée automatiquement)
CREATE TABLE "AuditLog" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES "DeveloperAccount"(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche efficace
CREATE INDEX idx_audit_action ON "AuditLog"(action);
CREATE INDEX idx_audit_actor ON "AuditLog"(actor_id);
CREATE INDEX idx_audit_created ON "AuditLog"(created_at);
```

### Checklist Tests de Pénétration

Avant mise en production, effectuez:

- [ ] OWASP ZAP Scan automatisé
- [ ] Test injection SQL sur tous les inputs
- [ ] Test XSS (stocké et réflecti)
- [ ] Validation CSRF sur formulaires
- [ ] Test rate limiting bypass
- [ ] Vérification headers sécurité
- [ ] Test authentification brute-force
- [ ] Review configuration TLS (SSL Labs A+)
- [ ] Test dépendances vulnérables (`npm audit`)
- [ ] Vérification exposition secrets git history

---

## Surveillance & Maintenance

### Endpoints de Santé

| Endpoint | Description | Usage |
|----------|-------------|-------|
| `/health` | Basique liveness | Load balancers, Kubernetes |
| `/ready` | Readiness probe | Déploiements rolling |
| `/api/health` | Complet + DB check | Monitoring détaillé |
| `/api/metrics` | Metrics Prometheus | Scraping Prometheus |
| `/api/portal/deploy/status` | Info déploiement | Dashboard ops |

### Configuration Alertes

Alertes critiques configurées dans `prometheus-rules.yml`:

```yaml
# Taux d'erreur > 5% pendant 5 minutes
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Taux d'erreur élevé: {{ $value }}"

# Latence p99 > 2 secondes
- alert: HighLatencyP99
  expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Latence P99 élevée: {{ $value }}s"
```

### Procédures de Sauvegarde

#### Automatique (Cron quotidien)

```bash
# /etc/cron.d/algeriatrade-backup
0 2 * * * root /opt/algeriatrade/scripts/backup-production.sh
```

#### Manuel

```bash
# Backup complet
./deploy/api-portal/scripts/deploy.sh backup

# Restauration
./deploy/api-portal/scripts/deploy.sh rollback <backup_version>
```

### Plan de Reprise après Sinistre

**RTO (Recovery Time Objective)**: 30 minutes  
**RPO (Recovery Point Objective)**: 15 minutes

1. **Détection** (automatique, 2 min)
   - Health checks échouent
   - Alertes envoyées (Slack, SMS)

2. **Diagnostic** (5 min)
   - Identifier la cause
   - Décider: fix vs failover

3. **Failover** (si nécessaire, 10 min)
   - Promouvoir replica standby
   - Mettre à jour DNS (TTL bas: 60s)
   - Vérifier intégrité données

4. **Validation** (10 min)
   - Tests de santé complets
   - Vérification fonctionnalités critiques
   - Notification stakeholders

5. **Post-Incident**
   - Analyse root cause
   - Mise à jour runbook
   - Améliorations préventives

---

## Support & Contact

Pour toute question technique concernant le déploiement:

- **Email**: devops@algeriatrade.dz
- **Documentation**: https://docs.algeriatrade.dz
- **Statut système**: https://status.algeriatrade.dz
- **Urgences**: +213 XXX XXX XXX (24/7 production)

---

*Document version 1.0 - Mis à jour: $(date '+%Y-%m-%d')*
