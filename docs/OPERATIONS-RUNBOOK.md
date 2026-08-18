# AlgeriaTrade.dz Operations Runbook - Phase 8

**B2B Marketplace Production Operations Guide**
**Version:** 8.0.0
**Last Updated:** $(date +%Y-%m-%d)
**Classification:** Internal Operations

---

## Table of Contents

1. [Overview](#overview)
2. [Daily Operations](#section-1-daily-operations)
3. [Payment Operations](#section-2-payment-operations)
4. [Incident Response](#section-3-incident-response)
5. [Maintenance Procedures](#section-4-maintenance-procedures)
6. [Scaling Procedures](#section-5-scaling-procedures)
7. [Appendices](#appendices)

---

## Overview

### Platform Architecture (Phase 8)

AlgeriaTrade.dz Phase 8 introduces 12 major feature modules that require coordinated operational oversight:

| Module | Component | Operational Criticality |
|--------|-----------|------------------------|
| SATIM Integration | CIB Payment Gateway | **CRITICAL** - Primary Algerian payment method |
| Stripe | International Card Payments | **CRITICAL** - International transactions |
| Crypto Payments | BTC/ETH/USDT Processing | HIGH - Alternative payment rail |
| DPA (Documentaire Paiement) | Bank Guarantee System | MEDIUM - B2B trade finance |
| Invoicing | Automated Invoice Generation | HIGH - Financial compliance |
| Multi-Currency | DZD/USD/EUR/GBP Support | HIGH - International trade |
| Negotiation Engine | Price Negotiation Workflows | MEDIUM - Core marketplace feature |
| Contracts | Digital Contract Management | MEDIUM - Legal compliance |
| CRM Pipeline | Customer Relationship Management | MEDIUM - Sales operations |
| ERP Sync | SAP/Odoo Integration | HIGH - Inventory accuracy |
| WebRTC Calls | Video/Audio Communication | LOW - Buyer-seller interaction |
| AR Showroom | 3D Product Visualization | LOW - Enhanced UX |

### Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CDN / Load Balancer                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    Next.js Application (Port 3000)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Payment │ │  CRM    │ │   ERP   │ │   AR    │ │WebRTC   │      │
│  │ Service │ │Pipeline │ │  Sync   │ │Viewer   │ │Signaling│      │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘      │
└───────┼──────────┼──────────┼──────────┼──────────┼───────────────┘
        │          │          │          │          │
┌───────▼──────────▼──────────▼──────────▼──────────▼───────────────┐
│                     Infrastructure Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │
│  │ PostgreSQL  │  │    Redis    │  │     Object Storage      │    │
│  │   (Primary) │  │   (Cache)   │  │   (AR Models/Files)     │    │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Daily Operations

### 1.1 Server Health Monitoring Checklist

**Time:** 09:00 AM (Daily)  
**Duration:** 15-30 minutes  
**Responsible:** On-Call Engineer

#### Pre-Shift Health Check

```bash
#!/bin/bash
# Daily Health Check Script - Run at start of each shift

echo "=== AlgeriaTrade.dz Daily Health Check ==="
echo "Timestamp: $(date)"

# 1. Application Health
echo -n "[1/10] Application Health: "
curl -sf https://algeriatrade.dz/api/health | jq -r '.status // "UNKNOWN"'

# 2. Database Connectivity
echo -n "[2/10] Database Status: "
pg_isready -h $DB_HOST -p $DB_PORT 2>/dev/null && echo "OK" || echo "FAIL"

# 3. Redis Status
echo -n "[3/10] Redis Status: "
redis-cli -u $REDIS_URL ping 2>/dev/null || echo "FAIL"

# 4. Disk Space (>85% = warning)
echo -n "[4/10] Disk Usage: "
df -h / | awk 'NR==2 {print $5}'

# 5. Memory Usage
echo -n "[5/10] Memory Usage: "
free -m | awk 'NR==2 {printf "%.0f%%", ($3/$2)*100}'

# 6. Docker Containers
echo "[6/10] Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 7. SSL Certificate Expiry
echo -n "[7/10] SSL Expiry: "
echo | openssl s_client -connect algeriatrade.dz:443 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2

# 8. Active Connections
echo -n "[8/10] Active WebSocket Connections: "
redis-cli -u $REDIS_URL SCARD webrtc:active_sessions 2>/dev/null || echo "N/A"

# 9. Background Jobs Queue
echo -n "[9/10] Pending Jobs: "
redis-cli -u $REDIS_URL LLEN jobs:pending 2>/dev/null || echo "N/A"

# 10. Recent Errors (last hour)
echo "[10/10] Error Rate (last hour): "
# Query your metrics system for error count

echo "=== Health Check Complete ==="
```

#### Health Check Thresholds

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| CPU Usage | < 60% | 60-80% | > 80% |
| Memory Usage | < 70% | 70-85% | > 85% |
| Disk Usage | < 75% | 75-85% | > 90% |
| Database Connections | < 70% max | 70-85% max | > 90% max |
| Redis Memory | < 75% | 75-88% | > 92% |
| Response Time p95 | < 500ms | 500ms-2s | > 2s |
| Error Rate | < 0.1% | 0.1-1% | > 1% |

### 1.2 Backup Verification Procedure

**Time:** 10:00 AM (Daily)  
**Duration:** 10 minutes

#### Steps:

1. **Verify Nightly Backup Completion**
```bash
# Check last night's backup exists and has content
ls -lah /backups/production/$(date -d yesterday +%Y%m%d)*.sql.gz

# Verify backup integrity (file should be valid gzip)
gzip -t /backups/production/$(date -d yesterday +%Y%m%d)_database.sql.gz && echo "Backup valid"

# Check backup size (should be > minimum threshold)
BACKUP_SIZE=$(stat -c%s /backups/production/$(date -d yesterday +%Y%m%d)_database.sql.gz)
if [ "$BACKUP_SIZE" -lt 1048576 ]; then  # Less than 1MB
    echo "WARNING: Backup suspiciously small"
fi
```

2. **Verify Backup Retention**
```bash
# Should have 7 daily backups + weekly backups
echo "Daily backups: $(ls /backups/production/*_database.sql.gz 2>/dev/null | wc -l)"
echo "Weekly backups: $(ls /backups/production/weekly/*_database.sql.gz 2>/dev/null | wc -l)"
```

3. **Test Restore Verification** (Weekly on Monday)
```bash
# Create test database from backup
createdb backup_verify_test
gunzip -c /backups/production/$(date -d yesterday +%Y%m%d)_database.sql.gz | psql backup_verify_test

# Run verification queries
psql backup_verify_test -c "SELECT COUNT(*) FROM users;"
psql backup_verify_test -c "SELECT COUNT(*) FROM orders;"
psql backup_verify_test -c "SELECT COUNT(*) FROM products;"

# Cleanup
dropdb backup_verify_test
```

### 1.3 Log Review Procedures

**Time:** 11:00 AM (Daily)  
**Duration:** 20-30 minutes

#### Key Logs to Review

| Log Source | Location | What to Look For |
|------------|----------|------------------|
| Application | `/var/log/algeriatrade/app.log` | Unhandled exceptions, slow queries |
| Nginx/Caddy | `/var/log/nginx/access.log` | 4xx/5xx spikes, unusual IPs |
| Database | `/var/log/postgresql/postgresql-*` | Connection errors, deadlocks |
| Redis | `/var/log/redis/redis-server.log` | Memory warnings, persistence errors |
| Docker | `docker logs container_name` | Container crashes, OOM kills |
| Payment Webhooks | `/var/log/algeriatrade/webhooks.log` | Failed webhooks, signature mismatches |

#### Log Analysis Commands

```bash
# Top error types in last 24 hours
tail -n 10000 /var/log/algeriatrade/app.log | grep -i "error" | \
    sed 's/.*\[ERROR\].*//' | sort | uniq -c | sort -rn | head -20

# 5xx errors by endpoint
grep " 5[0-9][0-9] " /var/log/nginx/access.log | \
    awk '{print $7}' | sort | uniq -c | sort -rn | head -15

# Slow requests (>2s)
awk '$NF > 2 {print $NF, $7}' /var/log/nginx/access.log | \
    sort -rn | head -20

# Failed payment attempts
grep -i "payment.*failed\|payment.*error" /var/log/algeriatrade/webhooks.log | \
    tail -50

# Authentication failures (potential brute force)
grep "401\|403" /var/log/nginx/access.log | \
    awk '{print $1}' | sort | uniq -c | sort -rn | head -10
```

### 1.4 Performance Metrics to Watch

#### Key Performance Indicators (KPIs)

| KPI | Target | Alert Threshold | Dashboard Panel |
|-----|--------|-----------------|-----------------|
| Page Load Time (p95) | < 2s | > 3s | Performance Overview |
| API Response Time (p99) | < 500ms | > 2s | API Latency |
| Time to First Byte | < 200ms | > 500ms | Server Response |
| Payment Success Rate | > 98% | < 95% | Payment Metrics |
| Search Response Time | < 300ms | > 800ms | Search Performance |
| AR Model Load Time | < 3s | > 5s | AR Performance |
| WebSocket Latency | < 100ms | > 300ms | Real-time Metrics |

#### Grafana Dashboard Panels to Monitor

1. **Overview Dashboard** (`algeriatrade-overview`)
   - Request rate (requests/sec)
   - Error rate (%)
   - Active users
   - Revenue (real-time)

2. **Payment Dashboard** (`algeriatrade-payments`)
   - Transactions by provider
   - Success/failure rates
   - Average transaction value
   - Pending settlements

3. **Infrastructure Dashboard** (`algeriatrade-infrastructure`)
   - CPU/Memory/Disk usage
   - Database connections
   - Redis memory
   - Container health

---

## Section 2: Payment Operations

### 2.1 SATIM Reconciliation Steps

**Frequency:** Daily (next business day morning)  
**Responsible:** Finance Ops / Payment Specialist

#### SATIM (CIB) Daily Reconciliation

```python
#!/usr/bin/env python3
"""
SATIM Daily Reconciliation Script
Compares AlgeriaTrade records with CIB settlement reports
"""

import json
from datetime import datetime, timedelta
import requests

# Configuration
SATIM_API_BASE = "https://api.cib.dz/v1"
ALGERIATRADE_API = "https://algeriatrade.dz/api/admin"

def get_satim_transactions(date):
    """Fetch transactions from CIB for given date"""
    # CIB API call to get transaction report
    pass

def get_platform_transactions(date):
    """Fetch recorded transactions from platform"""
    response = requests.get(
        f"{ALGERIATRADE_API}/payments/satim",
        params={"date": date.isoformat(), "status": "completed"},
        headers={"Authorization": "Bearer ADMIN_TOKEN"}
    )
    return response.json()

def reconcile(date=None):
    """Main reconciliation function"""
    if date is None:
        date = datetime.now().date() - timedelta(days=1)
    
    print(f"=== SATIM Reconciliation for {date} ===")
    
    satim_txns = get_satim_transactions(date)
    platform_txns = get_platform_transactions(date)
    
    # Match by transaction reference
    matched = []
    satim_only = []
    platform_only = []
    
    for txn in satim_txns:
        ref = txn['reference']
        platform_match = next((t for t in platform_txns if t['ref'] == ref), None)
        if platform_match:
            # Verify amounts match
            if abs(txn['amount'] - platform_match['amount']) > 0.01:
                print(f"MISMATCH Amount: {ref} - SATIM:{txn['amount']} vs Platform:{platform_match['amount']}")
            matched.append({'satim': txn, 'platform': platform_match})
        else:
            satim_only.append(txn)
    
    for txn in platform_txns:
        ref = txn['ref']
        satim_match = next((t for t in satim_txns if t['reference'] == ref), None)
        if not satim_match:
            platform_only.append(txn)
    
    # Report results
    print(f"\nMatched: {len(matched)}")
    print(f"SATIM only (not in platform): {len(satim_only)}")
    print(f"Platform only (not in SATIM): {len(platform_only)}")
    
    # Flag discrepancies requiring investigation
    if satim_only or platform_only:
        print("\n⚠️ DISCREPANCIES DETECTED - Manual review required")
        
    return {
        'matched': len(matched),
        'satim_only': len(satim_only),
        'platform_only': len(platform_only),
        'discrepancies': satim_only + platform_only
    }

if __name__ == "__main__":
    reconcile()
```

#### SATIM Reconciliation Checklist

- [ ] Download CIB daily settlement report from merchant portal
- [ ] Export platform transactions for reconciliation period
- [ ] Match transactions by reference number
- [ ] Verify amounts match (tolerance: ±0.01 DZD)
- [ ] Investigate unmatched transactions:
  - SATIM-only: Possible webhook failure or timing issue
  - Platform-only: Possible failed settlement or pending status
- [ ] Document any discrepancies with root cause
- [ ] Escalate if discrepancy > 0.5% of total volume
- [ ] Archive reconciliation report

### 2.2 Stripe Payout Verification

**Frequency:** Daily  
**Responsible:** Finance Ops

#### Stripe Daily Checklist

```bash
#!/bin/bash
# Stripe Payout Verification Script

STRIPE_API_KEY="$STRIPE_SECRET_KEY"
DATE_YESTERDAY=$(date -d yesterday +%Y-%m-%d)

echo "=== Stripe Payout Verification - $DATE_YESTERDAY ==="

# 1. Get balance
echo -n "Available Balance: "
curl -s https://api.stripe.com/v1/balance \
    -u "$STRIPE_API_KEY:" | jq '.available[0].amount'

# 2. Get yesterday's charges
echo -n "Yesterday's Charges Count: "
curl -s "https://api.stripe.com/v1/charges?created.gte=$(date -d yesterday +%s)&created.lt=$(date +%s)&limit=100" \
    -u "$STRIPE_API_KEY:" | jq '.total_count'

# 3. Get pending balance
echo -n "Pending Balance: "
curl -s https://api.stripe.com/v1/balance \
    -u "$STRIPE_API_KEY:" | jq '.pending[0].amount'

# 4. Check for disputes
echo -n "Open Disputes: "
curl -s "https://api.stripe.com/v1/disputes?status=needs_response" \
    -u "$STRIPE_API_KEY:" | jq '.total_count'

# 5. Recent payouts (last 7 days)
echo "Recent Payouts:"
curl -s "https://api.stripe.com/v1/payouts?limit=5" \
    -u "$STRIPE_API_KEY:" | jq '.data[] | {id, amount, status, arrival_date}'
```

#### Stripe Dispute Handling Procedure

1. **Immediate Action (within 24 hours)**
   - Review dispute reason code
   - Gather evidence (delivery confirmation, communication logs)
   - Submit evidence through Stripe Dashboard

2. **Evidence Requirements**
   - Proof of service/product delivery
   - Customer communication history
   - Terms of service acknowledgment
   - Refund policy disclosure

3. **Escalation Path**
   - Loss < $100: Auto-accept if evidence weak
   - Loss $100-$1000: Legal review required
   - Loss > $1000: Executive approval + legal review

### 2.3 Crypto Transaction Monitoring

**Frequency:** Continuous (automated alerts) + Hourly manual check  
**Responsible:** Treasury Ops / Blockchain Specialist

#### Crypto Monitoring Dashboard Checks

| Metric | Normal Range | Warning | Action Required |
|--------|--------------|---------|-----------------|
| Confirmations (BTC) | 3+ | < 3 after 30min | Monitor, flag if >1hr |
| Confirmations (ETH) | 12+ | < 12 after 10min | Monitor, flag if >30min |
| Mempool backlog | < 50k tx | 50k-200k tx | Warn users of delays |
| Network fee (satoshi/byte) | < 50 | 50-200 | Adjust fee estimates |
| Cold wallet balance | > threshold | < threshold | Initiate transfer |

#### Crypto Reconciliation Process

```bash
#!/bin/bash
# Crypto Wallet Reconciliation

BTC_WALLET="bc1q..."  # Main receiving wallet
ETH_WALLET="0x..."    # Main ETH wallet

echo "=== Crypto Wallet Balances ==="

# Bitcoin balance
echo -n "BTC Balance: "
bitcoin-cli getbalance 2>/dev/null || \
    curl -s "https://blockchain.info/balance?active=$BTC_WALLET" | jq ".[] / 100000000"

# Ethereum balance (plus ERC20 tokens)
echo -n "ETH Balance: "
curl -s "https://api.etherscan.io/api?module=account&action=balance&address=$ETH_WALLET&tag=latest" | \
    jq ".result | . / 1e18"

# USDT balance (TRC20)
echo -n "USDT (TRC20): "
# TronGrid API call for USDT balance

# Compare with internal ledger
echo ""
echo "=== Internal Ledger vs On-chain ==="
# Query database for expected balances
psql $DATABASE_URL -c "
SELECT 
    currency,
    SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as ledger_balance
FROM crypto_transactions 
WHERE status = 'confirmed'
GROUP BY currency;
"
```

### 2.4 DPA Payment Tracking

**Frequency:** Per-transaction monitoring  
**Responsible:** Trade Finance Specialist

#### DPA (Documentaire de Paiement) Workflow Tracking

```
DPA Request → Bank Review → BG Issuance → Shipment → Document Submission → Payment Release
     ↓            ↓             ↓           ↓              ↓                ↓
   [PENDING]  [REVIEWING]  [ISSUED]   [IN_TRANSIT]  [DOCS_SUBMITTED]  [COMPLETED]
                                                              ↑
                                                        [DISPUTED]
```

#### DPA Daily Tasks

- [ ] Review new DPA applications (status: PENDING)
- [ ] Follow up on bank reviews taking >48 hours
- [ ] Track issued bank guarantees expiring within 30 days
- [ ] Verify document submissions match shipment details
- [ ] Process payment releases upon document acceptance
- [ ] Handle disputed DPAs (escalate to legal if needed)

### 2.5 Invoice Generation Queue

**Frequency:** Every 4 hours  
**Responsible:** Billing Operations

#### Invoice Queue Monitoring

```sql
-- Check invoice generation queue status
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_in_queue,
    MAX(created_at) as newest
FROM invoices
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Identify stuck invoices (processing > 30 min)
SELECT 
    id,
    invoice_number,
    status,
    created_at,
    updated_at,
    NOW() - updated_at as time_since_update
FROM invoices
WHERE status = 'generating'
AND updated_at < NOW() - INTERVAL '30 minutes';

-- Failed invoices needing retry
SELECT 
    id,
    invoice_number,
    error_message,
    retry_count,
    created_at
FROM invoices
WHERE status = 'failed'
AND retry_count < 3
ORDER BY created_at DESC
LIMIT 20;
```

#### Invoice Generation Troubleshooting

| Error Type | Common Cause | Resolution |
|------------|--------------|------------|
| Template not found | Missing template config | Upload correct template |
| Tax calculation error | Invalid TVA rate | Fix rate configuration |
| PDF generation timeout | Large invoice / server load | Retry, scale workers |
| Email delivery failure | SMTP issue / invalid address | Check mail logs, verify email |
| Sequential number conflict | Concurrent generation | Implement proper locking |

---

## Section 3: Incident Response

### 3.1 Severity Classification

| Severity | Name | Definition | Response Time | Resolution Target |
|----------|------|------------|---------------|-------------------|
| **P1** | Critical | Complete service outage or data breach affecting all users | 5 minutes | 1 hour |
| **P2** | High | Major feature down affecting significant users (payments, core features) | 15 minutes | 4 hours |
| **P3** | Medium | Degraded performance or non-critical feature unavailable | 30 minutes | 24 hours |
| **P4** | Low | Minor issues, cosmetic bugs, single user impact | 4 hours | 1 week |

### 3.2 Severity Examples by Feature Area

#### P1 (Critical) Incidents
- All payment providers down simultaneously
- Database inaccessible or data corruption detected
- Security breach confirmed (unauthorized access, data exfiltration)
- Complete platform outage (>99% users affected)
- SSL certificate expired causing site inaccessibility

#### P2 (High) Incidents
- Single payment provider down (SATIM OR Stripe)
- ERP sync failing causing inventory desynchronization
- Crypto wallet compromise suspected
- API error rate > 5%
- Database replication lag > 5 minutes
- WebRTC service completely down

#### P3 (Medium) Incidents
- AR models loading slowly but functional
- Currency rates stale (>1 hour old)
- CRM analytics delayed
- Non-payment email notifications delayed
- Single region/performance degradation

#### P4 (Low) Incidents
- Cosmetic UI issues
- Typos in communications
- Single user reporting issues
- Documentation inaccuracies
- Minor logging anomalies

### 3.3 Escalation Procedures

#### Escalation Matrix

```
Level 1: On-Call Engineer (First Responder)
    ↓ (Unable to resolve in 15 min for P1/P2)
Level 2: Senior Engineer / Tech Lead
    ↓ (Unable to resolve in 1 hour for P1, 4 hours for P2)
Level 3: Engineering Manager
    ↓ (Executive notification required)
Level 4: VP Engineering / CTO
    ↓ (Customer/external impact)
Level 5: CEO + Communications Team
```

#### Contact Information

| Role | Primary | Backup | Escalation Trigger |
|------|---------|--------|-------------------|
| On-Call L1 | PagerDuty Primary | PagerDuty Secondary | All incidents |
| Senior Engineer | [Name/Contact] | [Backup] | P1/P2 escalation |
| Engineering Manager | [Name/Contact] | [Backup] | P1 > 30min, P2 > 2hr |
| DevOps Lead | [Name/Contact] | [Backup] | Infrastructure issues |
| Security Lead | [Name/Contact] | [Backup] | Any security incident |
| Product Owner | [Name/Contact] | [Backup] | Customer-facing decisions |
| Communications | [Team Email] | [Backup] | Public communication needed |

### 3.4 Communication Templates

#### Internal Incident Notification (Slack)

```markdown
🚨 **[P{SEVERITY}] Incident Declared: {TITLE}**

**Impact:** {DESCRIPTION OF IMPACT}
**Started:** {TIMESTAMP}
**Investigator:** @{ON_CALL_PERSON}

**Current Status:** 🔴 IDENTIFYING / 🟡 INVESTIGATING / 🟢 MITIGATED / ✅ RESOLVED

**Timeline:**
• `{TIME}` - Incident detected via {SOURCE}
• `{TIME}` - Investigation started
• `{TIME}` - [Updates]

**Next Update:** {TIME or ASAPP}

**Runbook:** {LINK_TO_RELEVANT_RUNBOOK}
**War Room:** #{CHANNEL_NAME}

@channel
```

#### Customer Communication (Email/Site Banner)

```markdown
**Subject:** Service Interruption - {FEATURE_AFFECTED}

Dear Valued Customer,

We are currently experiencing an issue affecting {FEATURE_DESCRIPTION}.
Our team is actively working to restore full functionality.

**What's Affected:** {CLEAR DESCRIPTION}
**Expected Resolution:** {ESTIMATED TIME or ASAP}

We apologize for any inconvenience this may cause.
Updates will be posted at: https://status.algeriatrade.dz

Thank you for your patience.

The AlgeriaTrade.dz Team
```

#### Post-Incident Report Template

```markdown
# Post-Incident Report: {TITLE}

## Summary
{Brief description of what happened}

## Impact
- **Users Affected:** {NUMBER or ESTIMATE}
- **Duration:** {START_TIME} to {END_TIME} ({TOTAL_DURATION})
- **Features Affected:** {LIST}
- **Revenue Impact:** {IF APPLICABLE}

## Timeline
| Time | Event | Owner |
|------|-------|-------|
| HH:MM | Incident detected | {Who} |
| HH:MM | Page sent | PagerDuty |
| HH:MM | Investigation started | {Who} |
| HH:MM | Root cause identified | {Who} |
| HH:MM | Mitigation applied | {Who} |
| HH:MM | Service restored | {Who} |
| HH:MM | Incident resolved | {Who} |

## Root Cause
{Technical explanation of why it happened}

## Resolution
{What was done to fix it}

## Action Items
- [ ] {ITEM} - {OWNER} - {DUE_DATE}
- [ ] {ITEM} - {OWNER} - {DUE_DATE}

## Lessons Learned
{What can we do better?}
```

### 3.5 Runbooks for Common Incidents

#### Runbook: Payment Gateway Down (SATIM/Stripe)

**Trigger:** Payment success rate drops below 95% OR provider health check fails

**Immediate Actions (0-5 minutes):**

1. **Confirm Scope**
```bash
# Check which provider(s) are affected
curl -s https://algeriatrade.dz/api/payments/status | jq '.providers[] | select(.healthy == false)'
```

2. **Check Provider Status Pages**
- SATIM/CIB: Contact CIB technical support directly
- Stripe: https://status.stripe.com/
- Crypto: Block explorers (blockchain.info, etherscan.io)

3. **Enable Fallback Mode**
```bash
# If SATIM down, route to Stripe
# If both card processors down, show maintenance message for payments
curl -X POST https://algeriatrade.dz/api/admin/payments/fallback \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"mode": "stripe_only", "reason": "SATIM outage"}'
```

4. **Communicate**
- Post status page update
- Notify customer support team
- Prepare customer messaging if extended outage

**Investigation (5-30 minutes):**

1. **Review Provider Logs**
```bash
# Check recent payment attempts and failures
psql $DATABASE_URL -c "
SELECT 
    provider,
    status,
    COUNT(*),
    MIN(created_at) as first_failure,
    error_code
FROM payment_attempts 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY provider, status, error_code
ORDER BY COUNT(*) DESC;
"
```

2. **Check Webhook Delivery**
```bash
# Verify webhooks are being received
tail -f /var/log/algeriatrade/webhooks.log | grep -i "satim\|stripe"
```

3. **Test API Connectivity**
```bash
# Direct API test to provider
curl -v https://api.cib.dz/v1/health  # SATIM
curl -v https://api.stripe.com/v1/health  # Stripe
```

**Resolution Actions:**

| Scenario | Action |
|----------|--------|
| Provider outage | Wait for provider resolution, use fallback |
| API credentials expired | Rotate credentials from secrets manager |
| Rate limiting hit | Reduce request rate, contact provider for limit increase |
| IP blocked | Verify whitelisted IPs with provider |
| Certificate issue | Renew/update TLS certificates |

**Post-Incident:**
- Document root cause
- Review fallback effectiveness
- Update runbook if new learnings

---

#### Runbook: High Error Rates

**Trigger:** API error rate exceeds 1% for >5 minutes

**Immediate Actions:**

1. **Identify Error Pattern**
```bash
# Get current error rate
curl -s https://algeriatrade.dz/api/health | jq '.error_rate'

# Top erroring endpoints
jq 'select(.level == "ERROR") | .endpoint' /var/log/algeriatrade/app.log | \
    sort | uniq -c | sort -rn | head -20
```

2. **Check Infrastructure Health**
```bash
# Resource utilization
top -bn1 | head -5
free -m
df -h

# Database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Redis memory
redis-cli -u $REDIS_URL INFO memory | grep used_memory_human
```

3. **Recent Deployments**
```bash
# Check if recent deployment correlates
git log --since="2 hours ago" --oneline
kubectl rollout history deployment/algeriatrade-app  # If Kubernetes
```

**Common Causes & Fixes:**

| Error Pattern | Likely Cause | Quick Fix |
|---------------|--------------|-----------|
| 502/503 everywhere | App crashed/restarting | Check containers, restart if needed |
| 504 on specific endpoints | Timeout (slow query/external API) | Identify slow endpoint, add cache |
| 429 Too Many Requests | Rate limit exceeded | Check for abuse, adjust limits |
| 400 Bad Request | Client-side issue or schema change | Check recent deployments |
| Database connection errors | Pool exhausted or DB issue | Scale connections, check DB health |

**Escalation:** If error rate > 5% for >15 minutes, escalate to P2

---

#### Runbook: Database Issues

**Trigger:** Database connection errors, slow queries, replication lag

**Diagnosis:**

```bash
# 1. Check connectivity
pg_isready -h $DB_HOST -p $DB_PORT

# 2. Connection count
psql $DATABASE_URL -c "
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Check for blocked queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
"

# 3. Replication status (if replica)
psql $DATABASE_URL -c SELECT * FROM pg_stat_replication;

# 4. Table bloat/size
psql $DATABASE_URL -c "
SELECT relname, n_live_tup, n_dead_tup, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size(relid) DESC 
LIMIT 10;
"
```

**Common Issues & Solutions:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| Connection pool exhausted | "Too many connections" error | Increase pool size, check for leaks |
| Long-running query | Overall slowdown | Kill long queries, add indexes |
| Lock contention | Queries waiting | Identify blocking transaction |
| Disk full | Write errors | Clean up, expand storage |
| Replication lag | Stale reads on replica | Check network, reduce write load |
| Autovacuum issues | Table bloat | Tune autovacuum, run manual vacuum |

**Emergency Procedures:**

```bash
# Kill problematic connections (use carefully!)
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '30 minutes' AND pid != pg_backend_pid();"

# Emergency vacuum (if autovacuum stuck)
psql $DATABASE_LOG -c "VACUUM VERBOSE ANALYZE [table_name];"

# Restart connection pooler (PgBouncer etc.)
sudo systemctl restart pgbouncer
```

---

#### Runbook: CDN Problems

**Trigger:** Static assets returning errors, slow asset loads, cache issues

**Diagnosis:**

```bash
# Test CDN endpoints
curl -I https://cdn.algeriatrade.dz/static/main.js
curl -I https://cdn.algeriatrade.dz/images/logo.svg

# Check cache headers
curl -I https://cdn.algeriatrade.dz/static/main.js | grep -i "cache-control\|x-cache"

# DNS resolution
dig cdn.algeriatrade.dz
nslookup cdn.algeriatrade.dz
```

**Common CDN Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Origin access identity misconfigured | Update CloudFront OAI settings |
| 404 Not Found | File not deployed to origin | Redeploy assets |
| Stale content | Cache not invalidated | Purge CDN cache |
| Slow responses | Origin slow or CDN edge issue | Check origin health, purge cache |
| SSL errors | Certificate mismatch | Renew/update certificate |

**Cache Invalidation Commands:**

```bash
# CloudFront cache invalidation
aws cloudfront create-invalidation \
    --distribution-id YOUR_DIST_ID \
    --paths "/static/*" "/images/*"

# Fastly purge
curl -X PURGE -H "Fastly-Key: $FASTLY_TOKEN" https://cdn.algeriatrade.dz/static/*

# Cloudflare purge
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
```

---

#### Runbook: SSL Certificate Expiry

**Trigger:** Certificate expiring within 7 days OR browser security warnings

**Prevention (Automated):**

```bash
# Check certificate expiry
echo | openssl s_client -servername algeriatrade.dz -connect algeriatrade.dz:443 2>/dev/null | \
    openssl x509 -noout -dates

# Automated renewal (Let's Encrypt / Certbot)
certbot renew --dry-run  # Test renewal works
```

**Emergency Renewal:**

1. **Let's Encrypt (Certbot)**
```bash
certbot certonly --webroot -w /var/www/html -d algeriatrade.dz -d www.algeriatrade.dz
systemctl reload nginx  # or caddy
```

2. **Commercial Certificate**
```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes -keyout algeriatrade.key -out algeriatrade.csr

# Submit CSR to CA, receive certificate
# Install certificate
cp algeriatrade.crt /etc/ssl/certs/
cp algeriatrade.key /etc/ssl/private/
# Reload web server
```

3. **CDN Certificate** (CloudFront, Cloudflare)
   - Update through provider console or API
   - Allow 15-30 minutes for propagation

---

## Section 4: Maintenance Procedures

### 4.1 Scheduled Maintenance Checklist

**Frequency:** Monthly major + Weekly minor

#### Weekly Maintenance (Sundays 02:00-04:00 Local Time)

- [ ] Rotate application logs
- [ ] Clear temporary files and caches
- [ ] Update virus/malware definitions
- [ ] Review and apply security patches (if low risk)
- [ ] Verify backup integrity (spot check)
- [ ] Restart long-running processes (prevent memory leaks)
- [ ] Check certificate expiry (>30 days remaining?)
- [ ] Review disk usage trends

#### Monthly Maintenance (First Sunday of Month)

- [ ] Full security audit scan
- [ ] Database maintenance (VACUUM ANALYZE, reindex)
- [ ] Review and clean up orphaned records
- [ ] Update dependencies (test in staging first)
- [ ] Capacity planning review
- [ ] Disaster recovery drill (quarterly)
- [ ] Access control review (remove former employee access)
- [ ] API key rotation (where applicable)
- [ ] Performance baseline review

### 4.2 Zero-Downtime Deployment Steps

#### Prerequisites

1. **Infrastructure Ready**
   - Load balancer configured for rolling updates
   - At least 2 application instances running
   - Database migrations backward-compatible
   - Feature flags ready for gradual rollout

2. **Communication Sent**
   - Stakeholders notified 48 hours in advance
   - Maintenance window scheduled (if any downtime possible)
   - Rollback plan documented and tested
   - On-call engineer assigned

#### Deployment Procedure

```bash
#!/bin/bash
# Zero-Downtime Rolling Deployment

set -e

IMAGE_TAG="${1:-latest}"
DESIRED_REPLICAS=3
GRACE_PERIOD=30  # seconds between pod terminations

echo "Starting zero-downtime deployment..."

# 1. Pre-deployment health check
echo "Verifying current cluster health..."
# [Health check commands]

# 2. Update container image (triggers rolling restart)
echo "Updating to image: $IMAGE_TAG"
kubectl set image deployment/algeriatrade-app \
    app=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# 3. Monitor rollout progress
echo "Monitoring rollout..."
kubectl rollout status deployment/algeriatrade-app --timeout=300s

# 4. Verify each pod becomes healthy before proceeding
READY_COUNT=$(kubectl get pods -l app=algeriatrade-app -o json | jq '.items | map(select(.status.phase == "Running" and .status.conditions[].status == "True")) | length')

while [ "$READY_COUNT" -lt "$DESIRED_REPLICAS" ]; do
    echo "Waiting for pods... ($READY_COUNT/$DESIRED_REPLICAS ready)"
    sleep 10
    READY_COUNT=$(kubectl get pods -l app=algeriatrade-app -o json | jq '[.items[] | select(.status.ready == true)] | length')
done

# 5. Run post-deployment checks
echo "Running post-deployment verification..."
# [Verification commands]

# 6. Mark deployment complete
echo "Deployment complete!"
kubectl annotate deployment/algeriatrade-app kubernetes.io/change-cause="Deployed $IMAGE_TAG at $(date)"
```

#### Blue-Green Deployment (Alternative)

For more complex changes requiring instant rollback capability:

1. Deploy new version to "green" environment
2. Run smoke tests against green
3. Switch load balancer to green (instant cutover)
4. Monitor for issues
5. If problems: switch back to blue instantly
6. After stability period: blue becomes deprecated

### 4.3 Cache Invalidation Procedures

#### Redis Cache Invalidation

```bash
#!/bin/bash
# Cache Invalidation Utilities

REDIS_CLI="redis-cli -u $REDIS_URL"

# Invalidate all product-related cache
invalidate_products() {
    local product_id="${1:-*}"
    $REDIS_CLI KEYS "products:${product_id}:*" | xargs -r $REDIS_CLI DEL
    echo "Product cache invalidated"
}

# Invalidate currency rates cache
invalidate_currency_rates() {
    $REDIS_CLI DEL "currency:rates:*" "currency:conversion:*"
    echo "Currency cache invalidated"
}

# Invalidate user session cache
invalidate_user_session() {
    local user_id="$1"
    $REDIS_CLI DEL "session:user:${user_id}"
    echo "User session invalidated for user ${user_id}"
}

# Invalidate all search result caches
invalidate_search_cache() {
    $REDIS_CLI KEYS "search:*" | xargs -r $REDIS_CLI DEL
    echo "Search cache invalidated"
}

# Warm critical caches after invalidation
warm_caches() {
    echo "Warming caches..."
    curl -sf https://algeriatrade.dz/api/currency/rates > /dev/null
    curl -sf https://algeriatrade.dz/api/categories > /dev/null
    curl -sf https://algeriatrade.dz/api/products/featured > /dev/null
    echo "Cache warming complete"
}

# Usage
case "${1:-}" in
    products) invalidate_products "${2:-}" ;;
    currency) invalidate_currency_rates ;;
    session) invalidate_user_session "$2" ;;
    search) invalidate_search_cache ;;
    all) 
        invalidate_products
        invalidate_currency_rates
        invalidate_search_cache
        warm_caches
        ;;
    *) echo "Usage: $0 {products|currency|session|search|all} [id]" ;;
esac
```

#### CDN Cache Invalidation

| Trigger | Invalidation Scope | Method |
|---------|-------------------|--------|
| CSS/JS bundle update | `/static/*.js`, `/static/*.css` | Versioned filenames (auto-invalidate) |
| Image update | Specific image path | Single file purge |
| Global UI change | All static assets | Full purge (use sparingly) |
| Emergency fix | All caches | Full purge + clear browser cache headers |

### 4.4 Index Optimization

#### Database Index Maintenance

```sql
-- Identify missing indexes (run during low traffic)
SELECT 
    schemaname || '.' || relname AS table,
    idx_scan,
    seq_scan,
    CASE WHEN seq_scan > 0 
        THEN round(100.0 * idx_scan / seq_scan, 1)
        ELSE 0 
    END AS index_usage_pct,
    pg_size_pretty(pg_relation_size(schemaname || '.' || relname)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_scan DESC
LIMIT 20;

-- Find unused indexes (wasting space)
SELECT 
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan < 50
AND indexrelname NOT LIKE '%_pkey%'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Index bloat check
SELECT 
    schemaname,
    tablename,
    indexname,
    round(100 * bt.bloat::numeric, 1) AS bloat_pct,
    pg_size_pretty(bt.real_size) AS size
FROM (
    SELECT 
        ns.nspname AS schemaname,
        tbl.relname AS tablename,
        idx.relname AS indexname,
        (idx_pages * bs) AS real_size,
        (idx_pages_est * bs) AS est_size,
        CASE WHEN idx_pages_est = 0 THEN 0 ELSE idx_pages::float / idx_pages_est END AS ratio
    FROM (
        SELECT 
            indexrelid,
            relname,
            relpages AS idx_pages,
            ceil(reltuples / (bs * fillfactor - 24)) AS idx_pages_est
        FROM pg_stats s
        JOIN pg_class c ON c.relname = s.attrelid::regclass
        JOIN pg_index i ON i.indexrelid = c.oid
        CROSS JOIN (SELECT current_setting('block_size')::int AS bs, 90 AS fillfactor) AS consts
        WHERE s.attname = (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = s.attrelid AND a.attnum = 1 LIMIT 1)
    ) AS sub
    JOIN pg_index ON pg_index.indexrelid = sub.indexrelid
    JOIN pg_class idx ON idx.oid = sub.indexrelid
    JOIN pg_class tbl ON tbl.oid = indrelid
    JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
) AS bt
WHERE ratio > 1.5
ORDER BY ratio DESC
LIMIT 15;
```

#### Recommended Indexes for Phase 8 Tables

```sql
-- Payment performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_attempts_created 
ON payment_attempts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_attempts_provider_status 
ON payment_attempts(provider, status);

-- ERP sync log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_erp_sync_logs_timestamp 
ON erp_sync_logs(synced_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_erp_sync_logs_status 
ON erp_sync_logs(integration_id, status);

-- CRM pipeline indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_deals_pipeline_stage 
ON crm_deals(pipeline_id, stage_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_activities_created 
ON crm_activities(created_at DESC);

-- Currency rates index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_currency_rates_date_pair 
ON currency_rates(effective_date, from_currency, to_currency);

-- AR model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ar_models_status 
ON ar_models(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ar_models_product 
ON ar_models(product_id);

-- Invoice indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status_date 
ON invoices(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_company 
ON invoices(company_id, status);
```

---

## Section 5: Scaling Procedures

### 5.1 Auto-scaling Triggers

#### Horizontal Pod Autoscaler (Kubernetes) Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: algeriatrade-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: algeriatrade-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 4
        periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

#### Custom Scaling Metrics

| Metric | Scale Up When | Scale Down When | Notes |
|--------|---------------|-----------------|-------|
| Requests per second | > 1000/pod | < 200/pod | Primary scaling metric |
| HTTP latency p95 | > 500ms | < 200ms | User experience metric |
| Queue depth | > 100 | < 20 | Background job queue |
| WebSocket connections | > 500/pod | < 200/pod | Real-time features |
| Error rate | > 1% | < 0.1% | Only scale up on errors |

### 5.2 Database Scaling

#### Read Replicas Setup

```yaml
# PostgreSQL read replica configuration
# Add to docker-compose.production.yml

postgres-replica:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: algeriatrade
    POSTGRES_PASSWORD: ${DB_PASSWORD}
    POSTGRES_DB: algeriatrade_replica
  command: >
    postgres -c hot_standby=on
    -c primary_conninfo='host=db port=5432 user=algeriatrade'
  volumes:
    - postgres-replica-data:/var/lib/postgresql/data
  depends_on:
    db:
      condition: service_healthy
```

#### Connection Pooling (PgBouncer)

```
[databases]
algeriatrade = host=db port=5432 dbname=algeriatrade

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 300
```

#### When to Scale Database

| Indicator | Current | Action Needed |
|-----------|---------|---------------|
| Connections/max | > 80% | Add connection pooling |
| CPU sustained | > 70% | Consider read replicas |
| Disk I/O wait | > 20% | SSD upgrade or sharding |
| Query latency p99 | > 500ms | Index optimization or scale |
| Storage used | > 75% | Plan capacity expansion |
| Replication lag | > 60s | Investigate replica performance |

### 5.3 Redis Cluster Expansion

#### Redis Memory Planning

| Data Type | Size per Item | Estimated Items | Total Memory |
|-----------|--------------|-----------------|-------------|
| Sessions | ~1KB | 10,000 active | ~10MB |
| Cache entries | ~5KB | 100,000 | ~500MB |
| Rate limiting | ~100B | 1M keys | ~100MB |
| Job queues | ~2KB | 50,000 | ~100MB |
| WebSocket state | ~500B | 5,000 | ~2.5MB |
| **Total** | | | **~712MB** |

**Recommendation:** Minimum 2GB RAM for production Redis (allows 3x headroom)

#### Cluster Mode Activation

```bash
# Convert standalone Redis to cluster (requires 6 nodes minimum)
redis-cli --cluster create \
    127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
    127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
    --cluster-replicas 1

# Add new node to existing cluster
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000

# Reshard slots to new node
redis-cli --cluster reshard 127.0.0.1:7000 \
    --cluster-from <node-id> \
    --cluster-to <new-node-id> \
    --cluster-slots 1000 \
    --cluster-yes
```

### 5.4 CDN Cache Sizing

#### Bandwidth Estimation

| Content Type | Avg Size | Daily Requests | Daily Transfer |
|--------------|----------|-----------------|----------------|
| HTML pages | 50KB | 100,000 | 5 GB |
| JS bundles | 200KB | 200,000 | 40 GB |
| CSS | 50KB | 200,000 | 10 GB |
| Images | 100KB | 500,000 | 50 GB |
| AR Models (GLB) | 5MB | 10,000 | 50 GB |
| Fonts | 50KB | 50,000 | 2.5 GB |
| **Total** | | | **~158 GB/day** |

**Recommendations:**
- Minimum CDN allowance: 200GB/month buffer
- Peak capacity: 3x average (for flash sales/events)
- AR model caching: Separate tier with longer TTL

#### Cache Rules Configuration

```javascript
// Example CloudFront cache behavior
const cacheBehaviors = {
  // Static assets - aggressive caching
  '/static/*': {
    ttl: 31536000, // 1 year (versioned filenames)
    mustRevalidate: false
  },
  
  // Images - moderate caching
  '/images/*': {
    ttl: 86400, // 1 day
    mustRevalidate: true
  },
  
  // AR models - long caching (rarely change)
  '/ar-models/*': {
    ttl: 604800, // 1 week
    mustRevalidate: true
  },
  
  // API responses - short caching
  '/api/*': {
    ttl: 0, // No caching (dynamic)
    customHeaders: {
      'Cache-Control': 'no-store'
    }
  },
  
  // HTML pages - very short caching
  '/*': {
    ttl: 60, // 1 minute
    mustRevalidate: true
  }
};
```

---

## Appendices

### A. Useful Commands Reference

```bash
# Quick status overview
alias at-status='curl -s https://algeriatrade.dz/api/health | jq'

# View recent errors
alias at-errors='tail -f /var/log/algeriatrade/app.log | grep ERROR'

# Restart application
alias at-restart='docker compose -f docker-compose.production.yml restart app'

# View container resource usage
alias at-stats='docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"'

# Database console
alias at-db='psql $DATABASE_URL'

# Redis console
alias at-redis='redis-cli -u $REDIS_URL'
```

### B. Emergency Contacts Directory

| Role | Name | Phone | Slack | Email |
|------|------|-------|-------|-------|
| Primary On-Call | [TBD] | [TBD] | @oncall-primary | [TBD] |
| Secondary On-Call | [TBD] | [TBD] | @oncall-secondary | [TBD] |
| Engineering Manager | [TBD] | [TBD] | @eng-manager | [TBD] |
| DevOps Lead | [TBD] | [TBD] | @devops-lead | [TBD] |
| Security Lead | [TBD] | [TBD] | @security-lead | [TBD] |
| Product Owner | [TBD] | [TBD] | @product-owner | [TBD] |
| CIB/SATIM Support | Technical Support | +213 XX XXX XXX | N/A | support@cib.dz |
| Stripe Support | Support Portal | N/A | N/A | support@stripe.com |

### C. Related Documentation

- [Phase 8 Deployment Checklist](./PHASE8-DEPLOYMENT-CHECKLIST.md)
- [Phase 8 Rollback Plan](./PHASE8-ROLLBACK-PLAN.md)
- [Security Runbook](./SECURITY-RUNBOOK.md)
- [CI/CD Guide](./CI-CD-GUIDE.md)
- [Payment Webhooks Guide](./PAYMENT-WEBHOOKS.md)
- [Grafana Dashboards](./grafana/phase8-dashboards.json)

---

*This runbook should be reviewed and updated monthly or after any significant infrastructure change.*
