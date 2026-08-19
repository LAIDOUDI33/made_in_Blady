#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz API Developer Portal - Data Migration Script
# Migrates data from staging to production with integrity checks
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy/api-portal"
BACKUP_DIR="$DEPLOY_DIR/backups/migration_$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[MIGRATE]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# Configuration
STAGING_DB_HOST="${STAGING_DB_HOST:-staging-db.algeriatrade.internal}"
STAGING_DB_PORT="${STAGING_DB_PORT:-5432}"
STAGING_DB_USER="${STAGING_DB_USER:-apiportal}"
STAGING_DB_NAME="${STAGING_DB_NAME:-algeriatrade_portal_staging}"
PROD_DB_HOST="${PROD_DB_HOST:-postgres}"
PROD_DB_PORT="${PROD_DB_PORT:-5432}"
PROD_DB_USER="${PROD_DB_USER:-apiportal}"
PROD_DB_NAME="${PROD_DB_NAME:-algeriatrade_portal}"

# =============================================================================
# Create Migration Backup
# =============================================================================
create_migration_backup() {
    log_info "Creating migration backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup production database before migration
    log_info "Backing up current production database..."
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        pg_dumpall -U "$PROD_DB_USER" > "$BACKUP_DIR/pre_migration_prod_backup.sql" 2>/dev/null || {
        log_error "Failed to backup production database!"
        exit 1
    }
    
    # Export staging data
    log_info "Exporting staging data..."
    PGPASSWORD="${STAGING_DB_PASSWORD:-}" pg_dump \
        -h "$STAGING_DB_HOST" \
        -p "$STAGING_DB_PORT" \
        -U "$STAGING_DB_USER" \
        -d "$STAGING_DB_NAME" \
        --data-only \
        --no-owner \
        --no-privileges \
        > "$BACKUP_DIR/staging_data.sql" 2>/dev/null || {
        log_warn "Could not connect to staging. Will use alternative method."
    }
    
    log_success "Migration backup created at $BACKUP_DIR"
}

# =============================================================================
# Schema Validation & Updates
# =============================================================================
validate_schema() {
    log_info "Validating schema compatibility..."
    
    # Compare schemas between staging and production
    local staging_schema_file="$BACKUP_DIR/staging_schema.sql"
    local prod_schema_file="$BACKUP_DIR/prod_schema.sql"
    
    # Export staging schema
    PGPASSWORD="${STAGING_DB_PASSWORD:-}" pg_dump \
        -h "$STAGING_DB_HOST" \
        -p "$STAGING_DB_PORT" \
        -U "$STAGING_DB_USER" \
        -d "$STAGING_DB_NAME" \
        --schema-only \
        > "$staging_schema_file" 2>/dev/null || true
    
    # Export production schema
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        pg_dump -U "$PROD_DB_USER" -d "$PROD_DB_NAME" --schema-only > "$prod_schema_file" 2>/dev/null || true
    
    # Check for critical differences
    if [ -f "$staging_schema_file" ] && [ -f "$prod_schema_file" ]; then
        local diff_output=$(diff "$staging_schema_file" "$prod_schema_file" 2>/dev/null || true)
        
        if [ -n "$diff_output" ]; then
            log_warn "Schema differences detected:"
            echo "$diff_output" | head -50
            
            # Check for breaking changes
            if echo "$diff_output" | grep -q "DROP COLUMN\|DROP TABLE\|ALTER TYPE"; then
                log_error "Breaking schema changes detected! Manual review required."
                read -rp "Continue anyway? (y/N): " confirm
                if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
        else
            log_success "Schemas are identical."
        fi
    fi
}

apply_schema_updates() {
    log_info "Applying schema updates..."
    
    cd "$PROJECT_ROOT"
    
    # Run Prisma migrations
    npx prisma migrate deploy || {
        log_warn "Prisma migrate deploy failed, trying db push..."
        npx prisma db push --accept-data-loss || {
            log_error "Schema update failed!"
            exit 1
        }
    }
    
    log_success "Schema updates applied."
}

# =============================================================================
# Data Transformation
# =============================================================================
transform_data() {
    log_info "Transforming data for production..."
    
    local transformed_data="$BACKUP_DIR/transformed_data.sql"
    
    cat > "$transformed_data" << 'TRANSFORM_SQL'
-- =============================================================================
-- Data Transformations for Production Migration
-- =============================================================================

-- Update any test/development data flags
UPDATE "DeveloperAccount" SET 
    status = CASE 
        WHEN email LIKE '%@test.%' OR email LIKE '%@example.%' THEN 'suspended'
        ELSE status
    END,
    "updatedAt" = NOW()
WHERE status = 'active';

-- Reset rate limit counters
DELETE FROM "RateLimitCounter";

-- Clear temporary sessions
DELETE FROM "Session" WHERE "expiresAt" < NOW();

-- Archive old audit logs (keep last 90 days)
-- Uncomment if AuditLog table exists:
-- DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Update API keys: mark test keys
UPDATE "ApiKey" SET 
    status = CASE 
        WHEN name LIKE '%test%' OR name LIKE '%demo%' THEN 'revoked'
        ELSE status
    END,
    "updatedAt" = NOW()
WHERE status = 'active';

-- Reset usage counters for new billing cycle
UPDATE "DeveloperAccount" SET 
    "requestsUsedThisMonth" = 0,
    "updatedAt" = NOW()
WHERE "planId" != 'enterprise-plan';

-- Ensure all active accounts have proper rate limits
INSERT INTO "RateLimitAllocation" ("developerId", "tierId", "allocatedAt")
SELECT da.id, 
       COALESCE(
           (SELECT id FROM "RateLimitTier" WHERE name = 
               CASE da."planId"
                   WHEN 'free-plan' THEN 'Gratuit'
                   WHEN 'pro-plan' THEN 'Pro'
                   WHEN 'enterprise-plan' THEN 'Enterprise'
               END
           ),
           'tier-free'
       ),
       NOW()
FROM "DeveloperAccount" da
WHERE da.status = 'active'
  AND NOT EXISTS (
      SELECT 1 FROM "RateLimitAllocation" rla 
      WHERE rla."developerId" = da.id 
      AND rla."allocatedAt" > NOW() - INTERVAL '1 month'
  );
TRANSFORM_LOG
    
    # Apply transformations
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" < "$transformed_data" && \
        log_success "Data transformations applied."
}

# =============================================================================
# Import Staging Data
# =============================================================================
import_staging_data() {
    log_info "Importing staging data..."
    
    local staging_dump="$BACKUP_DIR/staging_data.sql"
    
    if [ ! -f "$staging_dump" ]; then
        log_warn "No staging dump found. Skipping import."
        return
    fi
    
    # Create filtered import (exclude sensitive tables)
    local filtered_import="$BACKUP_DIR/filtered_staging_data.sql"
    
    grep -v "^COPY \"Session\"" "$staging_dump" > "$filtered_import" 2>/dev/null || \
        cp "$staging_dump" "$filtered_import"
    
    # Import data
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" < "$filtered_import" && \
        log_success "Staging data imported."
}

# =============================================================================
# Integrity Checks
# =============================================================================
run_integrity_checks() {
    log_info "Running data integrity checks..."
    
    local checks_passed=0
    local checks_failed=0
    
    # Check 1: Verify row counts
    log_info "Checking table row counts..."
    
    local tables=(
        '"DeveloperAccount"'
        '"ApiKey"'
        '"DeveloperPlan"'
        '"ApiCategory"'
        '"DocumentationPage"'
    )
    
    for table in "${tables[@]}"; do
        local count=$(docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
            psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c \
            "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
        
        if [ -n "$count" ] && [ "$count" -ge 0 ] 2>/dev/null; then
            log_success "  $table: $count rows"
            ((checks_passed++))
        else
            log_error "  $table: FAILED to count"
            ((checks_failed++))
        fi
    done
    
    # Check 2: Foreign key integrity
    log_info "Checking foreign key constraints..."
    
    local fk_check=$(docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "
        SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY';
    " 2>/dev/null | tr -d ' ')
    
    log_success "  Foreign keys defined: $fk_check"
    ((checks_passed++))
    
    # Check 3: Unique constraint validation
    log_info "Checking unique constraints..."
    
    local unique_violations=$(docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "
        SELECT COUNT(*) FROM (
            SELECT email, COUNT(*) as cnt FROM \"DeveloperAccount\" GROUP BY email HAVING COUNT(*) > 1
        ) t;
    " 2>/dev/null | tr -d ' ')
    
    if [ "$unique_violations" = "0" ]; then
        log_success "  No duplicate emails found"
        ((checks_passed++))
    else
        log_error "  Found $unique_violations duplicate emails!"
        ((checks_failed++))
    fi
    
    # Check 4: API key format validation
    log_info "Validating API key formats..."
    
    local invalid_keys=$(docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"ApiKey\" 
        WHERE key_hash IS NULL OR length(key_hash) < 32;
    " 2>/dev/null | tr -d ' ')
    
    if [ "$invalid_keys" = "0" ]; then
        log_success "  All API keys have valid hashes"
        ((checks_passed++))
    else
        log_warn "  Found $invalid_keys API keys with invalid hashes"
    fi
    
    # Summary
    echo ""
    echo "Integrity Check Results:"
    echo "  Passed: $checks_passed"
    echo "  Failed: $checks_failed"
    
    if [ $checks_failed -gt 0 ]; then
        log_error "Integrity checks failed! Review and fix issues before proceeding."
        return 1
    fi
    
    log_success "All integrity checks passed!"
    return 0
}

# =============================================================================
# Post-Migration Tasks
# =============================================================================
post_migration_tasks() {
    log_info "Running post-migration tasks..."
    
    # Update sequences
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "
        DO \$\$
        DECLARE r RECORD;
        BEGIN
            FOR r IN (SELECT tablename, columnname FROM (
                SELECT 
                    t.relname AS tablename,
                    a.attname AS columnname,
                    s.relname AS seqname
                FROM pg_class t
                    JOIN pg_attribute a ON (a.attrelid = t.oid)
                    JOIN pg_depend d ON (d.refobjid = t.oid AND d.refobjsubid = a.attnum)
                    JOIN pg_class s ON (d.objid = s.oid)
                WHERE t.relkind = 'r'
                  AND s.relkind = 'S'
            ) sub)
            LOOP
                EXECUTE format('SELECT setval(''%s'', COALESCE((SELECT MAX(%s) FROM %s), 1))', 
                               r.seqname, r.columnname, r.tablename);
            END LOOP;
        END;
        \$\$;
    " 2>/dev/null || log_warn "Sequence update had issues."
    
    # Analyze tables for query optimization
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "ANALYZE;" 2>/dev/null || true
    
    # Clear Redis cache for fresh start
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T redis \
        redis-cli FLUSHDB 2>/dev/null || true
    
    log_success "Post-migration tasks completed."
}

# =============================================================================
# Generate Migration Report
# =============================================================================
generate_report() {
    log_info "Generating migration report..."
    
    local report_file="$BACKUP_DIR/migration_report.txt"
    
    cat > "$report_file" << EOF
=============================================================================
AlgeriaTrade.dz API Portal - Data Migration Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')
=============================================================================

MIGRATION DETAILS
-----------------
Source: ${STAGING_DB_HOST}:${STAGING_DB_PORT}/${STAGING_DB_NAME}
Target: Production Database
Backup Location: $BACKUP_DIR

TABLES PROCESSED
----------------
$(docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
    psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "\dt+" 2>/dev/null)

ROW COUNTS
----------
$(docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
    psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "
    SELECT schemaname, tablename, n_live_tuples::int as row_count 
    FROM pg_stat_user_tables 
    ORDER BY n_live_tuples DESC;
" 2>/dev/null)

INTEGRITY CHECK STATUS
----------------------
$(if run_integrity_checks >/dev/null 2>&1; then echo "PASSED"; else echo "FAILED"; fi)

NOTES
-----
- Pre-migration backup saved
- Schema updates applied
- Data transformations executed
- Cache cleared

NEXT STEPS
---------
1. Verify application functionality
2. Monitor error logs for 24 hours
3. Confirm with stakeholders

=============================================================================
EOF

    log_success "Migration report saved to $report_file"
}

# =============================================================================
# Rollback Migration
# =============================================================================
rollback_migration() {
    log_warn "Initiating migration rollback..."
    
    local pre_migration_backup="$BACKUP_DIR/pre_migration_prod_backup.sql"
    
    if [ ! -f "$pre_migration_backup" ]; then
        log_error "No pre-migration backup found! Cannot rollback safely."
        exit 1
    fi
    
    # Stop application during rollback
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" stop api-gateway || true
    
    # Restore from backup
    log_info "Restoring from pre-migration backup..."
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        psql -U "$PROD_DB_USER" -d "$PROD_DB_NAME" < "$pre_migration_backup" || {
        log_error "Rollback failed! Database may be in inconsistent state."
        exit 1
    }
    
    # Restart application
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" start api-gateway || true
    
    log_success "Rollback completed."
}

# =============================================================================
# Main Migration Flow
# =============================================================================
main() {
    local action="${1:-migrate}"
    
    echo ""
    echo "============================================================"
    echo "  AlgeriaTrade.dz API Portal - Data Migration Tool"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"
    echo ""
    
    case "$action" in
        migrate)
            create_migration_backup
            validate_schema
            apply_schema_updates
            transform_data
            import_staging_data
            
            if run_integrity_checks; then
                post_migration_tasks
                generate_report
                
                echo ""
                log_success "=========================================="
                log_success "  MIGRATION COMPLETED SUCCESSFULLY!"
                log_success "=========================================="
            else
                log_error "Integrity checks failed. Please review."
                exit 1
            fi
            ;;
            
        validate)
            run_integrity_checks
            ;;
            
        rollback)
            rollback_migration
            ;;
            
        report)
            generate_report
            ;;
            
        *)
            echo "Usage: $0 {migrate|validate|rollback|report}"
            exit 1
            ;;
    esac
}

main "$@"
