# Phase 8 Rollback Plan

**AlgeriaTrade.dz B2B Marketplace - Emergency Rollback Procedures**
**Version:** 1.0  
**Last Updated:** $(date +%Y-%m-%d)  
**Classification:** Internal Operations

---

## Table of Contents

1. [Overview](#overview)
2. [Rollback Triggers](#rollback-triggers)
3. [Pre-Rollback Checklist](#pre-rollback-checklist)
4. [Database Rollback Procedure](#database-rollback-procedure)
5. [Feature Flags for Safe Disable](#feature-flags-for-safe-disable)
6. [Service Rollback Order](#service-rollback-order)
7. [Communication Plan](#communication-plan)
8. [Data Integrity Verification](#data-integrity-verification)
9. [Post-Rollback Actions](#post-rollback-actions)
10. [Escalation Matrix](#escalation-matrix)

---

## Overview

This document outlines the rollback procedures for Phase 8 of AlgeriaTrade.dz, which introduced 12 new features including multi-provider payments, ERP integration, AR viewer enhancements, CRM pipeline, WebRTC video calls, and currency exchange support.

### Scope of Phase 8 Changes

| Feature Area | Components | Risk Level |
|--------------|------------|------------|
| Payment System | SATIM, Stripe, Crypto payments | **HIGH** |
| ERP Integration | SAP/Odoo connectors | MEDIUM |
| AR Viewer | Model optimizer, USDZ generation | LOW |
| CRM Pipeline | Deals, stages, analytics | MEDIUM |
| Video Calls | WebRTC signaling server | LOW |
| Currency Exchange | Multi-currency support | MEDIUM |

### Rollback Objectives

1. Restore system stability within **15 minutes** of triggering
2. Ensure **zero data loss** for existing transactions
3. Maintain availability of core platform features
4. Provide clear communication to all stakeholders

---

## Rollback Triggers

### Automatic Triggers (CI/CD Pipeline)

The following conditions will trigger automatic rollback:

```yaml
automatic_triggers:
  smoke_test_failure:
    condition: "Any smoke test fails after deployment"
    action: "Execute Stage 14: Rollback"
    
  error_rate_threshold:
    condition: "Error rate > 5% for 5 consecutive minutes"
    action: "Alert + suggest manual rollback"
    
  payment_failure_spike:
    condition: "Payment failure rate > 10% in 10 minutes"
    action: "Immediate rollback + financial team notification"
    
  database_connection_failure:
    condition: "DB connection errors > 20% for 2 minutes"
    action: "Immediate rollback"
```

### Manual Triggers

Manual rollback should be initiated when:

- [ ] Critical security vulnerability discovered
- [ ] Data corruption detected
- [ ] Payment processing errors causing financial discrepancies
- [ ] Customer complaints exceeding normal threshold (50+ in 1 hour)
- [ ] Third-party service (SATIM/Stripe/SAP) integration issues
- [ ] Performance degradation > 200% baseline

### Decision Authority

| Situation | Authorization Required |
|-----------|----------------------|
| Auto-triggered rollback | DevOps Lead |
| Manual - Payment issues | CTO + Finance Director |
| Manual - Security issues | CTO + Security Lead |
| Manual - Performance issues | DevOps Lead |
| Full site shutdown | CEO |

---

## Pre-Rollback Checklist

Before initiating rollback, complete these checks:

### Immediate Checks (2 minutes)

```bash
#!/bin/bash
# Pre-Rollback Diagnostic Script

echo "=== PRE-ROLLBACK DIAGNOSTICS ==="
echo "Timestamp: $(date)"

# 1. Check current error rate
echo ""
echo "1. Current Error Rate (last 5 min):"
curl -s "https://algeriatrade.dz/api/status" | jq '.errorRate // "unknown"' || echo "Cannot fetch"

# 2. Check database connectivity
echo ""
echo "2. Database Status:"
pg_isready -h $DB_HOST -p 5432 || echo "DB UNREACHABLE"

# 3. Check active connections
echo ""
echo "3. Active Database Connections:"
psql $DATABASE_URL -tAc "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# 4. Check recent failed transactions
echo ""
echo "4. Failed Payments (last 30 min):"
psql $DATABASE_URL -tAc "
SELECT COUNT(*) FROM \"PaymentTransaction\" 
WHERE status = 'failed' 
AND createdAt > NOW() - INTERVAL '30 minutes';
" || echo "Query failed"

# 5. Check queue depth
echo ""
echo "5. Background Job Queue Depth:"
redis-cli -u $REDIS_URL LLEN jobs:queue || echo "Redis unreachable"

# 6. Check container health
echo ""
echo "6. Container Status:"
docker compose -f docker-compose.production.yml -f docker-compose.phase8.yml ps --format "table {{.Name}}\t{{.Status}}"

echo ""
echo "=== END DIAGNOSTICS ==="
```

### Information Gathering

- [ ] Document current issue with screenshots/logs
- [ ] Identify start time of issues
- [ ] Note any customer-reported problems
- [ ] Check incident history for similar issues
- [ ] Verify backup availability

---

## Database Rollback Procedure

### Option A: Full Database Restore (Recommended for Data Corruption)

**Time Estimate:** 5-10 minutes  
**Data Loss Risk:** Transactions since backup will be lost (requires reconciliation)

#### Steps:

```bash
# 1. Identify latest pre-deployment backup
ls -lt backups/ | head -5

# 2. Stop application to prevent new writes
docker compose -f docker-compose.production.yml stop app worker

# 3. Create emergency post-failure backup (for analysis)
pg_dump $DATABASE_URL > backups/emergency_pre_rollback_$(date +%Y%m%d_%H%M%S).sql

# 4. Restore from backup
gunzip -c backups/phase8_pre_migration_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL

# 5. Verify restore integrity
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"  # Verify row counts

# 6. Restart services
docker compose -f docker-compose.production.yml start app worker
```

### Option B: Migration Rollback (Recommended for Schema Issues)

**Time Estimate:** 3-5 minutes  
**Data Loss Risk:** Minimal if no data written to new tables

#### Steps:

```bash
# 1. Check migration history
cd /path/to/deployment
bunx prisma migrate status

# 2. Roll back last migration
bunx prisma migrate resolve --rolled-back "phase8-production-MIGRATION_ID"

# 3. If needed, manually drop Phase 8 tables (DANGEROUS)
psql $DATABASE_URL << 'SQL'
-- Only run if absolutely necessary!
DROP TABLE IF EXISTS "CryptoTransaction" CASCADE;
DROP TABLE IF EXISTS "ERPSyncLog" CASCADE;
DROP TABLE IF EXISTS "ARModel" CASCADE;
DROP TABLE IF EXISTS "CRMDeal" CASCADE;
DROP TABLE IF EXISTS "PipelineStage" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "CurrencyRate" CASCADE;
-- Keep TvaRate, Currency, PaymentProvider as they may have data dependencies
SQL

# 4. Restart application
docker compose -f docker-compose.production.yml restart app
```

### Option C: Feature Flag Disable (Fastest - No Downtime)

**Time Estimate:** < 1 minute  
**Data Loss Risk:** None

See [Feature Flags section](#feature-flags-for-safe-disable) below.

---

## Feature Flags for Safe Disable

Phase 8 features are controlled via Redis-based feature flags that can be toggled without redeployment or downtime.

### Available Feature Flags

| Flag Key | Default | Description |
|----------|---------|-------------|
| `feature:multi_provider_payments` | true | Enable SATIM/Stripe/Crypto payments |
| `feature:satim_payments` | true | Enable SATIM specifically |
| `feature:stripe_payments` | true | Enable Stripe specifically |
| `feature:crypto_payments` | true | Enable cryptocurrency payments |
| `feature:erp_integration` | true | Enable ERP connectors |
| `feature:ar_viewer_enhanced` | true | Enable AR model optimization |
| `feature:crm_pipeline_v2` | true | Enable CRM pipeline features |
| `feature:webrtc_video_calls` | true | Enable video calling |
| `feature:currency_exchange` | true | Enable multi-currency display |
| `feature:invoicing_module` | true | Enable invoice generation |

### Quick Disable Commands

```bash
#!/bin/bash
# Phase 8 Feature Flag Emergency Disable Script

REDIS_CLI="redis-cli -u ${REDIS_URL:-redis://localhost:6379}"

# Disable ALL Phase 8 features at once
disable_all_phase8_features() {
    echo "Disabling all Phase 8 features..."
    
    $REDIS_CLI SET feature:multi_provider_payments "false" EX 3600
    $REDIS_CLI SET feature:satim_payments "false" EX 3600
    $REDIS_CLI SET feature:stripe_payments "false" EX 3600
    $REDIS_CLI SET feature:crypto_payments "false" EX 3600
    $REDIS_CLI SET feature:erp_integration "false" EX 3600
    $REDIS_CLI SET feature:ar_viewer_enhanced "false" EX 3600
    $REDIS_CLI SET feature:crm_pipeline_v2 "false" EX 3600
    $REDIS_CLI SET feature:webrtc_video_calls "false" EX 3600
    $REDIS_CLI SET feature:currency_exchange "false" EX 3600
    $REDIS_CLI SET feature:invoicing_module "false" EX 3600
    
    # Clear cache to ensure flags take effect immediately
    $REDIS_CLI DEL "cache:feature_flags"
    
    echo "All Phase 8 features disabled (1 hour TTL)"
}

# Disable specific feature category
disable_payment_features() {
    echo "Disabling payment features only..."
    $REDIS_CLI SET feature:multi_provider_payments "false" EX 3600
    $REDIS_CLI SET feature:satim_payments "false" EX 3600
    $REDIS_CLI SET feature:crypto_payments "false" EX 3600
    $REDIS_CLI DEL "cache:feature_flags"
    echo "Payment features disabled"
}

# Re-enable features (after fix)
enable_all_phase8_features() {
    echo "Re-enabling all Phase 8 features..."
    
    $REDIS_CLI DEL feature:multi_provider_payments
    $REDIS_CLI DEL feature:satim_payments
    $REDIS_CLI DEL feature:stripe_payments
    $REDIS_CLI DEL feature:crypto_payments
    $REDIS_CLI DEL feature:erp_integration
    $REDIS_CLI DEL feature:ar_viewer_enhanced
    $REDIS_CLI DEL feature:crm_pipeline_v2
    $REDIS_CLI DEL feature:webrtc_video_calls
    $REDIS_CLI DEL feature:currency_exchange
    $REDIS_CLI DEL feature:invoicing_module
    $REDIS_CLI DEL "cache:feature_flags"
    
    echo "All Phase 8 features re-enabled"
}

# Usage based on argument
case "${1:-}" in
    --all)       disable_all_phase8_features ;;
    --payments)  disable_payment_features ;;
    --enable)    enable_all_phase8_features ;;
    --status)    
        echo "Current Phase 8 Feature Flag Status:"
        $REDIS_CLI MGET \
            feature:multi_provider_payments \
            feature:satim_payments \
            feature:crypto_payments \
            feature:erp_integration \
            feature:ar_viewer_enhanced \
            feature:crm_pipeline_v2 \
            feature:webrtc_video_calls \
            feature:currency_exchange \
            feature:invoicing_module
        ;;
    *)          echo "Usage: $0 [--all|--payments|--enable|--status]" ;;
esac
```

### Recommended Rollback by Feature Issue

| Issue Type | Features to Disable | Command |
|------------|---------------------|---------|
| Payment failures | All payment flags | `./feature-flags.sh --payments` |
| ERP sync errors | ERP integration flag | `redis-cli SET feature:erp_integration false` |
| AR loading slow | AR enhanced flag | `redis-cli SET feature:ar_viewer_enhanced false` |
| Video call issues | WebRTC flag | `redis-cli SET feature:webrtc_video_calls false` |
| Currency wrong rates | Currency flag | `redis-cli SET feature:currency_exchange false` |
| Complete failure | All flags | `./feature-flags.sh --all` |

---

## Service Rollback Order

When performing a full service rollback, follow this order to maintain system stability:

### Shutdown Order (Stop New Services First)

```
┌─────────────────────────────────────────────────────────────┐
│                    SHUTDOWN SEQUENCE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1 (T-0:00)  ──►  Stop AR Model Processor              │
│         Reason: CPU intensive, non-critical                  │
│         Command: docker stop algeriatrade-ar-processor-prod │
│                                                              │
│  Step 2 (T-0:30)  ──►  Stop Crypto Monitor                  │
│         Reason: May have pending transactions               │
│         Command: docker stop algeriatrade-crypto-monitor-prod│
│                                                              │
│  Step 3 (T-1:00)  ──►  Stop ERP Sync Scheduler              │
│         Reason: Mid-sync could cause inconsistency           │
│         Command: docker stop algeriatrade-erp-scheduler-prod │
│                                                              │
│  Step 4 (T-1:30)  ──►  Stop Currency Refresher              │
│         Reason: Non-critical background job                 │
│         Command: docker stop algeriatrade-currency-refresher │
│                                                              │
│  Step 5 (T-2:00)  ──►  Stop Invoice Worker                  │
│         Reason: May be generating invoices                   │
│         Command: docker stop algeriatrade-invoice-worker-prod│
│                                                              │
│  Step 6 (T-2:30)  ──►  Stop WebRTC Signaling                │
│         Reason: Active calls would drop                     │
│         Command: docker stop algeriatrade-webrtc-prod       │
│                                                              │
│  Step 7 (T-3:00)  ──►  Stop Main Application                │
│         Reason: Core service, stop last                      │
│         Command: docker compose -f docker-compose.production.yml stop app│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Startup Order (Reverse of Shutdown)

```
┌─────────────────────────────────────────────────────────────┐
│                     STARTUP SEQUENCE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1 (T-0:00)  ──►  Start Core Services (DB, Redis)      │
│         Command: docker compose -f docker-compose.production.yml up db redis│
│                                                              │
│  Step 2 (T-0:30)  ──►  Start Main Application               │
│         Command: docker compose -f docker-compose.production.yml up -d app│
│                                                              │
│  Step 3 (T-2:00)  ──►  Start Background Workers             │
│         Command: docker compose -f docker-compose.production.yml up -d worker│
│                                                              │
│  Step 4 (T-3:00)  ──►  Verify Health Checks                  │
│         Command: curl https://algeriatrade.dz/api/health     │
│                                                              │
│  ⚠️  Phase 8 services NOT started (rolled back)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Complete Rollback Script

```bash
#!/bin/bash
# Phase 8 Complete Service Rollback Script
# Usage: ./rollback-phase8-services.sh

set -e

COMPOSE_FILES="-f docker-compose.production.yml -f docker-compose.phase8.yml"
PROJECT_DIR="${DEPLOY_PATH:-/opt/algeriatrade}"

echo "=========================================="
echo "Phase 8 Service Rollback"
echo "Timestamp: $(date)"
echo "=========================================="

cd "$PROJECT_DIR"

# Step 1: Disable feature flags first (instant effect)
echo "[1/6] Disabling Phase 8 feature flags..."
./scripts/feature-flags.sh --all

# Step 2: Stop Phase 8 specific services
echo "[2/6] Stopping Phase 8 services..."
docker compose $COMPOSE_FILES stop \
    ar-model-processor \
    crypto-monitor \
    erp-sync-scheduler \
    currency-refresher \
    invoice-worker \
    webrtc-signaling \
    2>/dev/null || true

# Step 3: Remove Phase 8 containers
echo "[3/6] Removing Phase 8 containers..."
docker compose $COMPOSE_FILES rm -f \
    ar-model-processor \
    crypto-monitor \
    erp-sync-scheduler \
    currency-refresher \
    invoice-worker \
    webrtc-signaling \
    2>/dev/null || true

# Step 4: Restart core services (ensures clean state)
echo "[4/6] Restarting core services..."
docker compose -f docker-compose.production.yml restart app worker nginx

# Step 5: Wait for health check
echo "[5/6] Waiting for health check..."
sleep 30

# Step 6: Verify
echo "[6/6] Verifying system status..."
HEALTH=$(curl -sf http://localhost:3000/api/health || echo "unhealthy")

if [[ "$HEALTH" == *"healthy"* ]] || [[ "$HEALTH" == *"ok"* ]]; then
    echo "✅ System is healthy"
else
    echo "⚠️ System may not be fully healthy. Manual check required."
fi

echo ""
echo "=========================================="
echo "Rollback completed at $(date)"
echo "=========================================="
echo ""
echo "Phase 8 services stopped:"
echo "  - webrtc-signaling (port 3002 freed)"
echo "  - crypto-monitor"
echo "  - erp-sync-scheduler"
echo "  - currency-refresher"
echo "  - invoice-worker"
echo "  - ar-model-processor"
echo ""
echo "Core services running:"
docker compose -f docker-compose.production.yml ps
```

---

## Communication Plan

### Notification Timeline

| Time | Action | Audience | Channel |
|------|--------|----------|---------|
| T+0min | Alert internal team | DevOps, Engineering | Slack #incidents |
| T+2min | Notify management | CTO, Product Leads | Slack + SMS |
| T+5min | Customer-facing message (if needed) | Support Team | Email template |
| T+15min | Status update | All stakeholders | Slack #announcements |
| T+60min | Post-mortem initiated | Engineering team | Jira/GitHub |

### Communication Templates

#### Internal Alert (Slack)

```json
{
  "text": "🚨 *PHASE 8 ROLLBACK INITIATED*",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 Production Rollback - AlgeriaTrade.dz"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Triggered By:*\n{{triggeredBy}}"},
        {"type": "mrkdwn", "text": "*Timestamp:*\n{{timestamp}}"},
        {"type": "mrkdwn", "text": "*Reason:*\n{{reason}}"},
        {"type": "mrkdwn", "text": "*Features Disabled:*\n{{featuresDisabled}}"}
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Rollback Commander:* {{commander}}\n*War Room:* {{warRoomUrl}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Join War Room"},
          "url": "{{warRoomUrl}}"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "View Logs"},
          "url": "{{logUrl}}"
        }
      ]
    }
  ]
}
```

#### Customer Communication (If Required)

**Subject:** Temporary Service Interruption - AlgeriaTrade.dz

```
Dear Valued Customer,

We are currently experiencing technical difficulties with some of our 
services and have temporarily disabled certain features to ensure 
the stability of our platform.

WHAT'S AFFECTED:
- [List affected features]

WHAT'S WORKING:
- Core marketplace functionality
- Product browsing and search
- Basic messaging

EXPECTED RESOLUTION:
We expect to restore full functionality within [timeframe].

We apologize for any inconvenience this may cause. Our team is working 
diligently to resolve the issue.

For urgent assistance, please contact our support team at:
support@algeriatrade.dz | +213 XX XXX XXXX

Thank you for your patience.

AlgeriaTrade.dz Technical Operations Team
```

---

## Data Integrity Verification

After rollback, verify data integrity using these checks:

### Automated Verification Script

```bash
#!/bin/bash
# Post-Rollback Data Integrity Verification

echo "=========================================="
echo "Post-Rollback Data Integrity Check"
echo "Timestamp: $(date)"
echo "=========================================="

ERRORS=0

# 1. User table integrity
echo ""
echo "1. Checking User table..."
USER_COUNT=$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM \"User\";")
if [ "$USER_COUNT" -gt 0 ]; then
    echo "   ✅ Users: $USER_COUNT records"
else
    echo "   ❌ No users found!"
    ((ERRORS++))
fi

# 2. Company table integrity
echo ""
echo "2. Checking Company table..."
COMPANY_COUNT=$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM \"Company\";")
if [ "$COMPANY_COUNT" -gt 0 ]; then
    echo "   ✅ Companies: $COMPANY_COUNT records"
else
    echo "   ❌ No companies found!"
    ((ERRORS++))
fi

# 3. Product table integrity
echo ""
echo "3. Checking Product table..."
PRODUCT_COUNT=$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM \"Product\";")
if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo "   ✅ Products: $PRODUCT_COUNT records"
else
    echo "   ❌ No products found!"
    ((ERRORS++))
fi

# 4. Order table integrity (critical!)
echo ""
echo "4. Checking Order table..."
ORDER_COUNT=$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM \"Order\";")
if [ "$ORDER_COUNT" -gt 0 ]; then
    echo "   ✅ Orders: $ORDER_COUNT records"
else
    echo "   ⚠️ No orders (may be expected for new deployment)"
fi

# 5. Check for orphaned records
echo ""
echo "5. Checking for orphaned records..."
ORPHANED=$(psql $DATABASE_URL -tAc "
SELECT COUNT(*) FROM \"Order\" o 
LEFT JOIN \"User\" u ON o.\"userId\" = u.id 
WHERE u.id IS NULL;
")
if [ "$ORPHANED" -eq 0 ]; then
    echo "   ✅ No orphaned orders"
else
    echo "   ⚠️ $ORPHANED orphaned order(s) found"
    ((ERRORS++))
fi

# 6. Payment transaction consistency
echo ""
echo "6. Checking payment transaction consistency..."
INCONSISTENT=$(psql $DATABASE_URL -tAc "
SELECT COUNT(*) FROM \"PaymentTransaction\" pt
LEFT JOIN \"Order\" o ON pt.\"orderId\" = o.id
WHERE pt.\"orderId\" IS NOT NULL AND o.id IS NULL;
")
if [ "$INCONSISTENT" -eq 0 ]; then
    echo "   ✅ Payment transactions consistent"
else
    echo "   ⚠️ $INCONSISTENT inconsistent payment record(s)"
    ((ERRORS++))
fi

# 7. Foreign key constraints valid
echo ""
echo "7. Verifying foreign key constraints..."
FK_CHECK=$(psql $DATABASE_URL -tAc "
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
AND NOT VALIDATED;
")
if [ "$FK_CHECK" -eq 0 ]; then
    echo "   ✅ All FK constraints validated"
else
    echo "   ⚠️ $FK_CHECK unvalidated FK constraint(s)"
fi

# Summary
echo ""
echo "=========================================="
if [ "$ERRORS" -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED"
    exit 0
else
    echo "❌ $ERRORS ISSUE(S) FOUND"
    echo "Manual investigation required!"
    exit 1
fi
```

### Financial Data Reconciliation (Critical for Payment Rollback)

If rolling back payment-related features:

```sql
-- Financial Reconciliation Query
-- Run this BEFORE and AFTER rollback to identify discrepancies

-- Snapshot current payment states
CREATE TEMPORARY TABLE pre_rollback_snapshot AS
SELECT 
    id,
    "orderId",
    "providerType",
    amount,
    currency,
    status,
    "createdAt",
    "updatedAt"
FROM "PaymentTransaction"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- Count by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM pre_rollback_snapshot
GROUP BY status;

-- Identify potentially lost transactions (in-flight during rollback)
SELECT *
FROM pre_rollback_snapshot
WHERE status IN ('pending', 'processing', 'awaiting_confirmation');
```

---

## Post-Rollback Actions

### Immediate (First Hour)

- [ ] System stable and serving traffic
- [ ] Error rates returned to baseline
- [ ] All monitoring dashboards green
- [ ] Stakeholders notified of completion

### Short-term (24 Hours)

- [ ] Root Cause Analysis (RCA) document started
- [ ] Fix developed and tested in staging
- [ ] Customer impact assessment completed
- [ ] Compensation decisions made (if applicable)

### Long-term (1 Week)

- [ ] Post-mortem meeting scheduled
- [ ] RCA document finalized and shared
- [ ] Preventive measures implemented
- [ ] Test coverage improved for affected areas
- [ ] Runbook updated with lessons learned

---

## Escalation Matrix

| Severity | Response Time | Escalation Path | Examples |
|----------|---------------|-----------------|----------|
| **P1 - Critical** | Immediate | On-call → CTO → CEO | Data loss, payment breach, complete outage |
| **P2 - High** | 15 minutes | On-call → Tech Lead → CTO | Major feature broken, high error rate |
| **P3 - Medium** | 1 hour | On-call → Team Lead | Single feature degraded, minor errors |
| **P4 - Low** | 4 hours | Team assignment | UI issues, non-critical bugs |

### Contact Information

| Role | Primary | Backup |
|------|---------|--------|
| On-Call Engineer | PagerDuty Primary | PagerDuty Secondary |
| DevOps Lead | devops-lead@algeriatrade.dz | +213 XX XXX XXXX |
| CTO | cto@algeriatrade.dz | +213 XX XXX XXXX |
| CEO | ceo@algeriatrade.dz | +213 XX XXX XXXX |
| Security Officer | security@algeriatrade.dz | +213 XX XXX XXXX |

---

## Appendix: Useful Commands Reference

```bash
# Quick Status Commands
docker compose -f docker-compose.production.yml -f docker-compose.phase8.yml ps
redis-cli -u $REDIS_URL INFO server
psql $DATABASE_URL -c "SELECT version();"

# Log Viewing
docker logs algeriatrade-app-prod --tail 100 -f
docker logs algeriatrade-webrtc-prod --tail 50 -f

# Feature Flag Management
redis-cli -u $REDIS_URL GET feature:multi_provider_payments
redis-cli -u $REDIS_URL KEYS "feature:*"

# Database Queries
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
psql $DATABASE_URL -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

---

*This rollback plan should be reviewed and updated after each deployment cycle.*
*Last review: $(date +%Y-%m-%d)*
*Next review: Scheduled after next deployment*
