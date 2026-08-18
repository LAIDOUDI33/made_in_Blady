# Phase 8 Deployment Checklist

**AlgeriaTrade.dz B2B Marketplace - Production Deployment Guide**
**Version:** 8.0.0  
**Date:** $(date +%Y-%m-%d)  
**Deployment Window:** [To be scheduled]

---

## Table of Contents

1. [Pre-Deployment](#pre-deployment)
2. [Payment Configuration](#payment-configuration)
3. [Service Deployment](#service-deployment)
4. [Database Migration](#database-migration)
5. [ERP Integration Setup](#erp-integration-setup)
6. [AR Model Configuration](#ar-model-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Sign-off](#sign-off)

---

## Pre-Deployment

### Code & Branches
- [ ] All 12 feature branches merged to main
  - [ ] `feature/multi-provider-payments`
  - [ ] `feature/satim-integration`
  - [ ] `feature/stripe-enhancements`
  - [ ] `feature/crypto-payments`
  - [ ] `feature/erp-sap-connector`
  - [ ] `feature/erp-odoo-connector`
  - [ ] `feature/ar-viewer-enhanced`
  - [ ] `feature/ar-model-optimizer`
  - [ ] `feature/crm-pipeline-v2`
  - [ ] `feature/webrtc-video-calls`
  - [ ] `feature/currency-exchange`
  - [ ] `feature/invoicing-module`

### Testing
- [ ] Unit tests passing (target: >90% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing on staging
- [ ] Performance benchmarks within acceptable range
- [ ] Security scan completed (no CRITICAL vulnerabilities)

### Database
- [ ] Database migrations tested on staging environment
- [ ] Migration rollback procedure tested
- [ ] Backup current production database
  ```bash
  # Automated backup command
  pg_dump $DATABASE_URL > backup_phase7_final_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Verify backup integrity
- [ ] Document pre-migration row counts for key tables

### Environment Configuration
- [ ] Environment variables configured in production
  - [ ] `SATIM_API_KEY` / `SATIM_API_SECRET` obtained from CIB
  - [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (production mode)
  - [ ] `CRYPTO_WALLET_ADDRESSES` configured
  - [ ] `SAP_HOST` / `SAP_USER` / `SAP_PASSWORD` (if applicable)
  - [ ] `ODOO_URL` / `ODOO_API_KEY` (if applicable)
  - [ ] `FIXER_API_KEY` or alternative exchange rate API
  - [ ] `REDIS_URL` with Phase 8 capacity settings

### Infrastructure
- [ ] SSL certificates renewed and valid (>30 days remaining)
- [ ] CDN cache purged for static assets
- [ ] DNS records verified (including new subdomains if any)
- [ ] Load balancer configuration updated
- [ ] Firewall rules updated for new services (port 3002 for WebRTC)

### Communication
- [ ] Stakeholders notified of maintenance window
- [ ] Maintenance page prepared
- [ ] Customer support team briefed on new features
- [ ] Rollback communication template ready

---

## Payment Configuration

### SATIM (CIB - Algerian Bank)
- [ ] SATIM production keys obtained from CIB
  - [ ] Merchant ID registered
  - [ ] API credentials received
  - [ ] Terminal ID configured
- [ ] 3D Secure enabled for SATIM transactions
- [ ] Callback URLs registered with CIB
  - [ ] Success callback: `https://algeriatrade.dz/api/payments/satim/success`
  - [ ] Failure callback: `https://algeriatrade.dz/api/payments/satim/failure`
  - [ ] Webhook: `https://algeriatrade.dz/api/webhooks/satim`
- [ ] Test transaction completed in sandbox mode
- [ ] Production test transaction (small amount) approved by finance

### Stripe
- [ ] Stripe account upgraded to production mode
- [ ] Webhook endpoints registered
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
  - [ ] `customer.created`
  - [ ] `invoice.paid`
- [ ] 3D Secure confirmation mode verified
- [ ] Currency support enabled (DZD, EUR, USD)
- [ ] Radar fraud rules reviewed

### Cryptocurrency Payments
- [ ] Crypto wallet addresses configured
  - [ ] Bitcoin (BTC) wallet
  - [ ] Ethereum (ETH) wallet
  - [ ] USDT (TRC20/ERC20) wallet
- [ ] Exchange rate APIs subscribed
  - [ ] CoinGecko API or alternative
  - [ ] Rate refresh interval configured (5 min recommended)
- [ ] Confirmation threshold set (3 confirmations for BTC, 12 for ETH)
- [ ] Cold wallet address configured for settlements

### Exchange Rate Services
- [ ] Fixer.io API key or alternative configured
- [ ] Fallback exchange rate provider configured
- [ ] Rate caching strategy implemented (Redis TTL: 5 minutes)
- [ ] Supported currency pairs:
  - [ ] DZD → USD, EUR
  - [ ] USD → DZD, EUR
  - [ ] EUR → DZD, USD

---

## Service Deployment

### Core Application
- [ ] New Docker image built and pushed to registry
- [ ] Rolling deployment initiated
- [ ] Health checks passing after deployment
- [ ] Zero-downtime deployment verified

### WebRTC Signaling Server
- [ ] webrtc-signaling service deployed (port 3002)
- [ ] TURN/STUN servers configured
  - [ ] Primary STUN server
  - [ ] Backup TURN server (for NAT traversal)
- [ ] Redis connection verified for signaling state
- [ ] WebSocket connections tested

### Background Job Services
- [ ] crypto-monitor job scheduled
  - [ ] Monitoring interval: 60 seconds
  - [ ] Alert thresholds configured
- [ ] erp-sync-scheduler job deployed
  - [ ] Sync intervals configured per ERP type
  - [ ] Error retry policy set
- [ ] currency-refresher job active
  - [ ] Refresh interval: 5 minutes
  - [ ] Fallback rates cached

### Cache & CDN
- [ ] Redis cache warmed with essential data
  - [ ] Currency exchange rates
  - [ ] TVA rates
  - [ ] Product categories
  - [ ] User sessions
- [ ] CDN configured for AR models
  - [ ] GLB files served with correct MIME types
  - [ ] USDZ variants accessible
  - [ ] Thumbnail images optimized
- [ ] Browser caching headers configured

### Scheduled Jobs
- [ ] Invoice generation job scheduled
- [ ] Payment reconciliation job active
- [ ] ERP sync jobs scheduled
- [ ] Crypto monitoring running
- [ ] Currency rate updates scheduled
- [ ] Cleanup/maintenance jobs configured

---

## Database Migration

### Prisma Migrations
- [ ] Run Prisma migrate deploy
  ```bash
  bunx prisma migrate deploy --name "phase8-production"
  ```
- [ ] Verify migration status
  ```bash
  bunx prisma migrate status
  ```

### New Tables Verification
- [ ] `PaymentProvider` table created and seeded
- [ ] `CryptoTransaction` table exists
- [ ] `ERPIntegration` table created
- [ ] `ERPSyncLog` table operational
- [ ] `ARModel` table with indexes
- [ ] `CRMDeal` / `CRMPipeline` tables
- [ ] `CurrencyRate` table populated
- [ ] `Invoice` table with relations

### Data Seeding
- [ ] TVA rates seeded (Algerian tax rates)
  - [ ] Standard rate: 19%
  - [ ] Reduced rate: 9%
  - [ ] Zero-rated goods
- [ ] Currencies seeded
  - [ ] DZD (base currency)
  - [ ] USD, EUR, GBP, etc.
- [ ] Payment providers configured
  - [ ] SATIM/CIB entry
  - [ ] Stripe entry
  - [ ] Crypto entries
- [ ] CRM pipeline stages defined

### Indexes Created
- [ ] Payment transaction indexes
- [ ] ERP sync log indexes (with timestamp)
- [ ] AR model search indexes
- [ ] CRM deal pipeline indexes
- [ ] Currency rate date indexes

---

## ERP Integration Setup

### SAP Connector (If Applicable)
- [ ] SAP host connectivity verified
- [ ] OData service endpoints documented
- [ ] Field mappings validated
  - [ ] Products → SAP Material
  - [ ] Orders → SAP Sales Order
  - [ ] Customers → SAP Business Partner
- [ ] Authentication (OAuth2/SAML) configured
- [ ] Initial sync completed successfully

### Odoo Connector (If Applicable)
- [ ] Odoo URL accessible
- [ ] API authentication configured (token/user)
- [ ] XML-RPC or REST API selected
- [ ] Field mappings validated
  - [ ] Products → Odoo Product Template
  - [ ] Orders → Odoo Sale Order
  - [ ] Partners → Odoo Partner
- [ ] Webhook callbacks registered in Odoo

### General ERP Settings
- [ ] Sync direction configured (bidirectional/unidirectional)
- [ ] Conflict resolution rules defined
- [ ] Sync schedule configured
- [ ] Error notification recipients set
- [ ] Data transformation rules documented

---

## AR Model Configuration

### Model Storage
- [ ] S3 bucket or equivalent storage configured
- [ ] CDN distribution for models set up
- [ ] Upload size limits enforced (max 50MB per model)

### Optimization Pipeline
- [ ] GLB optimization pipeline active
  - [ ] Draco compression enabled
  - [ ] Texture compression (WebP/KTX2)
  - [ ] Polygon reduction target (<100K triangles)
- [ ] USDZ variant generation working
  - [ ] iOS Quick Look compatibility verified
- [ ] Thumbnail generation pipeline active
  - [ ] Multiple sizes: 256px, 512px, 1024px

### Viewer Configuration
- [ ] Three.js renderer settings optimized
- [ ] Default material quality set
- [ ] Animation playback configured
- [ ] Hotspot interaction enabled

---

## Post-Deployment Verification

### Smoke Tests
- [ ] Health endpoint returning 200
- [ ] All API endpoints responding
- [ ] WebSocket connections working
- [ ] Database queries executing normally
- [ ] Redis operations functional

### Feature-Specific Tests
#### Payment System
- [ ] SATIM checkout flow working (test transaction)
- [ ] Stripe checkout flow working
- [ ] Crypto payment flow displaying addresses
- [ ] Currency conversion accurate
- [ ] Webhook processing verified

#### ERP Integration
- [ ] Manual trigger of sync works
- [ ] Data appears correctly in ERP system
- [ ] Error handling works (test with invalid data)
- [ ] Sync logs are being recorded

#### AR Viewer
- [ ] Models loading correctly
- [ ] USDZ variants accessible on iOS
- [ ] Thumbnails displaying
- [ ] Performance acceptable (<3s load time)

#### CRM Pipeline
- [ ] Deals can be created
- [ ] Pipeline stages work
- [ ] Analytics data populating

#### Video Calls
- [ ] WebRTC signaling working
- [ ] Audio/video connection established
- [ ] Screen sharing functional
- [ ] Call recording (if enabled)

### Monitoring Dashboards
- [ ] Grafana dashboards loaded correctly
- [ ] Alerts configured and tested
- [ ] Error rate within baseline
- [ ] Response times acceptable

### User Acceptance
- [ ] Internal QA sign-off
- [ ] Product owner approval
- [ ] Key stakeholder demo completed

---

## Monitoring & Alerting

### Dashboards to Verify
- [ ] Payment Processing Metrics dashboard
- [ ] Conversion Rates dashboard
- [ ] CRM Pipeline Health dashboard
- [ ] ERP Sync Status dashboard
- [ ] WebRTC Call Quality dashboard
- [ ] AR Model Load Times dashboard

### Alert Thresholds Confirmed
- [ ] Payment failure rate > 5% triggers alert
- [ ] ERP sync failures > 3 consecutive triggers alert
- [ ] API error rate > 1% triggers alert
- [ ] Response time p99 > 3s triggers alert
- [ ] WebSocket disconnections > 10/min triggers alert

### Notification Channels
- [ ] PagerDuty/Splunk On-Call configured
- [ ] Slack alerts channel receiving notifications
- [ ] Email alerts reaching ops team

---

## Sign-off

| Role | Name | Signature | Date | Time |
|------|------|-----------|------|------|
| Release Manager | | | | |
| DevOps Engineer | | | | |
| QA Lead | | | | |
| Security Reviewer | | | | |
| Product Owner | | | | |

### Notes

```
Deployment started: ___________
Deployment completed: ___________
Total downtime (if any): ___________
Issues encountered:
1.
2.
3.
Post-deployment actions:
1.
2.
3.
```

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Primary On-Call | | | |
| Secondary On-Call | | | |
| Management Escalation | | | |
| Database Admin | | | |

---

## Related Documentation

- [Rollback Plan](./PHASE8-ROLLBACK-PLAN.md)
- [CI/CD Pipeline](../.github/workflows/deploy-production.yml)
- [Docker Compose (Phase 8)](../docker-compose.phase8.yml)
- [Migration Script](../scripts/migrate-phase8.sh)
- [Grafana Dashboards](./grafana/phase8-dashboards.json)

---

*This checklist should be completed in full before marking the deployment as successful.*
