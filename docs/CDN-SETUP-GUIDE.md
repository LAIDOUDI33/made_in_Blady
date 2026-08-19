# CDN Setup Guide for AlgeriaTrade.dz

> **Comprehensive Multi-CDN Configuration for MENA Region Optimization**
>
> Last Updated: December 2024
>
> Version: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Cloudflare Setup](#cloudflare-setup)
5. [Fastly Setup](#fastly-setup)
6. [CloudFront Setup](#cloudfront-setup)
7. [DNS Configuration](#dns-configuration)
8. [TLS Certificate Installation](#tls-certificate-installation)
9. [Multi-CDN Integration](#multi-cdn-integration)
10. [Testing Procedures](#testing-procedures)
11. [Monitoring Dashboard Setup](#monitoring-dashboard-setup)
12. [Troubleshooting](#troubleshooting)
13. [Performance Targets](#performance-targets)
14. [Appendix](#appendix)

---

## Overview

### Platform Information

| Property | Value |
|----------|-------|
| **Platform** | AlgeriaTrade.dz |
| **Primary Market** | Algeria (Algiers, Oran, Constantine) |
| **Secondary Markets** | Tunisia, Morocco, France |
| **Target Latency (Algeria)** | <50ms |
| **Target Latency (MENA)** | <100ms |
| **Target Latency (Global)** | <200ms |

### CDN Strategy Summary

| Provider | Role | Traffic % | Primary Use Case |
|----------|------|-----------|------------------|
| **Cloudflare** | Primary | 60% | Best MENA coverage, DDoS protection, Edge Functions |
| **Fastly** | Secondary | 25% | Image optimization, VCL flexibility, European traffic |
| **CloudFront** | Tertiary | 15% | AWS integration, backup, video streaming |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALGERIATRADE.DZ CDN ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   USER       │
                              │  (Browser)   │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
              │ CLOUDFLARE │  │    FASTLY   │  │ CLOUDFRONT  │
              │   (60%)    │  │   (25%)     │  │   (15%)     │
              └─────┬──────┘  └──────┬──────┘  └──────┬──────┘
                    │                │                │
         ┌──────────┼────────────────┼────────────────┼──────────┐
         │          │                │                │          │
    ┌────▼────┐ ┌───▼───┐     ┌──────▼──────┐  ┌─────▼─────┐  │
    │ Algiers │ │ Oran  │     │   Marseille │  │ Frankfurt │  │
    │   POP   │ │  POP  │     │   Shield    │  │   Edge    │  │
    └────┬────┘ └───┬───┘     └──────┬──────┘  └─────┬─────┘  │
         │          │                │                │        │
         └──────────┴────────────────┴────────────────┴────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   ORIGIN SERVER   │
                          │ (algeriatrade.dz) │
                          └───────────────────┘
```

### MENA Region PoP Locations

#### Cloudflare PoPs (Primary)
| City | Country | Code | Target Coverage |
|------|---------|------|-----------------|
| Algiers | Algeria | ALG | Northern Algeria |
| Oran | Algeria | ORN | Western Algeria |
| Constantine | Algeria | CST | Eastern Algeria |
| Paris | France | PAR | European users |
| Marseille | France | MRS | Shield/Origin |

#### Fastly PoPs (Secondary)
| City | Country | Code | Target Coverage |
|------|---------|------|-----------------|
| Tunis | Tunisia | TUN | Tunisia market |
| Casablanca | Morocco | CAS | Morocco market |
| Cairo | Egypt | CAI | North Africa |
| Paris | France | CDG | European hub |

#### CloudFront Edge Locations (Tertiary)
| Location | Code | Target Coverage |
|----------|------|-----------------|
| Paris, FR | EU-W1 | Western Europe |
| Frankfurt, DE | EU-C1 | Central Europe |
| London, GB | EU-W2 | UK/Northern Europe |
| Cape Town, ZA | AF-S1 | Southern Africa backup |
| Bahrain, ME | ME-1 | Middle East |

---

## Prerequisites

### Accounts Required

1. **Cloudflare Account** (Enterprise or Business plan recommended)
2. **Fastly Account** (Professional+ plan for image optimization)
3. **AWS Account** (for CloudFront and related services)
4. **Domain Registrar Access** (for DNS management)

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# =============================================================================
# CLOUDFLARE CONFIGURATION
# =============================================================================
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_API_KEY=your_api_key_here
CLOUDFLARE_EMAIL=admin@algeriatrade.dz
CLOUDFLARE_STAGING_ZONE_ID=staging_zone_id_here
CLOUDFLARE_ANALYTICS_ID=analytics_site_id_here

# KV Namespace IDs
KV_CACHE_NAMESPACE=kv_cache_namespace_id
KV_SESSION_NAMESPACE=kv_session_namespace_id
KV_RATE_LIMIT_NAMESPACE=kv_rate_limit_namespace_id
KV_FEATURE_FLAGS_NAMESPACE=kv_feature_flags_id

# D1 Database ID
D1_ANALYTICS_DB_ID=d1_database_id_here

# R2 Bucket Name
R2_ASSETS_BUCKET=algeriatrade-assets

# =============================================================================
# FASTLY CONFIGURATION
# =============================================================================
FASTLY_SERVICE_ID=your_fastly_service_id
FASTLY_API_KEY=your_fastly_api_token_here
FASTLY_CW_ROLE_ARN=arn:aws:iam::account:role/FastlyLogAccess

# =============================================================================
# CLOUDFRONT / AWS CONFIGURATION
# =============================================================================
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-3
CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id_here

# =============================================================================
# MONITORING & ALERTING
# =============================================================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXX/BXXX/XXXXX
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_key
PAGERDUTY_CDN_KEY=cdn_pagerduty_key
SPLUNK_HEC_ENDPOINT=https://splunk.hec.endpoint:8088/services/collector
SPLUNK_TOKEN=your_splunk_token
SUMOLOGIC_URL=https://endpoint.sumologic.com/receiver/v1/http/xxxxx

# =============================================================================
# GENERAL CDN SETTINGS
# =============================================================================
CDN_ENVIRONMENT=production
NODE_ENV=production
```

### Software Requirements

- Node.js >= 18.x
- Wrangler CLI (`npm install -g wrangler`)
- Fastly CLI (`npm install -g fastly`)
- AWS CLI v2 (`pip install awscli`)

---

## Cloudflare Setup

### Step 1: Create Cloudflare Account

1. Visit https://dash.cloudflare.com/sign-up
2. Register with your business email
3. Select Enterprise/Business plan for advanced features
4. Complete identity verification

### Step 2: Add Domain to Cloudflare

```bash
# Using Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "algeriatrade.dz",
    "type": "full",
    "jump_start": false
  }'
```

### Step 3: Configure Zone Settings

Navigate to your zone settings and configure:

#### SSL/TLS Settings
- **Encryption Mode**: Full (Strict)
- **Always Use HTTPS**: ON
- **HTTP Strict Transport Security (HSTS)**: Enabled
  - Max Age: 12 months
  - Include Subdomains: Yes
  - Preload: Yes
- **Minimum TLS Version**: 1.2
- **TLS 1.3**: Enabled

#### Speed Settings
- **Auto Minify**: JavaScript, CSS, HTML = ON
- **Brotli**: ON
- **Early Hints**: ON
- **HTTP/2**: ON (with HTTP/3 support)
- **0-RTT Connection Resumption**: ON
- **Gzip**: ON (fallback)

#### Cache Settings
- **Caching Level**: Standard
- **Browser Cache TTL**: Respect Existing Headers
- **Always Online**: OFF (we handle this ourselves)
- **Cache By Device Type**: ON (for responsive content)

### Step 4: Deploy Workers

```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to project directory
cd /path/to/algeriatrade

# Deploy edge functions
cd cdn/cloudflare
wrangler deploy --env production
```

### Step 5: Configure Page Rules

Import the cache rules from `cdn/cloudflare/cloudflare-rules.json`:

```bash
# Using Terraform (recommended for IaC)
# See terraform/cloudflare/ for complete setup

# Or manually via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_KEY" \
  -H "Content-Type: application/json" \
  --data @cdn/cloudflare/cloudflare-rules.json
```

### Step 6: Configure WAF Rules

Import security configuration from `cdn/cloudflare/cloudflare-security.json`:

1. Go to **Security > WAF**
2. Enable **Cloudflare Managed Rules**
3. Enable **OWASP Core Rule Set** (Paranoia Level 2)
4. Import custom rules from JSON file

### Step 7: Set Up KV Namespaces

```bash
# Create KV namespace for caching
wrangler kv namespace create CACHE_KV

# Create KV namespace for sessions
wrangler kv namespace create SESSION_KV

# Create KV namespace for rate limiting
wrangler kv namespace create RATE_LIMIT_KV

# Create KV namespace for feature flags
wrangler kv namespace create FEATURE_FLAGS
```

### Step 8: Create D1 Database for Analytics

```sql
-- Run in Cloudflare D1 console or via wrangler
CREATE TABLE IF NOT EXISTS edge_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT UNIQUE,
  client_ip TEXT,
  country_code TEXT,
  city TEXT,
  uri TEXT,
  method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  cache_status TEXT,
  provider TEXT,
  pop_location TEXT,
  user_agent TEXT,
  referer TEXT,
  device_type TEXT
);

CREATE INDEX idx_analytics_timestamp ON edge_analytics(timestamp);
CREATE INDEX idx_analytics_country ON edge_analytics(country_code);
CREATE INDEX idx_analytics_uri ON edge_analytics(uri);
CREATE INDEX idx_analytics_cache_status ON edge_analytics(cache_status);
```

---

## Fastly Setup

### Step 1: Create Fastly Account

1. Visit https://www.fastly.com/signup
2. Register with business email
3. Select Professional+ plan for image optimization features
4. Complete billing setup

### Step 2: Create Service

```bash
# Install Fastly CLI
npm install -g fastly-cli

# Login
fastly profile login

# Create new service
fastly service create --name="AlgeriaTrade CDN" --comment="Production CDN for algeriatrade.dz" --type=vcl
```

### Step 3: Upload VCL Configuration

```bash
# Navigate to project
cd /path/to/algeriatrade/cdn/fastly

# Initialize version
fastly version init --comment="Initial VCL configuration"

# Upload main VCL
fastly vcl upload --file=fastly.vcl

# Validate syntax
fastly vcl validate

# Activate version
fastly version activate
```

### Step 4: Configure Backends

Add origin servers in Fastly dashboard:

1. Go to **Hosts > Backends**
2. Add each backend:

| Backend Name | Hostname | Port | Shield | Health Check |
|--------------|----------|------|--------|--------------|
| `origin_production` | `origin.algeriatrade.internal` | 443 | Marseille | `/api/health` |
| `image_optimizer` | `image-optimizer.algeriatrade.internal` | 443 | None | `/health` |
| `api_gateway` | `api-gateway.algeriatrade.internal` | 443 | Marseille | None |

### Step 5: Configure Image Optimizer

1. Navigate to **Configure > Image Optimization**
2. Enable image optimization
3. Configure transformations:

```yaml
formats:
  webp:
    quality: 80
    enabled: true
  avif:
    quality: 75
    enabled: true
    
resize:
  enabled: true
  max_width: 1920
  max_height: 1080
  device_sizes:
    - 640
    - 750
    - 828
    - 1080
    - 1200
    - 1920
    - 2048
    - 3840
```

### Step 6: Set Up Dictionaries

Create edge dictionaries:

```bash
# Feature flags dictionary
fastly dictionary create --name=feature_flags --service=$FASTLY_SERVICE_ID

# Populate feature flags
fastly dictionary-item write --dictionary=feature_flags --key=new_ui_design --value=true
fastly dictionary-item write --dictionary=feature_flags --key=advanced_search --value=true
fastly dictionary-item write --dictionary=feature_flags --key=ai_recommendations --value=true
fastly dictionary-item write --dictionary=feature_flags --key=arabic_locale_default --value=true
```

### Step 7: Configure Logging

Set up real-time logging endpoints:

#### Splunk Integration
1. Go to **Logging > Splunk**
2. Add endpoint:
   - URL: `${SPLUNK_HEC_ENDPOINT}`
   - Token: `${SPLUNK_TOKEN}`
   - Format: Custom (use format from `fastly.vcl` log section)

#### Sumo Logic Backup
1. Go to **Logging > Sumo Logic**
2. Add endpoint:
   - URL: `${SUMOLOGIC_URL}`

#### CloudWatch Logs
1. Go to **Logging > Amazon S3/SQS/Kinesis Firehose**
2. Configure CloudWatch Logs delivery

### Step 8: Enable Origin Shielding

1. Go to **Hosts > Origin Shielding**
2. Enable shielding
3. Select primary shield POP: **Marseille (MRS)**
4. Configure timeouts:
   - Connect: 10s
   - First Byte: 30s
   - Between Bytes: 15s

---

## CloudFront Setup

### Step 1: Create S3 Bucket for Logs

```bash
aws s3 mb s3://algeriatrade-cdn-logs --region eu-west-3

# Configure lifecycle rules
aws s3 lifecycle put-bucket-lifecycle-configuration \
  --bucket algeriatrade-cdn-logs \
  --lifecycle-configuration file://cdn/cloudfront/s3-lifecycle.json
```

### Step 2: Create Distribution

Using AWS Console or SDK:

```json
{
  "DistributionConfig": {
    "CallerReference": "algeriatrade-dz-v1",
    "Comment": "AlgeriaTrade.dz CDN Distribution - Tertiary CDN",
    "Enabled": true,
    "HttpVersion": "http2and3",
    "IsIPV6Enabled": true,
    "DefaultRootObject": "index.html",
    "DefaultCacheBehavior": {
      "TargetOriginId": "origin-algeriatrade-dz",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": ["GET", "HEAD"],
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": "none",
        "Headers": ["Host", "Accept-Encoding", "Accept-Language", "Country"]
      },
      "MinTTL": 0,
      "DefaultTTL": 60,
      "MaxTTL": 31536000,
      "Compress": true,
      "LambdaFunctionAssociations": [
        {
          "EventType": "viewer-request",
          "LambdaFunctionARN": "arn:aws:lambda:eu-west-3:function:edge-request"
        }
      ]
    },
    "Origins": {
      "Items": [
        {
          "Id": "origin-algeriatrade-dz",
          "DomainName": "origin.algeriatrade.internal",
          "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "https-only",
            "OriginSSLProtocols": ["TLSv1.2", "TLSv1.3"]
          }
        }
      ],
      "Quantity": 1
    },
    "ViewerCertificate": {
      "ACMCertificateArn": "arn:aws:acm:us-east-1:account:certificate/id",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2019"
    },
    "PriceClass": "PriceClass_100",
    "Restrictions": {
      "GeoRestriction": {
        "Type": "none"
      }
    },
    "Aliases": {
      "Items": ["cdn-fallback.algeriatrade.dz"],
      "Quantity": 1
    },
    "Logging": {
      "Bucket": "algeriatrade-cdn-logs.s3.amazonaws.com",
      "Prefix": "cloudfront/",
      "Enabled": true,
      "IncludeCookies": false
    }
  }
}
```

### Step 3: Configure WAF

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name algeriatrade-waf \
  --scope CLOUDFRONT \
  --default-action Allow={} \
  --description "WAF for AlgeriaTrade CloudFront distribution" \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=algeriatrade-waf \
  --rules file://cdn/cloudfront/waf-rules.json
```

### Step 4: Set Up Field-Level Encryption (Optional)

For sensitive data protection:

```bash
aws cloudfront create-field-level-encryption-config \
  --field-level-encryption-config file://cdn/cloudfront/fle-config.json
```

---

## DNS Configuration

### Recommended DNS Records

Configure these records at your domain registrar:

```
; =============================================================================
; ALGERIATRADE.DZ DNS CONFIGURATION
; =============================================================================

; ---- APEX DOMAIN ----
@           3600 IN CNAME  algeriatrade.dz.cdn.cloudflare.net.
www         3600 IN CNAME  www.algeriatrade.dz.cdn.cloudflare.net.

; ---- API SUBDOMAIN ----
api         3600 IN CNAME  api.algeriatrade.dz.cdn.cloudflare.net.

; ---- STATIC ASSETS ----
cdn         3600 IN CNAME  cdn.algeriatrade.dz.cdn.cloudflare.net.
static      3600 IN CNAME  static.algeriatrade.dz.cdn.cloudflare.net.
img         3600 IN CNAME  img.algeriatrade.dz.cdn.fastly.net.

; ---- FASTLY CNAME RECORDS ----
; These point to Fastly's global anycast network
*           3600 IN CNAME  *.algeriatrade.dz.map.fastly.net.

; ---- EMAIL (MX) ----
@           3600 IN MX     10 mail.algeriatrade.dz.
@           3600 IN MX     20 mail.backup.algeriatrade.dz.

; ---- SPF / DKIM / DMARC ----
@           3600 IN TXT    "v=spf1 include:_spf.google.com include:sendgrid.net ~all"
google._domainkey  3600 IN TXT  "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ..."
_dmarc      3600 IN TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@algeriatrade.dz; pct=100"

; ---- SECURITY ----
@           3600 IN CAA    0 issue "letsencrypt.org"

; ---- CUSTOM NAMESERVERS (after Cloudflare activation) ----
@           3600 IN NS     ns1.cloudflare.com.
@           3600 IN NS     ns2.cloudflare.com.
@           3600 IN NS     ns3.cloudflare.com.
@           3600 IN NS     ns4.cloudflare.com.
```

### DNS Propagation Checklist

- [ ] Update nameservers at registrar to Cloudflare nameservers
- [ ] Wait for NS propagation (up to 48 hours)
- [ ] Verify all CNAME records resolve correctly
- [ ] Test DNS resolution from multiple locations
- [ ] Confirm MX records for email deliverability
- [ ] Validate SPF/DKIM/DMARC records

### Testing DNS Resolution

```bash
# Test from different locations using dig
dig algeriatrade.dz +short
dig api.algeriatrade.dz +short
dig cdn.algeriatrade.dz +short

# Test from multiple resolvers
dig @8.8.8.8 algeriatrade.dz +short
dig @1.1.1.1 algeriatrade.dz +short
dig @dns.google algeriatrade.dz +short

# Check propagation worldwide
# Use online tools like dnschecker.org or ping.pe
```

---

## TLS Certificate Installation

### Let's Encrypt (Recommended for Free SSL)

Both Cloudflare and Fastly provide free TLS certificates through Let's Encrypt integration.

#### Cloudflare Universal SSL

1. Go to **SSL/TLS > Edge Certificates**
2. Ensure **Universal SSL** is enabled
3. Certificate should auto-provision within 15 minutes
4. Status should show **Active**

#### Fastly TLS

1. Go to **Security > TLS**
2. Click **Upload Certificate** or use Let's Encrypt automation
3. For wildcard certificates, use DNS validation:

```bash
# Request certificate via certbot
certbot certonly --manual --preferred-challenges dns \
  -d "*.algeriatrade.dz" -d "algeriatrade.dz"
```

### Custom Certificate (Enterprise Option)

For extended validation or custom requirements:

```bash
# Generate CSR
openssl req -new -newkey rsa:4096 -nodes \
  -keyout algeriatrade.key \
  -out algeriatrade.csr \
  -subj "/C=DZ/O=AlgeriaTrade Ltd/CN=*.algeriatrade.dz"

# Submit CA for signing (DigiCert, Sectigo, etc.)
# Import signed certificate to Cloudflare/Fastly dashboards
```

### Certificate Validation Commands

```bash
# Check certificate details
echo | openssl s_client -connect algeriatrade.dz:443 -servername algeriatrade.dz 2>/dev/null | openssl x509 -noout -text

# Check certificate chain
echo | openssl s_client -connect algeriatrade.dz:443 -servername algeriatrade.dz 2>/dev/null | openssl verify -CAfile ca-bundle.crt

# Test TLS 1.3 support
openssl s_client -connect algeriatrade.dz:443 -tls1_3

# Check for common vulnerabilities
testssl.sh algeriatrade.dz
```

---

## Multi-CDN Integration

### Setting Up the Providers Client

The TypeScript module at `src/lib/cdn/providers.ts` provides unified access to all CDN providers:

```typescript
import { getCDNProviders } from '@/lib/cdn/providers';

// Initialize on application startup
const cdn = getCDNProviders();
await cdn.initialize();

// Get best provider for Algeria
const algeriaProvider = cdn.getBestProviderForCountry('DZ');
console.log(algeriaProvider); // 'cloudflare'

// Get current health status
const health = cdn.getHealthStatus();

// Purge product images across all CDNs
await cdn.purgeByTags(['products', 'images']);

// Get performance summary
const summary = await cdn.getPerformanceSummary();
```

### Traffic Distribution Configuration

The multi-CDN strategy is defined in `cdn/multi-cdn.json`:

```json
{
  "traffic_distribution": {
    "default_distribution": {
      "cloudflare": { "weight": 60, "role": "primary" },
      "fastly": { "weight": 25, "role": "secondary" },
      "cloudfront": { "weight": 15, "role": "tertiary" }
    },
    "geo_overrides": {
      "DZ": { "cloudflare": 80, "fastly": 15, "cloudfront": 5 },
      "FR": { "cloudflare": 50, "fastly": 35, "cloudfront": 15 }
    }
  }
}
```

### Failover Configuration

Automatic failover is configured with these thresholds:

| Condition | Action |
|-----------|--------|
| Provider unhealthy for 3 consecutive checks | Trigger failover |
| All providers degraded | Emergency mode |
| Regional latency >150ms (Algeria) | Switch regional provider |
| Error rate >5% | Alert + consider failover |

### Integration with Next.js Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCDNProviders } from '@/lib/cdn/providers';

export async function middleware(request: NextRequest) {
  const cdn = getCDNProviders();
  
  // Get country from headers (set by CDN)
  const country = request.headers.get('x-country-code') || 'unknown';
  
  // Determine best provider
  const bestProvider = cdn.getBestProviderForCountry(country);
  
  // Add CDN-related headers
  const response = NextResponse.next();
  response.headers.set('x-cdn-provider', bestProvider);
  response.headers.set('x-country', country);
  
  return response;
}
```

---

## Testing Procedures

### Pre-Launch Checklist

#### DNS Tests
```bash
# Resolve all domains
nslookup algeriatrade.dz
nslookup api.algeriatrade.dz
nslookup cdn.algeriatrade.dz

# Check CNAME targets correctly
dig algeriatrade.dz CNAME +short
# Expected: algeriatrade.dz.cdn.cloudflare.net.
```

#### SSL/TLS Tests
```bash
# Verify certificate validity
curl -Iv https://algeriatrade.dz 2>&1 | grep -E "(SSL|subject|issuer)"

# Test HTTP/2 and HTTP/3
curl -Iv --http2 https://algeriatrade.dz
curl -Iv --http3 https://algeriatrade.dz

# Check security headers
curl -I https://algeriatrade.dz | grep -iE "(strict-transport|x-content-type|x-frame)"
```

#### Cache Behavior Tests
```bash
# Test static asset caching
curl -I https://cdn.algeriatrade.dz/_next/static/css/main.css
# Expected: Cache-Control: public, max-age=31536000, immutable

# Test image optimization
curl -I -H "Accept: image/webp" https://cdn.algeriatrade.dz/images/product.jpg
# Expected: Content-Type: image/webp

# Test API caching
curl -I https://api.algeriatrade.dz/api/products
# Expected: X-API-Cached: true (on subsequent requests)
```

#### Geographic Performance Tests

Use these tools to test from different locations:

```bash
# Using curl from different regions (via proxy)
# Algeria
curl -w "@curl-format.txt" -o /dev/null https://algeriatrade.dz --proxy socks5://dz-proxy:1080

# France
curl -w "@curl-format.txt" -o /dev/null https://algeriatrade.dz --proxy socks5://fr-proxy:1080

# Global average
curl -w "@curl-format.txt" -o /dev/null https://algeriatrade.dz
```

**curl-format.txt:**
```
time_namelookup: %{time_namelookup}s\n
time_connect: %{time_connect}s\n
time_appconnect: %{time_appconnect}s\n
time_starttransfer: %{time_starttransfer}s\ntime_total: %{time_total}s\n
http_code: %{http_code}\n
size_download: %{size_download}\n
remote_ip: %{remote_ip}\n
```

### Load Testing

```bash
# Using hey (Go-based load tester)
hey -n 10000 -c 100 -m GET https://algeriatrade.dz/

# Using wrk
wrk -t12 -c400 -d30s https://algeriatrade.dz/

# Using Apache Bench
ab -n 5000 -c 100 https://algeriatrade.dz/
```

### Integration Test Script

```typescript
// tests/cdn-integration.test.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import { getCDNProviders } from '@/lib/cdn/providers';

describe('CDN Integration Tests', () => {
  let cdn: ReturnType<typeof getCDNProviders>;

  beforeAll(async () => {
    cdn = getCDNProviders();
    await cdn.initialize();
  });

  describe('Provider Health', () => {
    it('should have healthy primary provider', async () => {
      const health = await cdn.checkProviderHealth('cloudflare');
      expect(health.status).not.toBe('unhealthy');
    });

    it('should return healthy providers list', () => {
      const healthy = cdn.getHealthyProviders();
      expect(healthy.length).toBeGreaterThan(0);
    });
  });

  describe('Geographic Routing', () => {
    it('should route Algeria to Cloudflare', () => {
      const provider = cdn.getBestProviderForCountry('DZ');
      expect(provider).toBe('cloudflare');
    });

    it('should have fallback providers configured', () => {
      const rules = cdn.getGeoRoutingRules();
      const dzRule = rules.find(r => r.countryCode === 'DZ');
      expect(dzRule?.fallbackProviders.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Purging', () => {
    it('should purge URLs successfully', async () => {
      const results = await cdn.purgeURLs(['https://algeriatrade.dz/test-purge']);
      // In test mode, this should succeed
      expect(results.length).toBeGreaterThan(0);
    }, 30000);
  });
});
```

---

## Monitoring Dashboard Setup

### Cloudflare Analytics Dashboard

1. Go to **Analytics & Logs > Analytics**
2. Create custom dashboard with these widgets:

| Widget | Type | Metric |
|--------|------|--------|
| Total Requests | Time Series | Requests |
| Cache Hit Ratio | Gauge | Cache Status |
| Bandwidth Usage | Time Series | Bandwidth |
| Top Countries | Table | Country |
| Error Rate | Time Series | 5xx Errors |
| Response Time | Time Series | Average Response Time |
| Bot Traffic | Pie Chart | Threat Score |

### Fastly Real-Time Analytics

1. Go to **Analytics > Real-time Analytics**
2. Monitor key metrics:

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Hit Ratio | >90% | <85% | <75% |
| P95 Latency | <200ms | >500ms | >1000ms |
| Error Rate | <0.1% | >1% | >5% |
| Bandwidth | Normal | >80% capacity | >95% capacity |

### Grafana Dashboard (Recommended)

Import our pre-built Grafana dashboard from `docs/grafana/cdn-dashboard.json`:

```bash
# Import dashboard
curl -X POST "http://grafana:3000/api/dashboards/import" \
  -H "Content-Type: application/json" \
  -u admin:admin \
  --data @docs/grafana/cdn-dashboard.json
```

### Key Metrics to Monitor

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    severity: warning
    notification: slack + pagerduty
    
  - name: Low Cache Hit Ratio
    condition: hit_ratio < 80%
    severity: info
    notification: slack only
    
  - name: High Latency (Algeria)
    condition: p99_latency_DZ > 200ms
    severity: critical
    notification: pagerduty
    
  - name: Provider Unhealthy
    condition: provider_health == unhealthy
    severity: critical
    notification: pagerduty + phone call
    
  - name: Failover Event
    condition: failover_triggered == true
    severity: critical
    notification: pagerduty + email
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: High Cache Miss Rate

**Symptoms:** Hit ratio below 70%, high origin load

**Solutions:**
1. Check cache rules are applied correctly
2. Verify no-cache headers aren't being set incorrectly
3. Review `vary` header usage (too many variants)
4. Increase TTL values for stable content
5. Check if cookies are being passed unnecessarily

```bash
# Debug cache behavior
curl -I -H "Pragma: no-cache" https://algeriatrade.dz/page
# Look for: CF-Cache-Status, CF-Ray, Age headers
```

#### Issue: Slow Response Times from Algeria

**Symptoms:** P50 latency >100ms from Algerian IPs

**Solutions:**
1. Verify traffic routing to Algiers POP
2. Check if origin shield is enabled
3. Review geographic routing rules
4. Test from actual Algerian IP (use VPN/proxy)
5. Check for BGP/routing issues

```bash
# Check which POP served the request
curl -I https://algeriatrade.dz
# Look for: CF-RAY (contains POP code), CF-IPCountry
```

#### Issue: SSL Certificate Errors

**Symptoms:** Browser warnings, handshake failures

**Solutions:**
1. Verify certificate hasn't expired
2. Check intermediate certificates are installed
3. Ensure SNI is working correctly
4. Test with SSL Labs: https://www.ssllabs.com/ssltest/
5. Reissue certificate if needed

#### Issue: WAF Blocking Legitimate Traffic

**Symptoms:** Users seeing 403 errors, login failures

**Solutions:**
1. Review WAF logs for blocked requests
2. Check managed rules sensitivity
3. Whitelist legitimate patterns
4. Adjust bot detection thresholds
5. Create exceptions for known good traffic

```bash
# Check if request was blocked by WAF
curl -I https://algeriatrade.dz/api/auth/login
# Look for: CF-Ray, Server (should be cloudflare)
```

#### Issue: Purge Not Working

**Symptoms:** Old content still showing after purge

**Solutions:**
1. Verify purge API credentials are correct
2. Check purge rate limits not exceeded
3. Ensure exact URL match (including query string)
4. Try purging by tag instead of URL
5. Wait up to 30 seconds for full propagation

### Diagnostic Commands

```bash
# Full diagnostic curl command
curl -vvv -H "Accept: application/json" \
  -H "X-Cache-Diag: true" \
  -w "\n---\nDNS: %{time_namelookup}\nConnect: %{time_connect}\nTTFB: %{time_starttransfer}\nTotal: %{time_total}\n" \
  https://algeriatrade.dz/api/health

# Trace route to see path taken
traceroute algeriatrade.dz

# Check DNS resolution chain
dig algeriatrade.dz +trace

# Test from specific Cloudflare POP
curl --resolve "algeriatrade.dz:443:104.18.0.1" https://algeriatrade.dz
```

### Support Contacts

| Issue Type | Contact | Escalation |
|------------|---------|------------|
| Cloudflare Technical | support@cloudflare.com | Enterprise SLA |
| Fastly Support | support@fastly.com | Professional SLA |
| AWS Support | AWS Console | Business/Enterprise |
| Internal Ops | ops@algeriatrade.dz | PagerDuty |

---

## Performance Targets

### Latency Targets by Region

| Region | Cities | Target P50 | Target P95 | Current Baseline |
|--------|--------|-----------|-----------|-----------------|
| **Algeria (Primary)** | Algiers, Oran, Constantine | <50ms | <150ms | TBD |
| **MENA (Secondary)** | Tunis, Casablanca, Cairo | <100ms | <250ms | TBD |
| **Europe (Tertiary)** | Paris, Madrid, Frankfurt | <80ms | <200ms | TBD |
| **Global (Default)** | Worldwide | <200ms | <500ms | TBD |

### Cache Efficiency Targets

| Metric | Target | Minimum Acceptable |
|--------|--------|-------------------|
| Overall Hit Ratio | >90% | >80% |
| Static Assets Hit Ratio | >98% | >95% |
| API Response Hit Ratio | >60% | >40% |
| Image Hit Ratio | >85% | >75% |
| HTML Page Hit Ratio | >70% | >55% |

### Availability Targets

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| Uptime | 99.95% | Monthly |
| Error Rate | <0.1% | Daily |
| Mean Time to Recovery | <5 minutes | Per incident |
| Planned Maintenance Impact | <0.05% downtime | Monthly |

---

## Appendix

### File Structure

```
cdn/
├── cloudflare/
│   ├── wrangler.toml              # Workers/Pages config
│   ├── cloudflare-rules.json      # Cache rules
│   └── cloudflare-security.json   # WAF & security config
├── fastly/
│   ├── fastly.vcl                 # VCL configuration
│   └── fastly-config.json         # Service configuration
├── multi-cdn.json                 # Multi-CDN strategy
src/lib/cdn/
├── providers.ts                   # CDN provider integration
└── manager.ts                     # CDN manager (existing)
docs/
└── CDN-SETUP-GUIDE.md             # This document
```

### Environment-Specific Values

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `CDN_ENVIRONMENT` | development | staging | production |
| `CACHE_TTL_MULTIPLIER` | 0.1 | 0.5 | 1.0 |
| `DEBUG_HEADERS` | true | true | false |
| `HEALTH_CHECK_INTERVAL` | 10s | 30s | 30s |
| `PURGE_RATE_LIMIT` | unlimited | 100/min | 30/min |

### Useful Links

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Fastly Docs**: https://developer.fastly.com/
- **AWS CloudFront Docs**: https://docs.aws.amazon.com/AmazonCloudFront/
- **MENA Peering Info**: https://peeringdb.com/
- **Algerian ISPs Reference**: https://www.ansi.dz/

### Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-01 | CDN Team | Initial release |

---

*This document is maintained by the AlgeriaTrade Infrastructure Team.*
*For questions or updates, contact: infra@algeriatrade.dz*
