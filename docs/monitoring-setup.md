# AlgeriaTrade.dz - Monitoring Setup Guide

## Guide de Configuration du Monitoring

**Version:** 1.0  
**Objectif:** Configurer un monitoring complet pour AlgeriaTrade.dz

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Uptime Monitoring](#uptime-monitoring)
3. [Error Tracking (Sentry)](#error-tracking-sentry)
4. [Log Aggregation](#log-aggregation)
5. [Performance Monitoring](#performance-monitoring)
6. [Alerting Configuration](#alerting-configuration)
7. [Dashboards](#dashboards)

---

## Vue d'ensemble

### Pourquoi le monitoring est crucial ?

Pour une plateforme B2B en Algérie :

- **Fiabilité** : Les entreprises dépendent de la plateforme 24/7
- **Performance** : Les connexions peuvent être lentes, l'optimisation est clé
- **Réactivité** : Détecter les problèmes avant les utilisateurs
- **Conformité** : Tracer les incidents pour audits

### Architecture de Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│                    ALGERIATRADE.DZ                          │
└──────────┬──────────┬──────────┬──────────┬────────────────┘
           │          │          │          │
    ┌──────▼────┐ ┌──▼─────┐ ┌──▼──────┐ ┌▼────────┐
    │ UptimeRobot│ │ Sentry │ │ Logtail │ │ APM     │
    │ / Pingdom  │ │        │ │         │         │
    └──────┬─────┘ └──┬─────┘ └──┬──────┘ └──┬──────┘
           │          │          │          │
           └──────────┼──────────┼──────────┘
                      │
               ┌──────▼──────┐
               │   Slack/    │
               │   Email     │
               │  Alerts     │
               └─────────────┘
```

---

## Uptime Monitoring

### Options Recommandées

| Service | Gratuit | Checks | Intervalle | Prix Paid |
|---------|---------|--------|------------|-----------|
| **UptimeRobot** | 50 checks | 5 min | Gratuit | $5/mo |
| **Pingdom** | 1 check | 5 min | $15/mo | $15/mo |
| **Better Uptime** | 10 checks | 60 sec | Gratuit | $8/mo |
| **StatusCake** | 10 checks | 5 min | Gratuit | $9/mo |

### Configuration UptimeRobot (Recommandé)

#### 1. Créer un compte

Allez sur [uptimerobot.com](https://uptimerobot.com) et créez un compte gratuit.

#### 2. Ajouter des monitors

**Monitor Principal - HTTP(s)**

```
Monitor Type: HTTP(s)
URL: https://algeriatrade.dz
Monitoring Interval: 5 minutes
Timeout: 30 seconds
Status: Paused → Active (après setup)
```

**Monitors API**

```
1. Health Check
   URL: https://algeriatrade.dz/api/health
   Expected: {"status":"healthy"}

2. Status Page
   URL: https://algeriatrade.dz/api/status
   Expected: 200 OK
```

**Monitors Spécifiques**

```
3. Login Page
   URL: https://algeriatrade.dz/login
   Keyword: "Connexion" or "Sign in"

4. Products Page  
   URL: https://algeriatrade.dz/products
   Keyword: "Produits"
```

#### 3. Configurer les alertes

**Alert Contacts**

1. Allez dans **Settings → Alert Contacts**
2. Ajoutez :
   - **Slack** (Webhook URL)
   - **Email** (admin@algeriatrade.dz)
   - **SMS** (optionnel, pour les incidents critiques)

**Règles d'alerte**

| Condition | Action |
|-----------|--------|
| Site down | Alert immédiate + SMS |
| Site up après down | Notification récupération |
| Response time > 5s | Warning (email seulement) |

#### 4. Status Page Publique

UptimeRobot offre une status page gratuite :

1. Allez dans **My Settings → Status Pages**
2. Créez une nouvelle page : `status.algeriatrade.dz`
3. Ajoutez vos monitors
4. Personnalisez avec votre branding

### Configuration Better Uptime (Alternative avec Status Page intégrée)

```yaml
# better-uptime-config.yaml (exemple)
monitors:
  - name: "AlgeriaTrade Main"
    url: "https://algeriatrade.dz"
    expected_status_codes:
      - 200
      - 301
      - 302
    check_frequency: 60
    regions:
      - eu-west  # Paris (proche Algérie)
      - us-east  # Backup
    
  - name: "API Health"
    url: "https://algeriatrade.dz/api/health"
    check_frequency: 60
    validation:
      body_contains: '"status":"healthy"'
    
incident_notifications:
  - type: slack
    webhook_url: ${SLACK_WEBHOOK}
    
  - type: email
    email: admin@algeriatrade.dz
```

---

## Error Tracking (Sentry)

### Pourquoi Sentry ?

- Capture automatique des erreurs JavaScript/TypeScript
- Stack traces détaillées
- Informations sur l'utilisateur/navigateur
- Release tracking
- Performance monitoring inclus

### Configuration Sentry

#### 1. Créer un projet Sentry

1. Allez sur [sentry.io](https://sentry.io)
2. Créez un compte (gratuit pour petits volumes)
3. Nouveau projet → Next.js

#### 2. Installer le SDK

```bash
# Avec bun
bun add @sentry/nextjs
```

#### 3. Initialiser Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

Le wizard va :
- Créer `sentry.client.config.ts`
- Créer `sentry.server.config.ts`
- Modifier `next.config.ts`
- Créer `.sentryclirc`

#### 4. Configurer manuellement (si nécessaire)

**`sentry.client.config.ts`**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environnement
  environment: process.env.NODE_ENV,
  
  // Sample rate (ajuster selon le trafic)
  tracesSampleRate: 0.1,  // 10% des requêtes
  
  // Replays (pour reproduire les bugs)
  replaysSessionSampleRate: 0.01,  // 1% des sessions
  replOnErrorSampleRate: 1.0,      // 100% des erreurs
  
  // Filtrer les erreurs non critiques
  ignoreErrors: [
    /NetworkError/i,
    /Failed to fetch/i,
    /Loading chunk \d+ failed/i,
    /Non-Error promise rejection captured/,
  ],
  
  // Avant d'envoyer, ajouter du contexte
  beforeSend(event) {
    // Filtrer les erreurs sensibles
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

**`sentry.server.config.ts`**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  
  // Intégration PostgreSQL
  integrations: [
    new Sentry.Integrations.Postgres(),
  ],
});
```

#### 5. Ajouter au `.env.production.example`

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

#### 6. Déployer avec Sentry

Le plugin Sentry va automatiquement créer une release à chaque déploiement :

```bash
# Dans CI/CD ou manuellement
npx @sentry/cli releases-new \
  $(git describe --tags --always --dirty) \
  --commit $(git rev-parse HEAD) \
  --finalize

# Upload source maps (optionnel, pour de meilleurs stack traces)
npx sentry-cli sourcemaps upload \
  ./next/static/chunks/ \
  --release $(git describe --tags --always --dirty)
```

### Bonnes Pratiques Sentry

1. **Tags personnalisés** : Ajouter des tags pour filtrer
   ```typescript
   Sentry.setTag('region', userWilaya);
   Sentry.setTag('userType', 'buyer' | 'seller');
   ```

2. **Breadcrumbs personnalisés** : Tracer les actions importantes
   ```typescript
   Sentry.addBreadcrumb({
     category: 'payment',
     message: 'Payment initiated',
     level: 'info',
   });
   ```

3. **User context** : Identifier les utilisateurs affectés
   ```typescript
   Sentry.setUser({
     id: userId,
     email: userEmail,
     segment: isPremium ? 'premium' : 'free',
   });
   ```

---

## Log Aggregation

### Options

| Service | Prix | Forces |
|---------|------|--------|
| **Logtail** | $0/mo (jusqu'à 1GB) | Simple, bon pour Next.js |
| **Papertrail** | $7/mo | Recherche puissante |
| **Datadog Logs** | $0.15/GB | Intégré Datadog |
| **Loki (self-hosted)** | Gratuit | Contrôle total |

### Configuration Logtail (Recommandé pour commencer)

#### 1. Inscription

1. Allez sur [betterstack.com/logtail](https://betterstack.com/logtail)
2. Créez un nouveau source : "Next.js"

#### 2. Installation

```bash
bun add @logtail/node @logtail/typescript
```

#### 3. Configuration

Créer `src/lib/logger.ts` :

```typescript
import Logtail from '@logtail/node';
import type { LogtailLog } from '@logtail/typescript';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

export const logger = {
  info: (message: string, extra?: object) => {
    logtail.info(message, { ...extra, app: 'algeriatrade' });
  },
  error: (message: string, error?: Error) => {
    logtail.error(message, {
      error: error?.message,
      stack: error?.stack,
      app: 'algeriatrade',
    });
  },
  warn: (message: string, extra?: object) => {
    logtail.warn(message, { ...extra, app: 'algeriatrade' });
  },
  debug: (message: string, extra?: object) => {
    if (process.env.NODE_ENV === 'development') {
      logtail.debug(message, { ...extra, app: 'algeriatrade' });
    }
  },
};
```

#### 4. Utilisation dans l'application

```typescript
// Dans vos routes API
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Processing request', { path: '/api/products' });
    // ...
  } catch (error) {
    logger.error('Request failed', error);
    // ...
  }
}
```

### Configuration Docker Logs

Dans `docker-compose.prod.yml`, la configuration logging est déjà incluse :

```yaml
logging:
  driver: json-file
  options:
    max-size: "50m"
    max-file: "5"
```

Pour envoyer vers un service externe, utilisez le driver approprié :

```yaml
# Exemple pour Loki
logging:
  driver: loki
  options:
    loki-url: "http://loki:3100/loki/api/v1/push"
    loki-labels: "job=algeriatrade,environment=production"
```

---

## Performance Monitoring

### Web Vitals (Intégré Vercel)

Vercel Analytics capture automatiquement :

- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1

Activez dans **Settings → Analytics**.

### Monitoring Personnalisé

Créer `src/lib/metrics.ts` :

```typescript
// Métriques personnalisées pour AlgeriaTrade

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

// Collecteur de métriques simple
class MetricsCollector {
  private buffer: MetricData[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(private endpoint: string) {
    this.flushInterval = setInterval(() => this.flush(), 30000);
  }

  record(name: string, value: number, tags?: Record<string, string>) {
    this.buffer.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });
  }

  // Temps de réponse API
  recordApiLatency(path: string, durationMs: number) {
    this.record('api.latency', durationMs, { path });
  }

  // Erreurs par type
  recordError(type: string) {
    this.record('errors.count', 1, { type });
  }

  // Requêtes par endpoint
  recordRequest(path: string) {
    this.record('requests.total', 1, { path });
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });
    } catch (error) {
      console.error('[Metrics] Flush failed:', error);
    }
  }
}

export const metrics = new MetricsCollector(
  process.env.METRICS_ENDPOINT || '/api/metrics'
);
```

### Middleware de Mesure

Ajouter dans `src/middleware.ts` :

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();

  // Continuer la requête et mesurer après
  const response = NextResponse.next();

  // Ajouter header de timing (visible dans DevTools)
  response.headers.set('x-response-time', `${Date.now() - start}ms`);

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/products/:path*'],
};
```

---

## Alerting Configuration

### Règles d'Alerte Recommandées

#### Critiques (Immédiat + SMS + Appel)

| Condition | Seuil | Action |
|-----------|-------|--------|
| Site down | Any | PagerDuty + SMS |
| Error rate > 20% | 5 min | Slack + Email |
| Database unavailable | Immediate | PagerDuty |

#### Majeures (30 min + Email + Slack)

| Condition | Seuil | Action |
|-----------|-------|--------|
| P95 latency > 5s | 10 min | Slack channel #alerts |
| Error rate > 5% | 15 min | Email équipe dev |
| Disk space > 90% | 30 min | Email ops |

#### Mineures (Daily digest)

| Condition | Seuil | Action |
|-----------|-------|--------|
| P95 latency > 2s | Sustained 1h | Daily report |
| Memory usage > 80% | Sustained | Weekly review |
| Slow queries detected | Any | Weekly report |

### Configuration Slack

Créer un webhook Slack :

1. **Slack App Settings → Incoming Webhooks**
2. Créer un nouveau webhook vers `#alerts`
3. Copier l'URL

**Configuration webhook** :

```javascript
// slack-webhook.js (exemple)
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendSlackAlert({ title, color, fields }) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color: color === 'error' ? 'danger' : 
                color === 'warning' ? 'warning' : 'good',
        title: `[${color.toUpperCase()}] ${title}`,
        fields: fields.map(f => ({
          title: f.label,
          value: f.value,
          short: true,
        })),
        footer: 'AlgeriaTrade Monitor',
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });
}
```

### Escalation Matrix

```
Level 1: Developer on-call (Slack + Email)
    ↓ 15 min sans réponse
Level 2: Tech Lead (Slack + SMS)
    ↓ 30 min sans réponse  
Level 3: CTO (Appel téléphonique)
    ↓ Incident critique
Level 4: All-hands (Page everyone)
```

---

## Dashboards

### Dashboard Principal (Recommandé)

Utilisez **Grafana** (auto-hébergé) ou **Datadog** (cloud).

#### Métriques Essentielles

**1. Overview**

| Widget | Type | Source |
|--------|------|--------|
| Uptime % | Gauge | UptimeRobot |
| Requests/min | Graph | Application |
| Error Rate | Graph | Sentry |
| Avg Response Time | Graph | APM |
| Active Users | Number | Analytics |

**2. Infrastructure**

| Widget | Type | Source |
|--------|------|--------|
| CPU Usage | Graph | Server/Docker |
| Memory Usage | Graph | Server/Docker |
| Disk Usage | Single Stat | Server |
| DB Connections | Graph | PostgreSQL |
| Redis Memory | Graph | Redis |

**3. Business Metrics**

| Widget | Type | Source |
|--------|------|--------|
| New Registrations | Counter | DB Query |
| Products Listed | Counter | DB Query |
| RFQs Created | Counter | DB Query |
| Messages Sent | Counter | DB Query |

### Template Grafana

```json
{
  "dashboard": {
    "title": "AlgeriaTrade Production",
    "panels": [
      {
        "title": "Requests per Minute",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (endpoint)",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error %"
          }
        ],
        "thresholds": [
          { "value": 5, "colorMode": "warning" },
          { "value": 20, "colorMode": "critical" }
        ]
      }
    ]
  }
}
```

---

## Checklist Setup Complet

- [ ] Uptime monitoring configuré (UptimeRobot/Better Uptime)
- [ ] Status page publique créée
- [ ] Sentry installé et configuré
- [ ] Source maps uploadés (optionnel)
- [ ] Log aggregation actif (Logtail/Papertrail)
- [ ] Dashboards créés
- [ ] Alertes configurées (Slack + Email)
- [ ] Escalade matrix définie
- [ ] Runbook documenté
- [ ] Test d'alertes effectué

---

*Ressources :*
- [Sentry Docs](https://docs.sentry.io)
- [UptimeRobot API](https://uptimerobot.com/api)
- [Logtail Docs](https://betterstack.com/docs/logtail)
