# AlgeriaTrade.dz Phase 9 - Environment Variables Reference

> **Complete reference documentation for all environment variables used in AlgeriaTrade.dz Phase 9 services.**
>
> **Version:** 9.0.0  
> **Last Updated:** January 2025  
> **Environment:** Production / Staging / Development

---

## Table of Contents

1. [Security Guidelines](#security-guidelines)
2. [Application Core](#1-application-core)
3. [Database (PostgreSQL)](#2-database-postgresql)
4. [Redis (Cache & Queues)](#4-redis-cache--queues)
5. [AI Business Intelligence](#5-ai-business-intelligence)
6. [Blockchain Supply Chain](#6-blockchain-supply-chain)
7. [Advanced Analytics](#7-advanced-analytics)
8. [Compliance Engine](#8-compliance-engine)
9. [PWA + Mobile](#9-pwa--mobile)
10. [API Developer Portal](#10-api-developer-portal)
11. [Edge Computing / CDN](#11-edge-computing--cdn)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Email Service](#13-email-service)
14. [Object Storage (S3)](#14-object-storage-s3)
15. [Authentication (NextAuth.js)](#15-authentication-nextauthjs)
16. [Payment Configuration](#16-payment-configuration)
17. [Security Settings](#17-security-settings)
18. [Feature Flags](#18-feature-flags)
19. [Algeria-Specific Configuration](#19-algeria-specific-configuration)

---

## Security Guidelines

### ⚠️ CRITICAL SECURITY WARNINGS

| Warning | Details |
|---------|---------|
| **Never commit .env files** | Add `*.env*` to `.gitignore` immediately |
| **Use secrets manager** | Production secrets should be stored in HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault |
| **Rotate keys regularly** | Set calendar reminders for quarterly key rotation |
| **Principle of least privilege** | Use minimal required permissions for all API keys |
| **Audit access logs** | Monitor who accesses configuration values |
| **Encrypt at rest** | Ensure storage volumes are encrypted |

### File Permissions

```bash
# Secure your environment files
chmod 600 .env.production
chmod 600 .env.staging
chmod 600 .env.local
```

### Secret Generation

```bash
# Generate secure random strings
openssl rand -base64 32        # 32-byte base64 encoded secret
openssl rand -hex 32           # 64-character hex string
openssl rand -hex 16           # 32-character hex string

# Generate VAPID keys
npx web-push generate-vapid-keys

# Generate Ethereum private key
openssl rand -hex 32 | xargs printf '0x%s'
```

---

## 1. Application Core

### NODE_ENV

| Property | Value |
|----------|-------|
| **Description** | Node.js execution environment mode |
| **Default** | `development` |
| **Required** | Yes |
| **Example** | `production`, `staging`, `development` |
| **Notes** | Controls optimization, error handling, and logging behavior |

### NEXT_PUBLIC_APP_NAME

| Property | Value |
|----------|-------|
| **Description** | Application display name (exposed to client) |
| **Default** | `AlgeriaTrade.dz` |
| **Required** | No |
| **Example** | `AlgeriaTrade.dz` |
| **Security** | Safe to expose publicly |

### NEXT_PUBLIC_APP_URL

| Property | Value |
|----------|-------|
| **Description** | Public-facing application URL |
| **Default** | `http://localhost:3000` |
| **Required** | Yes (production) |
| **Example** | `https://www.algeriatrade.dz` |
| **Security** | Public information |

### NEXT_PUBLIC_API_URL

| Property | Value |
|----------|-------|
| **Description** | API gateway base URL |
| **Default** | `http://localhost:3000/api` |
| **Required** | Yes (production) |
| **Example** | `https://api.algeriatrade.dz` |
| **Security** | Public information |

### NEXT_PUBLIC_WS_URL

| Property | Value |
|----------|-------|
| **Description** | WebSocket server URL for real-time features |
| **Default** | `ws://localhost:3000` |
| **Required** | If using WebSocket features |
| **Example** | `wss://ws.algeriatrade.dz` |
| **Security** | Must use WSS in production |

### PORT

| Property | Value |
|----------|-------|
| **Description** | Application listen port |
| **Default** | `3000` |
| **Required** | No |
| **Example** | `3000`, `8080` |
| **Notes** | Override only if port conflicts exist |

### NEXT_TELEMETRY_DISABLED

| Property | Value |
|----------|-------|
| **Description** | Disable Next.js telemetry data collection |
| **Default** | `undefined` (telemetry enabled) |
| **Required** | No |
| **Example** | `1`, `true` |
| **Recommendation** | Always set to `1` in production |

---

## 2. Database (PostgreSQL)

### DATABASE_URL

| Property | Value |
|----------|-------|
| **Description** | Primary PostgreSQL connection string with SSL |
| **Default** | None |
| **Required** | **Yes - Critical** |
| **Example** | `postgresql://user:pass@host:5432/db?sslmode=require` |
| **Security** | 🔴 **HIGHLY SENSITIVE** - Contains credentials |

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require&schema=public
```

**Production Configuration (OVHcloud Managed PostgreSQL):**
```env
DATABASE_URL="postgresql://algeriatrade_prod:xxx@postgresql-algeriatrade.db.ovh.net:5432/algeriatrade_prod?sslmode=require&schema=public"
```

### DATABASE_POOL_MIN

| Property | Value |
|----------|-------|
| **Description** | Minimum database connections in pool |
| **Default** | `5` |
| **Required** | No |
| **Example** | `10` |
| **Notes** | Production: 10-20, Staging: 5 |

### DATABASE_POOL_MAX

| Property | Value |
|----------|-------|
| **Description** | Maximum database connections in pool |
| **Default** | `20` |
| **Required** | No |
| **Example** | `50` |
| **Notes** | Production: 50-100 based on load |

### DATABASE_REPLICA_URL

| Property | Value |
|----------|-------|
| **Description** | Read replica connection string for read-heavy queries |
| **Default** | Same as DATABASE_URL |
| **Required** | Recommended for production |
| **Example** | `postgresql://reader:pass@replica-host:5432/db?sslmode=require` |
| **Security** | 🔴 **SENSITIVE** |

### DIRECT_URL

| Property | Value |
|----------|-------|
| **Description** | Direct database URL for Prisma migrations |
| **Default** | `${DATABASE_URL}` |
| **Required** | Yes |
| **Notes** | Usually same as DATABASE_URL unless using connection pooling like PgBouncer |

---

## 4. Redis (Cache & Queues)

### REDIS_PRIMARY_URL

| Property | Value |
|----------|-------|
| **Description** | Primary Redis instance connection URL |
| **Default** | None |
| **Required** | **Yes** (for caching/rate limiting) |
| **Example** | `redis://:password@redis-host:6379/0` |
| **Security** | 🔴 **SENSITIVE** - Contains password |

**Redis Namespace Prefixes:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `REDIS_SESSION_PREFIX` | User session storage | `at:session:` |
| `REDIS_CACHE_PREFIX` | Response caching | `at:cache:` |
| `REDIS_RATE_LIMIT_PREFIX` | Rate limit counters | `at:rl:` |
| `REDIS_QUEUE_PREFIX` | Job queue entries | `at:queue:` |

### REDIS_TLS_ENABLED

| Property | Value |
|----------|-------|
| **Description** | Enable TLS for Redis connections |
| **Default** | `false` |
| **Required** | No |
| **Example** | `true` |
| **Recommendation** | Always enable in production |

---

## 5. AI Business Intelligence

### OpenAI Configuration

#### OPENAI_API_KEY

| Property | Value |
|----------|-------|
| **Description** | OpenAI API key for GPT models |
| **Default** | None |
| **Required** | If using AI features |
| **Example** | `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx` |
| **Security** | 🔴 **CRITICAL** - Billing access |
| **Get from** | https://platform.openai.com/api-keys |

#### OPENAI_MODEL_GPT4

| Property | Value |
|----------|-------|
| **Description** | Default GPT model for AI operations |
| **Default** | `gpt-4-turbo-preview` |
| **Required** | No |
| **Options** | `gpt-4-turbo-preview`, `gpt-4o`, `gpt-3.5-turbo` |
| **Cost Note** | GPT-4 is ~10x more expensive than GPT-3.5 |

#### OPENAI_MODEL_EMBEDDING

| Property | Value |
|----------|-------|
| **Description** | Embedding model for vector search/recommendations |
| **Default** | `text-embedding-3-large` |
| **Required** | If using semantic search |
| **Options** | `text-embedding-3-large`, `text-embedding-3-small`, `text-embedding-ada-002` |

### Anthropic Configuration

#### ANTHROPIC_API_KEY

| Property | Value |
|----------|-------|
| **Description** | Anthropic API key for Claude models |
| **Default** | None |
| **Required** | Optional (alternative to OpenAI) |
| **Example** | `sk-ant-api03-xxxxxxxxxxxx` |
| **Security** | 🔴 **CRITICAL** |
| **Get from** | https://console.anthropic.com/settings/keys |

#### ANTHROPIC_MODEL_CLAUDE

| Property | Value |
|----------|-------|
| **Description** | Claude model for compliance analysis tasks |
| **Default** | `claude-3-opus-20240229` |
| **Required** | No |
| **Options** | `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307` |

### AI Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_DEMAND_FORECASTING_ENABLED` | Enable demand prediction | `true` |
| `AI_RECOMMENDATION_ENABLED` | Enable product recommendations | `true` |
| `AI_PRICE_OPTIMIZATION_ENABLED` | Enable dynamic pricing suggestions | `true` |
| `AI_FORECAST_HORIZON_DAYS` | Days ahead for forecasts | `90` |
| `AI_CACHE_TTL_SECONDS` | Cache AI responses (seconds) | `3600` |
| `AI_USE_MOCK_DATA_FALLBACK` | Use mock data when API fails | `false` (prod), `true` (stag) |

---

## 6. Blockchain Supply Chain

### BLOCKCHAIN_ENABLED

| Property | Value |
|----------|-------|
| **Description** | Master switch for blockchain features |
| **Default** | `false` |
| **Required** | No |
| **Example** | `true` |

### BLOCKCHAIN_PRIVATE_KEY

| Property | Value |
|----------|-------|
| **Description** | Private key for signing certificates on-chain |
| **Default** | None |
| **Required** | If blockchain enabled |
| **Format** | `0x` + 64 hexadecimal characters |
| **Example** | `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef` |
| **Security** | 🔴🔴 **EXTREMELY CRITICAL** - Controls certificate authority |
| **Warning** | **BACKUP SECURELY! Lost keys = lost certificates!** |

### BLOCKCHAIN_NETWORK

| Property | Value |
|----------|-------|
| **Description** | Target blockchain network |
| **Default** | `mainnet` |
| **Required** | Yes (if enabled) |
| **Options** | `mainnet`, `sepolia`, `goerli`, `polygon`, `custom` |
| **Production** | Use dedicated private chain or mainnet |
| **Staging** | Always use testnet (`sepolia`) |

### Blockchain Network Settings

| Variable | Description | Production | Staging |
|----------|-------------|------------|---------|
| `BLOCKCHAIN_CHAIN_ID` | EVM chain ID | `1337` (custom) | `11155111` (Sepolia) |
| `BLOCKCHAIN_RPC_URL` | JSON-RPC endpoint | Custom RPC | `https://rpc.sepolia.org` |
| `BLOCKCHAIN_CONFIRMATIONS_REQUIRED` | Blocks to wait for finality | `12` | `2` |
| `BLOCKCHAIN_GAS_PRICE_GWEI` | Gas price in gwei | `30` | `20` |

### Certificate Authority (CA) Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `BLOCKCHAIN_CA_COMMON_NAME` | CA display name | `AlgeriaTrade Certificate Authority` |
| `BLOCKCHAIN_CA_COUNTRY` | ISO country code | `DZ` |
| `BLOCKCHAIN_CA_ORGANIZATION` | Legal entity name | `AlgeriaTrade SARL` |
| `BLOCKCHAIN_CA_EMAIL` | Contact email | `ca@algeriatrade.dz` |
| `BLOCKCHAIN_CERTIFICATE_VALIDITY_DAYS` | Cert expiration | `365` (prod), `7` (stag) |

---

## 7. Advanced Analytics

### Google Analytics 4

#### ANALYTICS_GOOGLE_MEASUREMENT_ID

| Property | Value |
|----------|-------|
| **Description** | GA4 Measurement ID |
| **Default** | None |
| **Required** | For web analytics |
| **Format** | `G-XXXXXXXXXX` |
| **Get from** | Admin → Data Streams → Measurement ID |

#### ANALYTICS_DATA_RETENTION_DAYS

| Property | Value |
|----------|-------|
| **Description** | How long to retain user-level data |
| **Default** | `730` (2 years) |
| **Required** | No |
| **Options** | `14`, `27`, `90`, `180`, `365`, `730` |
| **GDPR Note** | Consider shorter retention for EU users |

### ClickHouse (Analytics Database)

| Variable | Description | Required |
|----------|-------------|---------|
| `ANALYTICS_CLICKHOUSE_URL` | HTTP interface URL | For advanced analytics |
| `ANALYTICS_CLICKHOUSE_DATABASE` | Database name | Yes (if using CH) |
| `ANALYTICS_CLICKHOUSE_USER` | Write user | Yes |
| `ANALYTICS_CLICKHOUSE_PASSWORD` | Password | Yes (sensitive) |

### Kafka (Event Streaming)

| Variable | Description | Example |
|----------|-------------|--------|
| `ANALYTICS_KAFKA_BROKERS` | Comma-separated broker list | `kafka-1:9092,kafka-2:9092` |
| `ANALYTICS_KAFKA_TOPIC_EVENTS` | Topic for user events | `at.events.production` |
| `ANALYTICS_KAFKA_TOPIC_METRICS` | Topic for metrics | `at.metrics.production` |

---

## 8. Compliance Engine

### COMPLIANCE_ENABLED

| Property | Value |
|----------|-------|
| **Description** | Master switch for compliance checks |
| **Default** | `false` |
| **Required** | No |
| **Production** | Should always be `true` |

### Algerian Regulatory Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `COMPLIANCE_JURISDICTION` | Primary legal jurisdiction | `DZ` |
| `COMPLIANCE_DEFAULT_CURRENCY` | Base currency | `DZD` |
| `COMPLIANCE_VAT_RATE` | Standard TVA rate (%) | `19` |
| `COMPLIANCE_VAT_REDUCED_RATE` | Reduced TVA rate (%) | `9` |
| `COMPLIANCE_NIF_LENGTH` | NIF number length | `15` |
| `COMPLIANCE_NIS_LENGTH` | NIS number length | `15` |

### External APIs

| Variable | Description | Provider |
|----------|-------------|----------|
| `COMPLIANCE_COMPANY_REGISTRY_API` | OGEC/RCCM verification | Algerian government |
| `COMPLIANCE_SANCTIONS_API_URL` | UN sanctions list | United Nations |
| `COMPLIANCE_OFAC_API_URL` | OFAC SDN list | US Treasury |
| `COMPLIANCE_PEP_DATABASE_URL` | Politically Exposed Persons | Commercial DB |
| `COMPLIANCE_LEGAL_DATABASE_URL` | Algerian law references | Internal/External |
| `COMPLIANCE_CUSTOMS_INTEGRATION_URL` | Douane Algérienne API | Algerian Customs |

### Screening Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `COMPLIANCE_SCREENING_MATCH_THRESHOLD` | Minimum match score (0-100) | `85` |
| `COMPLIANCE_AUTO_BLOCK_HIGH_RISK` | Auto-block high-risk matches | `true` |
| `COMPLIANCE_ALERT_EMAIL` | Compliance alert recipient | `compliance@algeriatrade.dz` |
| `COMPLIANCE_AUDIT_LOG_RETENTION_DAYS` | Keep audit logs for | `2555` (7 years) |
| `COMPLIANCE_DATA_LOCALIZATION_ENFORCED` | Force DZ data residency | `true` |

---

## 9. PWA + Mobile

### Web Push (VAPID)

#### PWA_VAPID_PRIVATE_KEY

| Property | Value |
|----------|-------|
| **Description** | VAPID private key for web push authentication |
| **Default** | None |
| **Required** | For push notifications |
| **Format** | Base64URL-encoded ECDSA P-256 private key |
| **Generate** | `npx web-push generate-vapid-keys` |
| **Security** | 🔴 **SENSITIVE** |

#### PWA_VAPID_PUBLIC_KEY

| Property | Value |
|----------|-------|
| **Description** | VAPID public key (can be exposed to client) |
| **Default** | None |
| **Required** | For push notifications |
| **Format** | Base64URL-encoded, starts with `BM` or `B` |

### Firebase Cloud Messaging (Android)

| Variable | Description | Required |
|----------|-------------|---------|
| `FCM_PROJECT_ID` | Firebase project ID | Android pushes |
| `FCM_SERVICE_ACCOUNT` | JSON service account key | Yes |
| `FCM_API_KEY` | Server/Firebase API key | Yes |

### Apple Push Notification Service (iOS)

| Variable | Description | Required |
|----------|-------------|---------|
| `APNS_KEY_ID` | Apple key ID from developer portal | iOS pushes |
| `APNS_TEAM_ID` | Apple Developer Team ID | Yes |
| `APNS_PRIVATE_KEY_PATH` | Path to .p8 auth key file | Yes |
| `APNS_BUNDLE` | App bundle identifier | Yes |
| `APNS_ENVIRONMENT` | `production` or `sandbox` | Yes |

### Offline/Sync Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `PWA_OFFLINE_SYNC_ENABLED` | Enable background sync | `true` |
| `PWA_SYNC_QUEUE_SIZE` | Max pending sync items | `500` |
| `PWA_SYNC_RETRY_ATTEMPTS` | Retry failed syncs N times | `5` |
| `PWA_OFFLINE_STORAGE_QUOTA_MB` | IndexedDB quota (MB) | `100` |
| `PWA_CACHE_VERSION` | Cache busting version | `v9.0.0` |

---

## 10. API Developer Portal

### JWT Authentication

#### JWT_SECRET

| Property | Value |
|----------|-------|
| **Description** | Secret key for signing JWT tokens |
| **Default** | None |
| **Required** | **Yes - Critical** |
| **Minimum Length** | 32 characters |
| **Algorithm** | HS256 |
| **Security** | 🔴🔴 **CRITICAL** - Token forgery if compromised |
| **Rotate** | Every 90 days recommended |

#### JWT_ACCESS_TOKEN_EXPIRY

| Property | Value |
|----------|-------|
| **Description** | Access token lifetime (seconds) |
| **Default** | `900` (15 minutes) |
| **Range** | `300` - `3600` |
| **Recommendation** | Short-lived for security |

#### JWT_REFRESH_TOKEN_EXPIRY

| Property | Value |
|----------|-------|
| **Description** | Refresh token lifetime (seconds) |
| **Default** | `604800` (7 days) |
| **Range** | `86400` - `2592000` |

### Rate Limiting Tiers

| Tier | Requests/Minute | Burst | Use Case |
|------|-----------------|-------|----------|
| Free | `60` | `180` | Hobby developers |
| Standard | `500` | `1500` | SMB integration |
| Premium | `2000` | `6000` | Enterprise partners |
| Enterprise | `10000` | `30000` | High-volume API |

**Configuration Variables:**
- `RATE_LIMIT_TIERS_FREE`
- `RATE_LIMIT_TIERS_STANDARD`
- `RATE_LIMIT_TIERS_PREMIUM`
- `RATE_LIMIT_TIERS_ENTERPRISE`
- `RATE_LIMIT_BURST_MULTIPLIER`

### Webhook Configuration

| Variable | Description | Security |
|----------|-------------|----------|
| `WEBHOOK_SECRET` | HMAC signing secret for webhook payloads | 🔴 **CRITICAL** |
| `WEBHOOK_MAX_RETRIES` | Retry failed deliveries | `5` |
| `WEBHOOK_RETRY_INTERVAL_MS` | Delay between retries | `60000` |
| `WEBHOOK_ALLOWED_EVENTS` | Comma-separated event types | Filter what triggers webhooks |

---

## 11. Edge Computing / CDN

### Cloudflare Configuration

#### CLOUDFLARE_ZONE_ID

| Property | Value |
|----------|-------|
| **Description** | Cloudflare zone ID for domain |
| **Default** | None |
| **Required** | If using Cloudflare CDN |
| **Find at** | Dashboard → Domain → Overview → Zone ID |
| **Format** | 32-character hex string |

#### CLOUDFLARE_API_TOKEN

| Property | Value |
|----------|-------|
| **Description** | Cloudflare API token with Zone:Edit permissions |
| **Default** | None |
| **Required** | For programmatic cache purging |
| **Permissions Needed** | Zone.Zone, Zone.DNS, Zone.Purge |
| **Security** | 🔴 **SENSITIVE** |

### Caching TTL Settings

| Variable | Description | Production Value |
|----------|-------------|------------------|
| `CLOUDFLARE_CACHE_TTL_STATIC` | Static assets (JS/CSS/images) | `2592000` (30 days) |
| `CLOUDFLARE_CACHE_TTL_API` | API responses | `60` (1 min) |
| `CLOUDFLARE_CACHE_TTL_ASSETS` | Uploaded documents | `86400` (24 hours) |

### Security Headers (Edge Level)

| Header | Variable | Recommended Value |
|--------|----------|-------------------|
| HSTS | `EDGE_HEADER_STRICT_TRANSPORT_SECURITY` | `max-age=31536000; includeSubDomains; preload` |
| CSP | `EDGE_HEADER_CONTENT_SECURITY_POLICY` | See below |
| X-Frame-Options | `EDGE_HEADER_X_FRAME_OPTIONS` | `SAMEORIGIN` |
| X-Content-Type | `EDGE_HEADER_X_CONTENT_TYPE_OPTIONS` | `nosniff` |
| Referrer-Policy | `EDGE_HEADER_REFERRER_POLICY` | `strict-origin-when-cross-origin` |

**CSP Example:**
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://*.google-analytics.com; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
font-src 'self' https://fonts.gstatic.com; 
img-src 'self' data: https: blob:; 
connect-src 'self' wss:;
```

---

## 12. Monitoring & Observability

### Sentry (Error Tracking)

#### SENTRY_DSN

| Property | Value |
|----------|-------|
| **Description** | Sentry Data Source Name |
| **Default** | None |
| **Required** | For error tracking |
| **Format** | `https://xxx@sentry.example.com/project-id` |
| **Get from** | Sentry Project Settings → Client Keys (DSN) |

### Sampling Rates

| Variable | Description | Production | Staging |
|----------|-------------|------------|---------|
| `SENTRY_SAMPLE_RATE` | Error capture rate | `0.2` (20%) | `1.0` (100%) |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance tracing | `0.05` (5%) | `1.0` (100%) |
| `SENTRY_PROFILES_SAMPLE_RATE` | Profiling data | `0.01` (1%) | `0.5` (50%) |

### Grafana

| Variable | Description | Access Level |
|----------|-------------|--------------|
| `GRAFANA_URL` | Grafana dashboard URL | Public/Internal |
| `GRAFANA_ADMIN_PASSWORD` | Admin user password | 🔴 **SENSITIVE** |
| `GRAFANA_API_KEY` | API key for provisioning | 🔴 **SENSITIVE** |

### Logging Configuration

| Variable | Description | Options |
|----------|-------------|---------|
| `LOG_LEVEL` | Minimum log level | `debug`, `info`, `warn`, `error`, `fatal` |
| `LOG_FORMAT` | Output format | `json`, `text` |
| `LOG_OUTPUT` | Log destination | `stdout`, `file`, `both` |
| `LOG_FILE_PATH` | File path for file output | `/var/log/algeriatrade/app.log` |
| `LOG_MAX_SIZE_MB` | Rotation size | `100` |
| `LOG_MAX_FILES` | Keep N rotated files | `10` |

---

## 13. Email Service

### SendGrid Configuration

#### SENDGRID_API_KEY

| Property | Value |
|----------|-------|
| **Description** | SendGrid API key for transactional emails |
| **Default** | None |
| **Required** | For email sending |
| **Permissions** | Mail Send > Full Access |
| **Get from** | https://app.sendgrid.com/settings/api_keys |
| **Security** | 🔴 **SENSITIVE** |

### Email Templates

| Variable | Template ID For | Notes |
|----------|------------------|-------|
| `SENDGRID_TEMPLATE_VERIFICATION` | Email verification | Required |
| `SENDGRID_TEMPLATE_COMPLIANCE_ALERT` | Compliance warnings | Phase 9 |
| `SENDGRID_TEMPLATE_WEEKLY_REPORT` | Weekly analytics digest | Optional |
| `SENDGRID_TEMPLATE_WELCOME` | New user welcome | Recommended |

### Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_MAX_PER_HOUR` | Max sends per hour | `1000` |
| `EMAIL_SEND_TO_DEVELOPERS_ONLY` | Staging override | `false` (prod), `true` (stag) |

---

## 14. Object Storage (S3)

### OVHcloud Object Storage Configuration

| Variable | Description | Example |
|----------|-------------|--------|
| `S3_ENDPOINT` | S3-compatible endpoint | `s3.gra.cloud.ovh.net` |
| `S3_REGION` | Storage region | `gra` (Gravelines) |
| `S3_BUCKET_DOCUMENTS` | Documents bucket | `algeriatrade-docs-prod` |
| `S3_BUCKET_IMAGES` | Images bucket | `algeriatrade-images-prod` |
| `S3_BUCKET_EXPORTS` | Report exports | `algeriatrade-exports-prod` |
| `S3_BUCKET_BACKUPS` | Database backups | `algeriatrade-backups-prod` |
| `S3_ACCESS_KEY_ID` | S3 access key | `OVH generated` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | 🔴 **SENSITIVE** |
| `S3_CDN_DOMAIN` | CDN domain for objects | `cdn.algeriatrade.dz` |

### Upload Limits

| Variable | Description | Default |
|----------|-------------|---------|
| `S3_UPLOAD_MAX_SIZE_MB` | Maximum upload size | `50` |
| `S3_PRESIGNED_URL_EXPIRY` | Signed URL validity (seconds) | `3600` (1 hour) |

---

## 15. Authentication (NextAuth.js)

### NEXTAUTH_SECRET

| Property | Value |
|----------|-------|
| **Description** | Secret used to encrypt NextAuth JWT tokens |
| **Default** | None |
| **Required** | **Yes - Critical** |
| **Minimum Length** | 32 characters |
| **Generate** | `openssl rand -base64 32` |
| **Security** | 🔴🔴 **CRITICAL** |

### OAuth Providers

| Variable | Provider | Get From |
|----------|----------|----------|
| `AUTH_GOOGLE_ID` | Google OAuth | Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth | Google Cloud Console |
| `AUTH_MICROSOFT_CLIENT_ID` | Microsoft Entra ID | Azure Portal |
| `AUTH_MICROSOFT_CLIENT_SECRET` | Microsoft Entra ID | Azure Portal |

---

## 16. Payment Configuration

### SATIM (Algerian Payment Gateway)

| Variable | Description | Environment |
|----------|-------------|-------------|
| `SATIM_ENVIRONMENT` | `production` or `test` | **Always test first** |
| `SATIM_MERCHANT_ID` | Assigned by SATIM/CIB | Contact bank |
| `SATIM_TERMINAL_ID` | POS terminal ID | Contact bank |
| `SATIM_SECRET_KEY` | API secret key | 🔴 **CRITICAL** |
| `SATIM_CALLBACK_URL` | Payment callback URL | Must be HTTPS |

### Stripe (International Payments)

| Variable | Description | Format |
|----------|-------------|-------|
| `STRIPE_SECRET_KEY` | Secret API key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Client-side key | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature | `whsec_...` |

---

## 17. Security Settings

### CSRF Protection

#### CSRF_SECRET

| Property | Value |
|----------|-------|
| **Description** | Secret for CSRF token generation |
| **Default** | None |
| **Required** | Yes |
| **Minimum Length** | 32 characters |

### Encryption

#### ENCRYPTION_KEY

| Property | Value |
|----------|-------|
| **Description** | AES-256 encryption key for sensitive data at rest |
| **Default** | None |
| **Required** | Yes |
| **Format** | 64 hexadecimal characters (32 bytes) |
| **Generate** | `openssl rand -hex 32` |
| **Security** | 🔴🔴 **CRITICAL** - Decrypts all encrypted data |

### Cookie Settings

| Variable | Production | Staging | Description |
|----------|------------|---------|-------------|
| `COOKIE_SECURE` | `true` | `true` | HTTPS only |
| `COOKIE_SAME_SITE` | `strict` | `lax` | Cross-site policy |
| `COOKIE_DOMAIN` | `.algeriatrade.dz` | `.staging.algeriatrade.dz` | Scope |

### Brute Force Protection

| Variable | Description | Default |
|----------|-------------|---------|
| `BRUTE_FORCE_MAX_ATTEMPTS` | Failed attempts before lockout | `5` (prod), `20` (stag) |
| `BRUTE_FORCE_LOCKOUT_MINUTES` | Lockout duration | `15` (prod), `5` (stag) |

---

## 18. Feature Flags

All Phase 9 feature flags follow the pattern `FEATURE_[MODULE_NAME]`.

| Flag | Module | Default (Prod) | Description |
|------|--------|----------------|-------------|
| `FEATURE_AI_BUSINESS_INTELLIGENCE` | AI BI | `true` | Demand forecasting, recommendations |
| `FEATURE_BLOCKCHAIN_SUPPLY_CHAIN` | Blockchain | `true` | Certificates, document hashing |
| `FEATURE_ADVANCED_ANALYTICS` | Analytics | `true` | Real-time dashboards, reports |
| `FEATURE_COMPLIANCE_ENGINE` | Compliance | `true` | Sanctions screening, legal validation |
| `FEATURE_PWA_MOBILE` | Mobile | `true` | Push notifications, offline mode |
| `FEATURE_API_DEVELOPER_PORTAL` | API Portal | `true` | Developer docs, API keys |
| `FEATURE_EDGE_COMPUTING` | CDN/Edge | `true` | Cloudflare Workers, edge functions |
| `FEATURE_ENTERPRISE_DASHBOARD` | Enterprise | `true` | Advanced admin features |
| `FEATURE_VIDEO_INSPECTION` | Inspection | `true` | Video-based product inspection |
| `FEATURE_NEGOTIATION_AI` | Negotiation | `true` | AI-assisted deal negotiation |
| `FEATURE_ESCROW_PAYMENTS` | Payments | `true` | Escrow payment protection |

---

## 19. Algeria-Specific Configuration

### Localization

| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_LOCALE` | Default language/locale | `ar-DZ` |
| `SUPPORTED_LOCALES` | Available locales | `ar-DZ,fr-DZ,en-US` |
| `TIMEZONE` | Server timezone | `Africa/Algiers` |
| `DATE_FORMAT` | Date display format | `DD/MM/YYYY` |
| `NUMBER_FORMAT` | Number formatting | `fr-DZ` |

### Business Identifiers

| Variable | Description | Validation |
|----------|-------------|------------|
| `VAT_NUMBER_FORMAT` | TVA/NIF pattern | `XXXXXXXXXXX` (11 digits) |
| `NIF_LENGTH` | Numéro d'Identification Fiscale | 15 characters |
| `NIS_LENGTH` | Numéro d'Identification Statistique | 15 characters |
| `RC_NUMBER_FORMAT` | Registre de Commerce format | `XX/XX-XXXXXXX` |
| `WILAYA_COUNT` | Number of Algerian provinces | 58 |

### Currency

| Variable | Value |
|----------|-------|
| `CURRENCY_CODE` | `DZD` (Algerian Dinar) |
| `CURRENCY_SYMBOL` | `DA` or `د.ج` |
| `COMPLIANCE_VAT_RATE` | 19% (standard), 9% (reduced) |

---

## Quick Reference Card

### Critical Secrets (Rotate Quarterly)

```
JWT_SECRET, NEXTAUTH_SECRET, ENCRYPTION_KEY,
BLOCKCHAIN_PRIVATE_KEY, SENDGRID_API_KEY,
STRIPE_SECRET_KEY, S3_SECRET_ACCESS_KEY
```

### External API Keys (Check Usage Monthly)

```
OPENAI_API_KEY, ANTHROPIC_API_KEY,
SENTRY_DSN, CLOUDFLARE_API_TOKEN,
COMPLIANCE_SANCTIONS_API_KEY
```

### Environment Detection

```bash
# Check current environment
echo $NODE_ENV

# Validate config
./scripts/setup-env.sh --check-only production

# Generate missing secrets
./scripts/setup-env.sh --generate-secrets staging
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection refused | Check `DATABASE_URL`, verify SSL cert, check firewall |
| Redis connection timeout | Verify `REDIS_PRIMARY_URL`, check TLS settings |
| OpenAI 401 Unauthorized | Regenerate API key at platform.openai.com |
| Webhooks failing | Verify `WEBHOOK_SECRET` matches configured value |
| Push not working | Regenerate VAPID keys, check service worker |
| CORS errors | Update `CORS_ORIGIN` with exact origin |
| Rate limiting too aggressive | Adjust `RATE_LIMIT_TIERS_*` values |

### Debug Mode

```bash
# Enable verbose logging
LOG_LEVEL=debug
API_LOG_LEVEL=debug
ANALYTICS_DEBUG_MODE=true
AI_DEBUG_RESPONSES=true
```

---

## Changelog

### v9.0.0 (January 2025)
- Added AI Business Intelligence variables
- Added Blockchain Supply Chain configuration
- Added Advanced Analytics (ClickHouse/Kafka)
- Added Compliance Engine (sanctions, legal DB)
- Added PWA/Mobile push notification configs
- Added API Developer Portal settings
- Added Edge Computing/CDN headers
- Updated Algeria-specific business identifiers

---

*This document is maintained by the AlgeriaTrade DevOps team. For questions, contact devops@algeriatrade.dz*
