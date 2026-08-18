# AlgeriaTrade.dz Backup & Recovery Plan - Phase 8

**Comprehensive Data Protection and Disaster Recovery**
**Version:** 8.0.0
**Last Updated:** $(date +%Y-%m-%d)
**Classification:** Internal Operations

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Backup Schedule & Retention](#2-backup-schedule--retention)
3. [Phase 8 Tables Backup Verification](#3-phase-8-tables-backup-verification)
4. [Encryption Key Backup Procedure](#4-encryption-key-backup-procedure)
5. [Recovery Objectives (RTO/RPO)](#5-recovery-objectives-rtorpo)
6. [Test Restore Procedures](#6-test-restore-procedures)
7. [Geographic Redundancy Setup](#7-geographic-redundancy-setup)
8. [Disaster Recovery Runbook](#8-disaster-recovery-runbook)
9. [Appendices](#appendices)

---

## 1. Executive Summary

### Purpose

This document defines the backup and recovery strategy for AlgeriaTrade.dz Phase 8, ensuring business continuity and data integrity for all 12 new feature modules.

### Scope of Phase 8 Data Protection

| Feature Module | Critical Data | Sensitivity Level |
|----------------|---------------|-------------------|
| SATIM Payments | Transaction records, signatures | **CRITICAL** - Financial |
| Stripe Payments | Webhook events, charge records | **CRITICAL** - Financial |
| Crypto Transactions | Wallet addresses, tx hashes | **CRITICAL** - Financial |
| DPA Documents | Bank guarantees, legal docs | HIGH - Legal/Financial |
| Invoices | Tax documents, financial records | **CRITICAL** - Compliance |
| Multi-Currency | Exchange rate history | MEDIUM - Operational |
| Negotiation Records | Price discussions, offers | MEDIUM - Business |
| Contracts | Signed agreements, terms | HIGH - Legal |
| CRM Data | Customer interactions, leads | HIGH - PII |
| ERP Sync Logs | Integration audit trail | MEDIUM - Operational |
| WebRTC Metadata | Call records (no media) | LOW - Operational |
| AR Models | 3D assets, metadata | MEDIUM - IP |

### RPO/RTO Targets

| Tier | Data Type | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) |
|------|----------|-------------------------------|-------------------------------|
| **Tier 1** | Payment transactions, user PII | < 1 hour | < 30 minutes |
| **Tier 2** | CRM data, contracts, invoices | < 4 hours | < 2 hours |
| **Tier 3** | ERP logs, analytics, cache | < 24 hours | < 4 hours |
| **Tier 4** | AR models, static assets | < 24 hours | < 8 hours |

---

## 2. Backup Schedule & Retention

### 2.1 Database Backup Schedule

#### PostgreSQL Primary Database (`algeriatrade`)

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| **Full Backup** | Hourly (every hour) | 24 hours | Local SSD + Cloud (same region) |
| **Daily Snapshot** | Daily at 02:00 AM | 30 days | Cloud (cross-region replicated) |
| **Weekly Archive** | Sunday 02:00 AM | 12 weeks | Cold storage (Glacier/S3) |
| **Monthly Archive** | 1st of month | 12 months | Cold storage with compliance lock |

#### Backup Commands

```bash
#!/bin/bash
# scripts/backup-database.sh
# Production database backup script for Phase 8

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="algeriatrade"
DB_USER="algeriatrade"
BACKUP_ROOT="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_TODAY=$(date +%Y%m%d)

# Create backup directories
mkdir -p "$BACKUP_ROOT/hourly/$DATE_TODAY"
mkdir -p "$BACKUP_ROOT/daily"
mkdir -p "$BACKUP_ROOT/weekly"

# Function: Create compressed backup
create_backup() {
    local backup_type="$1"
    local backup_path="$2"
    
    echo "[$(date)] Creating $backup_type backup..."
    
    # Use pg_dump with compression
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --file="$backup_path" \
        --verbose
    
    # Verify backup
    if pg_restore --list "$backup_path" > /dev/null 2>&1; then
        local size=$(du -h "$backup_path" | cut -f1)
        echo "[$(date)] Backup created successfully: $size"
        
        # Create checksum
        sha256sum "$backup_path" > "${backup_path}.sha256"
        
        return 0
    else
        echo "[$(date)] ERROR: Backup verification failed!"
        return 1
    fi
}

# Function: Upload to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    local storage_class="$2" # STANDARD, IA, GLACIER
    
    echo "[$(date)] Uploading to cloud storage ($storage_class)..."
    
    aws s3 cp "$backup_file" \
        "s3://algeriatrade-backups-prod/database/" \
        --storage-class "$storage_class" \
        --encryption AES256 \
        --only-show-errors
    
    # Upload checksum
    aws s3 cp "${backup_file}.sha256" \
        "s3://algeriatrade-backups-prod/database/checksums/" \
        --only-show-errors
    
    echo "[$(date)] Cloud upload complete"
}

# Execute hourly backup
echo "==========================================="
echo "AlgeriaTrade.dz Database Backup - Phase 8"
echo "Timestamp: $TIMESTAMP"
echo "==========================================="

HOURLY_BACKUP="$BACKUP_ROOT/hourly/$DATE_TODAY/${DB_NAME}_${TIMESTAMP}.dump"

if create_backup "hourly" "$HOURLY_BACKUP"; then
    upload_to_cloud "$HOURLY_BACKUP" "STANDARD"
fi

# Daily backup (if running at 02:00)
if [[ $(date +%H) == "02" ]]; then
    DAILY_BACKUP="$BACKUP_ROOT/daily/${DB_NAME}_${DATE_TODAY}.dump"
    
    if create_backup "daily" "$DAILY_BACKUP"; then
        upload_to_cloud "$DAILY_BACKUP" "STANDARD"
        
        # Also replicate to DR region
        aws s3 cp "$DAILY_BACKUP" \
            "s3://algeriatrade-backups-dr/database/" \
            --storage-class STANDARD \
            --region eu-west-1 \
            --only-show-errors
    fi
fi

# Weekly backup (if Sunday)
if [[ $(date +%u) == "7" ]] && [[ $(date +%H) == "02" ]]; then
    WEEKLY_BACKUP="$BACKUP_ROOT/weekly/${DB_NAME}_$(date +%Y%m%d).dump"
    
    if create_backup "weekly" "$WEEKLY_BACKUP"; then
        upload_to_cloud "$WEEKLY_BACKUP" "GLACIER"
    fi
fi

# Cleanup old backups
echo "[$(date)] Cleaning up old backups..."

# Remove hourly backups older than 24 hours
find "$BACKUP_ROOT/hourly" -type f -mtime +1 -delete 2>/dev/null || true

# Remove daily backups older than 30 days
find "$BACKUP_ROOT/daily" -type f -mtime +30 -delete 2>/dev/null || true

echo "[$(date)] Backup process completed successfully"
```

#### Cron Configuration

```cron
# /etc/cron.d/algeriatrade-backups
# Phase 8 Database Backup Schedule

# Hourly backups (every hour at minute 5)
5 * * * * app /opt/scripts/backup-database.sh >> /var/log/backups/hourly.log 2>&1

# Weekly backup verification (Sundays at 03:00)
0 3 * * 0 app /opt/scripts/verify-backup-integrity.sh >> /var/log/backups/verification.log 2>&1

# Monthly archive to cold storage (1st of month at 04:00)
0 4 1 * * app /opt/scripts/archive-monthly-backups.sh >> /var/log/backups/archive.log 2>&1
```

### 2.2 Redis Backup Schedule

| Backup Type | Frequency | Retention | Notes |
|-------------|-----------|-----------|-------|
| RDB Snapshot | Every 15 minutes | 24 hours | Automatic via Redis config |
| AOF Log | Continuous | 48 hours | For point-in-time recovery |
| Export (JSON) | Hourly | 7 days | For specific key recovery |

**Redis Configuration (`redis.conf`):**
```
# Persistence settings
save 900 1      # After 900 sec if >= 1 key changed
save 300 10     # After 300 sec if >= 10 keys changed
save 60 10000   # After 60 sec if >= 10000 keys changed

# RDB settings
dbfilename dump.rdb
dir /var/lib/redis/

# AOF settings
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Backup encryption (Enterprise feature or external tool)
```

### 2.3 Object Storage Backup (AR Models, Files)

| Content Type | Frequency | Retention | Storage Class |
|--------------|-----------|-----------|---------------|
| AR Models (GLB/USDZ) | On upload + daily diff | Forever | S3 Standard + Glacier Deep |
| Invoice PDFs | On generation | 10 years | S3 Standard (compliance) |
| Contract Documents | On creation | 10 years | S3 Standard (legal hold) |
| Product Images | On upload | Forever | CDN + S3 Standard |
| User Uploads | On upload | Account lifetime + 90 days | S3 Standard |

**Cross-Region Replication (CRR) Rules:**
```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {
        "Prefix": "invoices/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::algeriatrade-backups-dr",
        "StorageClass": "STANDARD"
      }
    },
    {
      "Status": "Enabled",
      "Priority": 2,
      "Filter": {
        "Prefix": "ar-models/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::algeriatrade-backups-dr",
        "StorageClass": "STANDARD_IA"
      }
    },
    {
      "Status": "Enabled",
      "Priority": 3,
      "Filter": {
        "Prefix": "contracts/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::algeriatrade-backups-dr",
        "StorageClass": "GLACIER"
      }
    }
  ]
}
```

---

## 3. Phase 8 Tables Backup Verification

### 3.1 New Tables from Phase 8

```sql
-- Phase 8 New Tables Checklist
-- Run this query after each backup to verify table inclusion

SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND tablename IN (
    -- Payment tables
    'payment_providers',
    'payment_attempts',
    'payment_transactions',
    'satim_transactions',
    'stripe_webhook_events',
    
    -- Crypto tables
    'crypto_wallets',
    'crypto_transactions',
    'crypto_addresses',
    
    -- DPA tables
    'dpa_applications',
    'dpa_documents',
    'bank_guarantees',
    
    -- Invoice tables
    'invoices',
    'invoice_items',
    'invoice_payments',
    'tax_calculations',
    
    -- Currency tables
    'currency_rates',
    'currency_conversions',
    
    -- CRM tables
    'crm_pipelines',
    'crm_pipeline_stages',
    'crm_deals',
    'crm_activities',
    'crm_contacts',
    'crm_segments',
    
    -- Contract tables
    'contracts',
    'contract_templates',
    'contract_clauses',
    'contract_signatures',
    
    -- ERP tables
    'erp_integrations',
    'erp_sync_logs',
    'erp_field_mappings',
    
    -- AR tables
    'ar_models',
    'ar_model_variants',
    'ar_view_logs'
)
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3.2 Row Count Verification Script

```bash
#!/bin/bash
# scripts/verify-phase8-tables.sh
# Verify Phase 8 tables have expected data after backup restore

DB_URL="${DATABASE_URL}"

echo "=== Phase 8 Tables Row Count Verification ==="
echo "Timestamp: $(date)"
echo ""

psql "$DB_URL" -c "
SELECT 
    'payment_providers' as table_name, COUNT(*) as rows FROM payment_providers
UNION ALL SELECT 'payment_attempts', COUNT(*) FROM payment_attempts
UNION ALL SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
UNION ALL SELECT 'crypto_transactions', COUNT(*) FROM crypto_transactions
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'crm_deals', COUNT(*) FROM crm_deals
UNION ALL SELECT 'crm_contacts', COUNT(*) FROM crm_contacts
UNION ALL SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL SELECT 'erp_integrations', COUNT(*) FROM erp_integrations
UNION ALL SELECT 'erp_sync_logs', COUNT(*) FROM erp_sync_logs
UNION ALL SELECT 'ar_models', COUNT(*) FROM ar_models
UNION ALL SELECT 'currency_rates', COUNT(*) FROM currency_rates
ORDER BY table_name;
"

echo ""
echo "=== Critical Financial Data Integrity Checks ==="

# Check payment totals match
psql "$DB_URL" -c "
SELECT 
    'Payment transactions total amount' as check_name,
    SUM(amount)::money as value
FROM payment_transactions
WHERE status = 'completed';

SELECT 
    'Invoice total amounts' as check_name,
    SUM(total_amount)::money as value
FROM invoices
WHERE status NOT IN ('draft', 'cancelled');

SELECT 
    'Crypto pending settlement' as check_name,
    SUM(amount)::money as value
FROM crypto_transactions
WHERE status = 'pending_confirmation';
"

echo ""
echo "=== Recent Data Presence Checks ==="

# Ensure we have recent data (last 24 hours)
psql "$DB_URL" -c "
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS: Recent payments exist'
        ELSE 'FAIL: No payments in last 24 hours'
    END as payment_check
FROM payment_transactions
WHERE created_at > NOW() - INTERVAL '24 hours';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS: Recent ERP syncs exist'
        ELSE 'FAIL: No ERP syncs in last 24 hours'
    END as erp_sync_check
FROM erp_sync_logs
WHERE synced_at > NOW() - INTERVAL '24 hours';
"
```

### 3.3 Data Consistency Cross-Checks

```sql
-- Financial consistency checks
-- These should return 0 rows if data is consistent

-- 1. Orphaned invoice items (items without valid invoice)
SELECT 'Orphaned invoice items' as issue, COUNT(*)
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE i.id IS NULL;

-- 2. Payment transactions without matching order
SELECT 'Payments without orders' as issue, COUNT(*)
FROM payment_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
WHERE o.id IS NULL AND pt.order_id IS NOT NULL;

-- 3. CRM deals without valid pipeline/stage
SELECT 'Deals with invalid pipeline stage' as issue, COUNT(*)
FROM crm_deals d
LEFT JOIN crm_pipeline_stages ps ON d.stage_id = ps.id
WHERE ps.id IS NULL;

-- 4. Crypto transactions with invalid wallet references
SELECT 'Crypto TX with invalid wallet' as issue, COUNT(*)
FROM crypto_transactions ct
LEFT JOIN crypto_wallets w ON ct.wallet_id = w.id
WHERE w.id IS NULL AND ct.wallet_id IS NOT NULL;

-- 5. ERP sync logs with invalid integration reference
SELECT 'ERP sync log with invalid integration' as issue, COUNT(*)
FROM erp_sync_log sl
LEFT JOIN erp_integrations ei ON sl.integration_id = ei.id
WHERE ei.id IS NULL;

-- 6. Contracts missing required signatures
SELECT 'Contracts missing signatures' as issue, COUNT(*)
FROM contracts c
WHERE status = 'active' AND (
    SELECT COUNT(*) FROM contract_signatures cs WHERE cs.contract_id = c.id
) = 0;

-- 7. Currency rates gaps (more than 6 hours between updates)
SELECT 'Currency rate gaps detected' as issue, COUNT(*)
FROM (
    SELECT 
        from_currency,
        to_currency,
        effective_date - LAG(effective_date) OVER (
            PARTITION BY from_currency, to_currency ORDER BY effective_date
        ) as gap
    FROM currency_rates
) sub
WHERE gap > INTERVAL '6 hours';
```

---

## 4. Encryption Key Backup Procedure

### 4.1 Key Inventory

| Key Name | Purpose | Type | Rotation Policy |
|----------|---------|------|-----------------|
| `DATABASE_ENCRYPTION_KEY` | Field-level encryption | AES-256-GCM | Never (migrate if compromised) |
| `SESSION_SECRET` | Cookie signing | HMAC-SHA256 | Annual |
| `NEXTAUTH_SECRET` | JWT signing | Random bytes | On compromise |
| `SATIM_HMAC_KEY` | Request signing | HMAC-SHA256 | 90 days |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Provided by Stripe | Auto by Stripe |
| `CRYPTO_WALLET_HOT_KEY` | Hot wallet access | ECDSA secp256k1 | 30 days |
| `TURN_SHARED_SECRET` | TURN server auth | Random string | 90 days |
| `ERP_CREDENTIAL_KEY` | ERP password encryption | AES-256-GCM | Never |

### 4.2 Key Backup Procedure (Shamir's Secret Sharing)

For critical keys that must survive total infrastructure loss:

```bash
#!/bin/bash
# scripts/backup-encryption-keys.sh
# Secure backup of master encryption keys using Shamir's Secret Sharing

set -euo pipefail

KEY_FILE="/secure/keys/master.key"
OUTPUT_DIR="/secure/key-backups/$(date +%Y%m%d)"
SHARES_REQUIRED=3
SHARES_TOTAL=5

# Create output directory
mkdir -p "$OUTPUT_DIR"
chmod 700 "$OUTPUT_DIR"

echo "Starting secure key backup procedure..."
echo "Timestamp: $(date)"

# Generate shares using ssss (Shamir's Secret Sharing Scheme)
ssss-split -t $SHARES_REQUIRED -n $SHARES_TOTAL -Q < "$KEY_FILE"

# Rename shares appropriately
mv "share_1" "$OUTPUT_DIR/share_director.enc"
mv "share_2" "$OUTPUT_DIR/share_cto.enc"
mv "share_3" "$OUTPUT_DIR/share_ciso.enc"
mv "share_4" "$OUTPUT_DIR/share_legal.enc"
mv "share_5" "$OUTPUT_DIR/share_bank.enc"

# Encrypt each share with individual recipient's public key
for share in "$OUTPUT_DIR"/*.enc; do
    recipient=$(basename "$share" .enc | sed 's/share_//')
    
    # Using GPG encryption with recipient's public key
    gpg --batch --yes \
        --trust-model always \
        -e -r "$recipient@algeriatrade.dz" \
        -o "${share}.gpg" \
        "$share"
    
    # Remove unencrypted version
    rm "$share"
done

# Create manifest (without sensitive data)
cat > "$OUTPUT_DIR/MANIFEST.txt" << EOF
Key Backup Manifest
==================
Date: $(date)
Backup ID: $(uuidgen)
Scheme: Shamir's Secret Sharing (3-of-5)
Shares Required: $SHARES_REQUIRED
Total Shares: $SHARES_TOTAL

Share Holders:
1. Director (share_director.enc.gpg)
2. CTO (share_cto.enc.gpg)
3. CISO (share_ciso.enc.gpg)
4. Legal Counsel (share_legal.enc.gpg)
5. Banking Partner (share_bank.enc.gpg)

To Recover:
1. Collect any 3 of 5 encrypted shares
2. Decrypt each share with holder's private key
3. Combine using: ssss-combine -t 3 share1 share2 share3
4. Result is the master key

IMPORTANT: This backup contains critical encryption material.
Store physical copies in separate secure locations.
EOF

# Print summary
echo ""
echo "Key backup completed successfully!"
echo "Location: $OUTPUT_DIR"
echo "Shares created: $SHARES_TOTAL (need $SHARES_REQUIRED to recover)"
echo ""
echo "Next steps:"
echo "1. Distribute each .gpg file to respective holder"
echo "2. Document distribution in security log"
echo "3. Store this manifest securely"
echo "4. Destroy any intermediate files"
```

### 4.3 Hardware Security Module (HSM) Backup

If using HSM for production:

```bash
# HSM backup commands (Thales Luna example)

# List all keys in HSM
cmu list

# Backup HSM partition (requires HSM admin credentials)
hsm partition backup -partition algeriatrade-prod -backupFile /secure/hsm-backup-$(date +%Y%m%d).backup

# Verify backup integrity
hsm partition verify -backupFile /secure/hsm-backup-$(date +%Y%m%d).backup

# Store backup in offline secure location
# NEVER store HSM backup on same network as active HSM
```

---

## 5. Recovery Objectives (RTO/RPO)

### 5.1 Recovery Matrix by Scenario

| Scenario | Impact | RPO Target | RTO Target | Recovery Method |
|----------|--------|------------|------------|-----------------|
| Single table corruption | Low | 1 hour | 30 min | Point-in-time recovery (PITR) |
| Database server failure | Medium | 1 hour | 15 min | Failover to replica |
| Full data center outage | High | 1 hour | 2 hours | DR site activation |
| Ransomware attack | Critical | Pre-attack | 4+ hours | Clean restore from backup |
| Accidental data deletion | Medium | Minutes | 30 min | PITR or logical restore |
| Encryption key loss | Critical | N/A | Days | Key reconstruction ceremony |

### 5.2 Service Priority for Recovery

```
Priority 1 (Immediate - First 30 minutes):
├── User authentication service
├── Payment processing (SATIM callbacks)
├── Core API endpoints (health, basic CRUD)
└── SSL/TLS certificates

Priority 2 (Within 2 hours):
├── Search functionality
├── Product catalog
├── Order management
├── Invoice generation queue
└── Email notification system

Priority 3 (Within 4 hours):
├── CRM pipeline
├── Analytics dashboards
├── ERP synchronization
├── AR model serving
└── Video calling (WebRTC)

Priority 4 (Within 8 hours):
├── Historical reports
├── Audit log access
├── Development/test environments
└── Non-critical integrations
```

---

## 6. Test Restore Procedures

### 6.1 Automated Restore Test (Weekly)

```bash
#!/bin/scripts/test-restore.sh
# Weekly automated restore test script

set -euo pipefail

TEST_DB="restore_test_$(date +%Y%m%d)"
SOURCE_BACKUP=$(ls -t /backups/postgresql/daily/*.dump 2>/dev/null | head -1)
LOG_FILE="/var/log/backups/restore-test-$(date +%Y%m%d).log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "==========================================="
echo "Automated Restore Test"
echo "Timestamp: $(date)"
echo "Source Backup: $SOURCE_BACKUP"
echo "Target Database: $TEST_DB"
echo "==========================================="

# Step 1: Create test database
echo "[1/5] Creating test database..."
createdb "$TEST_DB"

# Step 2: Perform restore
echo "[2/5] Restoring from backup..."
time pg_restore \
    --dbname="$TEST_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --verbose \
    "$SOURCE_BACKUP"

# Step 3: Verify row counts
echo "[3/5] Verifying row counts..."

RESULT=$(psql -d "$TEST_DB" -t -A -c "
SELECT 
    CASE 
        WHEN COUNT(*) > 100 THEN 'PASS'
        ELSE 'FAIL'
    END as users_check
FROM users
UNION ALL
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as products_check
FROM products
UNION ALL  
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as payments_check
FROM payment_transactions;
")

PASS_COUNT=$(echo "$RESULT" | grep -c "PASS" || true)
FAIL_COUNT=$(echo "$RESULT" | grep -c "FAIL" || true)

echo "Results: $PASS_COUNT passed, $FAIL_COUNT failed"

# Step 4: Run data consistency checks
echo "[4/5] Running consistency checks..."
psql -d "$TEST_DB" -f /opt/scripts/data-consistency-checks.sql

# Step 5: Cleanup
echo "[5/5] Cleaning up test database..."
dropdb "$TEST_DB"

# Report
echo ""
echo "==========================================="
echo "Restore Test Complete"
echo "Result: $([ $FAIL_COUNT -eq 0 ] && echo 'SUCCESS' || echo 'FAILURE')"
echo "Duration: See timing above"
echo "==========================================="

# Send notification
if [ $FAIL_COUNT -eq 0 ]; then
    send-notification "success" "Weekly restore test passed"
else
    send-notification "failure" "Weekly restore test FAILED - $FAIL_COUNT checks failed"
fi
```

### 6.2 Manual Full Restore Procedure

```bash
#!/bin/bash
# scripts/emergency-restore.sh
# Emergency full database restoration

set -euo pipefail

# Configuration
RESTORE_TARGET="${1:-algeriatrade}"
BACKUP_TO_RESTORE="${2:-}"  # Leave empty for latest
MAINTENANCE_MODE=true

echo "╔══════════════════════════════════════════════╗"
echo "║     EMERGENCY DATABASE RESTORATION           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Pre-flight checks
echo "[PRE-FLIGHT] Running safety checks..."

# Confirm we're not in production unless forced
if [[ "$RESTORE_TARGET" == "algeriatrade" && "${FORCE:-}" != "true" ]]; then
    echo "WARNING: About to restore PRODUCTION database!"
    read -rp "Type 'PRODUCTION-RESTORE' to confirm: " confirmation
    if [[ "$confirmation" != "PRODUCTION-RESTORE" ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Find backup to use
if [[ -z "$BACKUP_TO_RESTORE" ]]; then
    BACKUP_TO_RESTORE=$(ls -t /backups/postgresql/daily/*.dump 2>/dev/null | head -1)
    echo "Using latest backup: $BACKUP_TO_RESTORE"
else
    echo "Using specified backup: $BACKUP_TO_RESTORE"
fi

# Verify backup exists and is readable
if [[ ! -f "$BACKUP_TO_RESTORE" ]]; then
    echo "ERROR: Backup file not found: $BACKUP_TO_RESTORE"
    exit 1
fi

# Verify backup integrity
echo "[VERIFY] Checking backup integrity..."
if ! pg_restore --list "$BACKUP_TO_RESTORE" > /dev/null 2>&1; then
    echo "ERROR: Backup file is corrupted!"
    exit 1
fi
echo "Backup integrity verified."

# Stop application connections
echo "[STOP] Stopping application..."
# Option 1: Put application in maintenance mode
curl -X POST http://localhost:3000/api/admin/maintenance -H "Authorization: Bearer $ADMIN_TOKEN"

# Option 2: Block new connections to database
psql -d postgres -c "ALTER DATABASE $RESTORE_TARGET ALLOW_CONNECTIONS false;"

# Wait for active transactions to complete
echo "[WAIT] Waiting for active transactions (max 60 seconds)..."
sleep 10
# Force terminate remaining connections if needed
psql -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$RESTORE_TARGET' 
AND pid != pg_backend_pid();
"

# Perform restore
echo "[RESTORE] Restoring database from backup..."
time pg_restore \
    --dbname="$RESTORE_TARGET" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --jobs=4 \
    --verbose \
    "$BACKUP_TO_RESTORE"

# Post-restore operations
echo "[POST-RESTORE] Running post-restore operations..."

# Recreate indexes that may have been dropped
psql -d "$RESTORE_TARGET" -f /opt/sql/post-restore-indexes.sql

# Update statistics
psql -d "$RESTORE_TARGET" -c "ANALYZE;"

# Restart connections
echo "[RESTART] Allowing database connections..."
psql -d postgres -c "ALTER DATABASE $RESTORE_TARGET ALLOW_CONNECTIONS true;"

# Take application out of maintenance mode
curl -X DELETE http://localhost:3000/api/admin/maintenance -H "Authorization: Bearer $ADMIN_TOKEN"

# Verification
echo "[VERIFY] Verifying restored database..."
psql -d "$RESTORE_TARGET" -c "
SELECT 
    'Users:' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products:', COUNT(*) FROM products
UNION ALL
SELECT 'Orders:', COUNT(*) FROM orders
UNION ALL
SELECT 'Payment TXNs:', COUNT(*) FROM payment_transactions;
"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     RESTORATION COMPLETE                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Monitor application logs for errors"
echo "2. Verify critical functionality (payments, auth)"
echo "3. Notify stakeholders of completion"
echo "4. Document incident and lessons learned"
```

### 6.3 Point-in-Time Recovery (PITR)

For recovering to a specific moment (e.g., before accidental deletion):

```sql
-- Connect to PostgreSQL and perform PITR

-- 1. Identify target time
-- Example: Recover to time before accidental deletion
SELECT NOW(); -- Note current time
-- Target: '2024-01-15 14:32:00+00' (before the mistake)

-- 2. Stop the database (or use replica)
-- systemctl stop postgresql

-- 3. Restore from base backup
pg_restore --clean --if-exists -d algeriatrade /backups/base/latest.dump

-- 4. Configure recovery target
-- Add to postgresql.conf or recovery.conf:
-- recovery_target_time = '2024-01-15 14:31:00+00'
-- recovery_target_action = 'promote'

-- 5. Start PostgreSQL in recovery mode
-- pg_ctl start -D /var/lib/postgresql/data

-- 6. Monitor recovery progress
-- Check logs: tail -f /var/log/postgresql/postgresql-*.log

-- 7. Once recovery completes, verify
SELECT COUNT(*) FROM deleted_table; -- Should show pre-deletion count

-- 8. Promote to primary (if needed)
-- pg_ctl promote -D /var/lib/postgresql/data
```

---

## 7. Geographic Redundancy Setup

### 7.1 Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │          Primary Region             │
                    │         (EU-Central / Frankfurt)     │
                    │                                     │
│  Users (Algeria) │  ┌─────────┐  ┌─────────┐          │
       │            │  │  App    │  │  App    │          │
       ▼            │  │ Server 1│  │ Server 2│          │
┌──────────────┐    │  └────┬────┘  └────┬────┘          │
│  CDN/Edge    │    │       └──────┬─────┘                │
│  (Cloudflare) │    │            ▼                       │
└──────────────┘    │     ┌──────────────┐               │
                    │     │  PostgreSQL  │◄─── Primary    │
                    │     │   (Master)   │                 │
                    │     └──────┬───────┘                 │
                    │            │ Replication            │
                    └────────────┼────────────────────────┘
                                 │ Async (Streaming)
                                 ▼
                    ┌─────────────────────────────────────┐
                    │           DR Region                  │
                    │      (EU-West / Ireland)              │
                    │                                     │
                    │     ┌──────────────┐                │
                    │     │  PostgreSQL  │◄─── Standby     │
                    │     │  (Replica)   │                 │
                    │     └──────┬───────┘                 │
                    │            │                         │
                    │     ┌──────┴───────┐                 │
                    │     │  Warm Standby │                │
                    │     │  App Servers │                │
                    │     └──────────────┘                 │
                    └─────────────────────────────────────┘
```

### 7.2 PostgreSQL Streaming Replication Setup

**Primary Configuration (`postgresql.conf`):**
```
# WAL Settings for replication
wal_level = replica
max_wal_senders = 3
wal_keep_size = 4GB
max_replication_slots = 3

# Archive for PITR
archive_mode = on
archive_command = 'gzip -c %p > /backups/wal/%f.gz'

# Logging replication
log_replication_commands = on
```

**Replica Configuration:**
```bash
# On DR server, initialize replica from primary backup
pg_basebackup \
    -h primary.algeriatrade.internal \
    -U replicator \
    -D /var/lib/postgresql/data \
    -Fp \
    -Xs \
    -P \
    -R

# Start replica (will be in recovery mode)
pg_ctl start -D /var/lib/postgresql/data
```

### 7.3 DNS Failover Configuration

**Route53 Health Checks + DNS Failover:**

```json
{
  "HealthCheckConfig": {
    "IPAddress": "app-primary.algeriatrade.internal",
    "Port": 3000,
    "Type": "HTTPS",
    "ResourcePath": "/api/health",
    "FailureThreshold": 3
  },
  "DNSFailover": {
    "Type": "A",
    "SetIdentifier": "primary",
    "AliasTarget": {
      "DNSName": "lb-primary.algeriatrade.internal.",
      "EvaluateTargetHealth": true
    },
    "Failover": "PRIMARY"
  },
  "DRRecord": {
    "Type": "A", 
    "SetIdentifier": "dr-failover",
    "AliasTarget": {
      "DNSName": "lb-dr.algeriatrade.internal.",
      "EvaluateTargetHealth": true
    },
    "Failover": "SECONDARY"
  }
}
```

### 7.4 Failover Decision Matrix

| Condition | Action | Automation Level |
|-----------|--------|------------------|
| Primary DB unreachable > 30 sec | Route read traffic to replica | Automatic (DNS) |
| Primary DB unreachable > 5 min | Promote DR replica to primary | Semi-auto (approval) |
| Primary region network down > 10 min | Full failover to DR region | Manual (executive) |
| Primary restored | Switch back to primary (planned) | Manual (maintenance window) |

---

## 8. Disaster Recovery Runbook

### 8.1 DR Activation Checklist

**Trigger:** Major incident requiring DR activation

```
DR ACTIVATION CHECKLIST
═══════════════════════

INITIAL ASSESSMENT (0-5 minutes)
□ Incident confirmed affecting primary region
□ Estimated duration > 30 minutes
□ Business impact assessed
□ Decision made to activate DR

COMMUNICATION (5-10 minutes)
□ Executive team notified
□ Customer support briefed (template message ready)
□ Status page updated
□ Internal Slack announcement posted

TECHNICAL FAILOVER (10-30 minutes)
□ DNS health checks verified failing
□ DR database promoted (if needed)
□ Application servers started in DR
□ SSL certificates valid in DR
□ CDN origin updated to DR
□ Cache warming initiated

VERIFICATION (30-45 minutes)
□ Health endpoint responding
□ Authentication working
□ Payment providers connected (read-only mode initially)
□ Database queries returning correct data
□ Email notifications functional

MONITORING (45-60 minutes)
□ Dashboards showing DR traffic
□ Error rates within normal
□ Performance acceptable
□ Alerts configured for DR environment

POST-ACTIVATION
□ Primary region issue documented
□ RTO achieved: _____ minutes
□ Data loss assessment: _____ (RPO target met?)
□ Return plan established
```

### 8.2 Return to Primary Procedure

After primary region is restored:

```bash
#!/bin/bash
# scripts/dr-return-to-primary.sh
# Controlled failback to primary region

set -euo pipefail

echo "Starting controlled failback to primary..."

# 1. Verify primary is healthy
echo "[1/5] Verifying primary region health..."
curl -sf https://primary.algeriatrade.internal/api/health | jq '.status'
# Expected: "ok"

# 2. Sync data from DR back to primary
echo "[2/5] Syncing differential data..."
# This depends on how much time passed and what was written to DR
pg_dump dr-algeriatrade | psql primary-algeriatrade
# OR use logical replication to catch up

# 3. Validate data consistency
echo "[3/5] Validating data consistency..."
/opt/scripts/verify-data-consistency-between-regions.sh

# 4. Switch DNS back (gradual)
echo "[4/5] Updating DNS (canary deployment)..."
# Option A: 10% -> 25% -> 50% -> 100% over 1 hour
# Option B: Instant switch if DR must go down immediately

# 5. Monitor post-switch
echo "[5/5] Monitoring after switch..."
# Watch error rates, latency, payment success rates

echo "Failback complete!"
```

---

## Appendices

### A. Backup Contact Information

| Role | Name | Phone | Availability |
|------|------|-------|--------------|
| DBA Primary | | | 24/7 |
| DBA Backup | | | 24/7 |
| DevOps Lead | | | Business hours + on-call |
| CISO (key recovery) | | | Emergency only |
| AWS Support (Enterprise) | | | 24/7 (15 min response) |

### B. Backup Locations Summary

| Location | Type | Contents | Access Control |
|----------|------|----------|----------------|
| `/backups/postgresql/local` | Local SSD | Last 24 hours | App servers only |
| `s3://algeriatrade-backups-prod` | S3 Primary | 30 days | IAM role restricted |
| `s3://algeriatrade-backups-dr` | S3 DR | 30 days | DR role only |
| `s3://algeriatrade-archive` | Glacier | 12 months | Compliance team |
| Physical Safe | Paper/USB | Key shares | Directors only |
| HSM Backup | Encrypted device | Master keys | CISO only |

### C. Recovery Testing Schedule

| Test Type | Frequency | Duration | Owner |
|-----------|-----------|----------|-------|
| Automated restore test | Weekly | ~30 min | DBA Team |
| Table-level recovery | Monthly | ~1 hour | DBA Team |
| Full DR drill | Quarterly | ~4 hours | DevOps + DBA |
| Key recovery ceremony | Annually | ~2 hours | CISO + Executives |
| Ransomware simulation | Annually | ~8 hours | Security + Ops |

### D. Command Quick Reference

```bash
# Quick backup commands
/opt/scripts/backup-database.sh              # Immediate backup
/opt/scripts/backup-encryption-keys.sh       # Key backup
aws s3 sync /backups s3://algeriatrade-backups  # Push to cloud

# Quick restore commands
/opt/scripts/emergency-restore.sh             # Full restore
/opt/scripts/test-restore.sh                  # Test restore
pg_restore --list backup.dump | grep TABLE    # List tables in backup

# Monitoring commands
psql -c "SELECT * FROM pg_stat_replication;"  # Replication status
du -sh /backups/*                             # Backup sizes
aws s3 ls s3://algeriatrade-backups/           # Cloud backup listing
```

---

*This document should be reviewed quarterly and after any significant infrastructure changes.*
*All recovery procedures should be tested at least quarterly.*
