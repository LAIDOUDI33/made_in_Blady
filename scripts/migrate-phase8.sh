#!/bin/bash
# =============================================================================
# Phase 8 Database Migration Script
# =============================================================================
# AlgeriaTrade.dz B2B Platform - Production Database Migration
#
# This script handles:
#   1. Pre-migration backup
#   2. Prisma schema generation and migration
#   3. Initial data seeding (TVA rates, currencies, payment providers)
#   4. Index creation for performance optimization
#   5. Post-migration verification
#
# Usage:
#   chmod +x scripts/migrate-phase8.sh
#   ./scripts/migrate-phase8.sh [options]
#
# Options:
#   --skip-backup      Skip database backup (not recommended for production)
#   --dry-run          Show what would be done without executing
#   --seed-only        Only run data seeding (skip migration)
#   --verify-only      Only run verification checks
#   --rollback         Rollback to pre-migration state
#   -v, --verbose      Enable verbose output
#   -h, --help         Show this help message
#
# Environment Variables:
#   DATABASE_URL       PostgreSQL connection string (required)
#   REDIS_URL          Redis connection string (optional, for cache clearing)
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/migration_phase8_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_BACKUP=false
DRY_RUN=false
SEED_ONLY=false
VERIFY_ONLY=false
ROLLBACK=false
VERBOSE=false

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    local level=$1
    shift
    local message=$*
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() {
    log "INFO" "${BLUE}$message${NC}"
    message="$1"
    echo -e "${BLUE}[INFO]${NC} $message"
}

success() {
    log "SUCCESS" "${GREEN}$1${NC}"
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    log "WARN" "${YELLOW}$1${NC}"
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    log "ERROR" "${RED}$1${NC}"
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

die() {
    error "$1"
    exit 1
}

verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

show_help() {
    cat << EOF
Phase 8 Database Migration Script for AlgeriaTrade.dz

Usage: $(basename "$0") [options]

Options:
  --skip-backup      Skip database backup (not recommended for production)
  --dry-run          Show what would be done without executing
  --seed-only        Only run data seeding (skip migration)
  --verify-only      Only run verification checks
  --rollback         Rollback to pre-migration state
  -v, --verbose      Enable verbose output
  -h, --help         Show this help message

Environment Variables:
  DATABASE_URL       PostgreSQL connection string (required)
  REDIS_URL          Redis connection string (optional)

Examples:
  # Full migration with backup
  $(basename "$0")

  # Dry run to see what would happen
  $(basename "$0") --dry-run

  # Skip backup (dangerous in production!)
  $(basename "$0") --skip-backup

  # Rollback failed migration
  $(basename "$0") --rollback
EOF
    exit 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --seed-only)
                SEED_ONLY=true
                shift
                ;;
            --verify-only)
                VERIFY_ONLY=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                die "Unknown option: $1. Use -h for help."
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check DATABASE_URL
    if [ -z "${DATABASE_URL:-}" ]; then
        die "DATABASE_URL environment variable is not set"
    fi
    verbose "DATABASE_URL is configured"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        die "Node.js is not installed"
    fi
    verbose "Node.js version: $(node --version)"
    
    # Check bun
    if ! command -v bun &> /dev/null; then
        warn "bun not found, falling back to npx"
    fi
    
    # Check psql
    if ! command -v psql &> /dev/null; then
        warn "psql not found, some operations may be limited"
    fi
    
    # Check Prisma CLI
    if [ -f "$PROJECT_ROOT/node_modules/.bin/prisma" ]; then
        verbose "Prisma CLI found"
    elif command -v prisma &> /dev/null; then
        verbose "Prisma CLI found globally"
    else
        die "Prisma CLI not found. Run 'bun install' first."
    fi
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    success "Prerequisites check passed"
}

# =============================================================================
# Backup Functions
# =============================================================================

create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        warn "Skipping backup as requested (--skip-backup)"
        return
    fi
    
    info "Creating database backup..."
    
    local backup_file="$BACKUP_DIR/phase8_pre_migration_${TIMESTAMP}.sql"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create backup at: $backup_file"
        return
    fi
    
    # Create backup using pg_dump
    if pg_dump "$DATABASE_URL" > "$backup_file" 2>> "$LOG_FILE"; then
        # Compress backup
        gzip "$backup_file"
        success "Backup created: ${backup_file}.gz"
        
        # Verify backup
        if gzip -t "${backup_file}.gz" 2>/dev/null; then
            verbose "Backup integrity verified"
        else
            error "Backup file is corrupted!"
            exit 1
        fi
    else
        error "Failed to create database backup"
        exit 1
    fi
    
    # Store backup filename for potential rollback
    echo "${backup_file}.gz" > "$BACKUP_DIR/latest_backup.txt"
}

# =============================================================================
# Migration Functions
# =============================================================================

run_prisma_migration() {
    info "Running Prisma migrations..."
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would run Prisma migration"
        return
    fi
    
    # Generate Prisma client
    info "Generating Prisma client..."
    if command -v bun &> /dev/null; then
        bunx prisma generate >> "$LOG_FILE" 2>&1
    else
        npx prisma generate >> "$LOG_FILE" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        success "Prisma client generated"
    else
        error "Failed to generate Prisma client"
        exit 1
    fi
    
    # Run pending migrations
    info "Deploying pending migrations..."
    if command -v bun &> /dev/null; then
        bunx prisma migrate deploy --name "phase8-production-${TIMESTAMP}" >> "$LOG_FILE" 2>&1
    else
        npx prisma migrate deploy --name "phase8-production-${TIMESTAMP}" >> "$LOG_FILE" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        success "Database migrations completed"
    else
        error "Database migration failed!"
        error "Check log file for details: $LOG_FILE"
        exit 1
    fi
    
    # Show migration status
    info "Migration status:"
    if command -v bun &> /dev/null; then
        bunx prisma migrate status 2>> "$LOG_FILE" || true
    else
        npx prisma migrate status 2>> "$LOG_FILE" || true
    fi
}

# =============================================================================
# Data Seeding Functions
# =============================================================================

seed_tva_rates() {
    info "Seeding TVA (Tax) rates for Algeria..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would seed TVA rates"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    # Create seed script inline if it doesn't exist
    local seed_sql="
-- Phase 8: Seed Algerian TVA Rates
INSERT INTO \"TvaRate\" (\"id\", \"name\", \"rate\", \"description\", \"isActive\", \"createdAt\", \"updatedAt\")
VALUES 
    ('tva-standard', 'TVA Standard', 19.00, 'Taux normal de la TVA en Algérie', true, NOW(), NOW())
    ON CONFLICT (\"id\") DO UPDATE SET 
        \"name\" = EXCLUDED.\"name\",
        \"rate\" = EXCLUDED.\"rate\",
        \"updatedAt\" = NOW();

INSERT INTO \"TvaRate\" (\"id\", \"name\", \"rate\", \"description\", \"isActive\", \"createdAt\", \"updatedAt\")
VALUES 
    ('tva-reduced', 'TVA Réduit', 9.00, 'Taux réduit de la TVA', true, NOW(), NOW())
    ON CONFLICT (\"id\") DO UPDATE SET 
        \"name\" = EXCLUDED.\"name\",
        \"rate\" = EXCLUDED.\"rate\",
        \"updatedAt\" = NOW();

INSERT INTO \"TvaRate\" (\"id\", \"name\", \"rate\", \"description\", \"isActive\", \"createdAt\", \"updatedAt\")
VALUES 
    ('tva-zero', 'TVA Zéro', 0.00, 'Produits exonérés de TVA', true, NOW(), NOW())
    ON CONFLICT (\"id\") DO UPDATE SET 
        \"name\" = EXCLUDED.\"name\",
        \"rate\" = EXCLUDED.\"rate\",
        \"updatedAt\" = NOW();
"
    
    echo "$seed_sql" | psql "$DATABASE_URL" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        success "TVA rates seeded successfully"
    else
        warn "TVA rates seeding may have issues (check logs)"
    fi
}

seed_currencies() {
    info "Seeding currency data..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would seed currencies"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    local seed_sql="
-- Phase 8: Seed Supported Currencies
INSERT INTO \"Currency\" (\"code\", \"name\", \"symbol\", \"decimalPlaces\", \"isActive\", \"isBase\", \"createdAt\", \"updatedAt\")
VALUES 
    ('DZD', 'Algerian Dinar', 'د.ج', 2, true, true, NOW(), NOW()),
    ('USD', 'US Dollar', '$', 2, true, false, NOW(), NOW()),
    ('EUR', 'Euro', '€', 2, true, false, NOW(), NOW()),
    ('GBP', 'British Pound', '£', 2, false, false, NOW(), NOW()),
    ('TND', 'Tunisian Dinar', 'د.ت', 2, true, false, NOW(), NOW()),
    ('MAD', 'Moroccan Dirham', 'م.د.', 2, true, false, NOW(), NOW()),
    ('XOF', 'CFA Franc BCEAO', 'CFA', 2, false, false, NOW(), NOW()),
    ('XAF', 'CFA Franc BEAC', 'FCFA', 2, false, false, NOW(), NOW())
ON CONFLICT (\"code\") DO UPDATE SET 
    \"name\" = EXCLUDED.\"name\",
    \"symbol\" = EXCLUDED.\"symbol\",
    \"updatedAt\" = NOW();
"
    
    echo "$seed_sql" | psql "$DATABASE_URL" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        success "Currencies seeded successfully"
    else
        warn "Currency seeding may have issues (check logs)"
    fi
}

seed_payment_providers() {
    info "Seeding payment provider configurations..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would seed payment providers"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    local seed_sql="
-- Phase 8: Seed Payment Providers
INSERT INTO \"PaymentProvider\" (\"id\", \"name\", \"type\", \"code\", \"isActive\", \"config\", \"createdAt\", \"updatedAt\")
VALUES 
    (
        'provider-satim',
        'SATIM (CIB)',
        'bank_transfer',
        'SATIM',
        true,
        '{\"country\": \"DZ\", \"supports_3ds\": true, \"currency\": \"DZD\"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        'provider-stripe',
        'Stripe',
        'card',
        'STRIPE',
        true,
        '{\"supports_3ds\": true, \"currencies\": [\"USD\", \"EUR\", \"DZD\"]}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        'provider-btc',
        'Bitcoin',
        'crypto',
        'BTC',
        true,
        '{\"confirmations_required\": 3, \"currency\": \"BTC\"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        'provider-eth',
        'Ethereum',
        'crypto',
        'ETH',
        true,
        '{\"confirmations_required\": 12, \"currency\": \"ETH\"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        'provider-usdt',
        'Tether (USDT)',
        'crypto',
        'USDT',
        true,
        '{\"networks\": [\"TRC20\", \"ERC20\"], \"confirmations_required\": 12}'::jsonb,
        NOW(),
        NOW()
    )
ON CONFLICT (\"id\") DO UPDATE SET 
    \"name\" = EXCLUDED.\"name\",
    \"isActive\" = EXCLUDED.\"isActive\",
    \"config\" = EXCLUDED.\"config\",
    \"updatedAt\" = NOW();
"
    
    echo "$seed_sql" | psql "$DATABASE_URL" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        success "Payment providers seeded successfully"
    else
        warn "Payment provider seeding may have issues (check logs)"
    fi
}

seed_crm_pipeline() {
    info "Seeding CRM pipeline stages..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would seed CRM pipeline stages"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    local seed_sql="
-- Phase 8: Seed CRM Pipeline Stages
INSERT INTO \"PipelineStage\" (\"id\", \"name\", \"order\", \"color\", \"probability\", \"createdAt\", \"updatedAt\")
VALUES 
    ('stage-lead', 'Lead', 1, '#6B7280', 5, NOW(), NOW()),
    ('stage-qualified', 'Qualified', 2, '#3B82F6', 20, NOW(), NOW()),
    ('stage-proposal', 'Proposal Sent', 3, '#F59E0B', 40, NOW(), NOW()),
    ('stage-negotiation', 'Negotiation', 4, '#F97316', 60, NOW(), NOW()),
    ('stage-closed-won', 'Closed Won', 5, '#10B981', 100, NOW(), NOW()),
    ('stage-closed-lost', 'Closed Lost', 6, '#EF4444', 0, NOW(), NOW())
ON CONFLICT (\"id\") DO UPDATE SET 
    \"name\" = EXCLUDED.\"name\",
    \"order\" = EXCLUDED.\"order\",
    \"probability\" = EXCLUDED.\"probability\",
    \"updatedAt\" = NOW();
"
    
    echo "$seed_sql" | psql "$DATABASE_URL" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        success "CRM pipeline stages seeded successfully"
    else
        warn "CRM pipeline seeding may have issues (check logs)"
    fi
}

run_all_seeding() {
    info "Starting data seeding process..."
    
    seed_tva_rates
    seed_currencies
    seed_payment_providers
    seed_crm_pipeline
    
    success "All data seeding completed"
}

# =============================================================================
# Index Creation Functions
# =============================================================================

create_performance_indexes() {
    info "Creating performance indexes..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create performance indexes"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    local indexes_sql="
-- Phase 8: Performance Indexes for New Tables

-- Payment transaction indexes
CREATE INDEX IF NOT EXISTS idx_payment_transaction_status 
    ON \"PaymentTransaction\"(\"status\");
CREATE INDEX IF NOT EXISTS idx_payment_transaction_provider 
    ON \"PaymentTransaction\"(\"providerId\");
CREATE INDEX IF NOT EXISTS idx_payment_transaction_created_at 
    ON \"PaymentTransaction\"(\"createdAt\" DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_user 
    ON \"PaymentTransaction\"(\"userId\");
CREATE INDEX IF NOT EXISTS idx_payment_transaction_order 
    ON \"PaymentTransaction\"(\"orderId\");

-- Crypto transaction indexes
CREATE INDEX IF NOT EXISTS idx_crypto_tx_hash 
    ON \"CryptoTransaction\"(\"transactionHash\");
CREATE INDEX IF NOT EXISTS idx_crypto_tx_status 
    ON \"CryptoTransaction\"(\"status\");
CREATE INDEX IF NOT EXISTS idx_crypto_tx_currency 
    ON \"CryptoTransaction\"(\"currency\");

-- ERP sync log indexes
CREATE INDEX IF NOT EXISTS idx_erp_sync_log_timestamp 
    ON \"ERPSyncLog\"(\"syncedAt\" DESC);
CREATE INDEX IF NOT EXISTS idx_erp_log_entity_type 
    ON \"ERPSyncLog\"(\"entityType\");
CREATE INDEX IF NOT EXISTS idx_erp_log_status 
    ON \"ERPSyncLog\"(\"status\");

-- AR model indexes
CREATE INDEX IF NOT EXISTS idx_ar_model_product 
    ON \"ARModel\"(\"productId\");
CREATE INDEX IF NOT EXISTS idx_ar_model_format 
    ON \"ARModel\"(\"format\");
CREATE INDEX IF NOT EXISTS idx_ar_model_active 
    ON \"ARModel\"(\"isActive\");

-- Currency rate indexes
CREATE INDEX IF NOT EXISTS idx_currency_rate_date 
    ON \"CurrencyRate\"(\"effectiveDate\" DESC);
CREATE INDEX IF NOT EXISTS idx_currency_rate_pair 
    ON \"CurrencyRate\"(\"fromCurrency\", \"toCurrency\");

-- CRM deal indexes
CREATE INDEX IF NOT EXISTS idx_crm_deal_stage 
    ON \"CRMDeal\"(\"stageId\");
CREATE INDEX IF NOT EXISTS idx_crm_deal_assigned 
    ON \"CRMDeal\"(\"assignedTo\");
CREATE INDEX IF NOT EXISTS idx_crm_deal_value 
    ON \"CRMDeal\"(\"value\" DESC);
CREATE INDEX IF NOT EXISTS idx_crm_deal_created 
    ON \"CRMDeal\"(\"createdAt\" DESC);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoice_number 
    ON \"Invoice\"(\"invoiceNumber\");
CREATE INDEX IF NOT EXISTS idx_invoice_status 
    ON \"Invoice\"(\"status\");
CREATE INDEX IF NOT EXISTS idx_invoice_due_date 
    ON \"Invoice\"(\"dueDate\");
CREATE INDEX IF NOT EXISTS idx_invoice_company 
    ON \"Invoice\"(\"companyId\");
"
    
    echo "$indexes_sql" | psql "$DATABASE_URL" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        success "Performance indexes created successfully"
    else
        warn "Some index creation may have failed (check logs)"
    fi
}

# =============================================================================
# Verification Functions
# =============================================================================

verify_schema() {
    info "Verifying database schema..."
    
    cd "$PROJECT_ROOT"
    
    # Validate Prisma schema
    if command -v bun &> /dev/null; then
        bunx prisma validate >> "$LOG_FILE" 2>&1
    else
        npx prisma validate >> "$LOG_FILE" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        success "Prisma schema validation passed"
    else
        warn "Prisma schema has warnings (non-blocking)"
    fi
    
    # Check critical tables exist
    info "Verifying critical tables exist..."
    
    local tables=(
        "\"TvaRate\""
        "\"Currency\""
        "\"PaymentProvider\""
        "\"PipelineStage\""
    )
    
    local missing_tables=0
    
    for table in "${tables[@]}"; do
        local exists=$(psql "$DATABASE_URL" -tAc "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = ${table//\"/\'}
            );
        " 2>> "$LOG_FILE")
        
        if [ "$exists" = "t" ]; then
            verbose "Table $table exists"
        else
            warn "Table $table missing!"
            ((missing_tables++))
        fi
    done
    
    if [ $missing_tables -gt 0 ]; then
        error "$missing_tables table(s) are missing!"
        return 1
    fi
    
    success "All critical tables verified"
}

verify_data_integrity() {
    info "Verifying data integrity..."
    
    # Check TVA rates
    local tva_count=$(psql "$DATABASE_URL" -tAc "
        SELECT COUNT(*) FROM \"TvaRate\" WHERE \"isActive\" = true;
    " 2>> "$LOG_FILE")
    
    if [ "$tva_count" -ge 2 ]; then
        success "TVA rates: $tva_count active rates found"
    else
        warn "Only $tva_count TVA rate(s) found (expected >= 2)"
    fi
    
    # Check currencies
    local currency_count=$(psql "$DATABASE_URL" -tAc "
        SELECT COUNT(*) FROM \"Currency\" WHERE \"isActive\" = true;
    " 2>> "$LOG_FILE")
    
    if [ "$currency_count" -ge 3 ]; then
        success "Currencies: $currency_count active currencies found"
    else
        warn "Only $currency_count currency/cies found (expected >= 3)"
    fi
    
    # Check payment providers
    local provider_count=$(psql "$DATABASE_URL" -tAc "
        SELECT COUNT(*) FROM \"PaymentProvider\" WHERE \"isActive\" = true;
    " 2>> "$LOG_FILE")
    
    if [ "$provider_count" -ge 2 ]; then
        success "Payment providers: $provider_count active providers found"
    else
        warn "Only $provider_count payment provider(s) found (expected >= 2)"
    fi
}

clear_cache() {
    info "Clearing application cache..."
    
    if [ -n "${REDIS_URL:-}" ]; then
        if [ "$DRY_RUN" = true ]; then
            info "[DRY RUN] Would clear Redis cache"
            return
        fi
        
        # Clear specific cache keys related to the migrated data
        redis-cli -u "$REDIS_URL" DEL "cache:currencies" "cache:tva-rates" "cache:payment-providers" 2>> "$LOG_FILE" || true
        
        success "Cache cleared"
    else
        verbose "No Redis URL configured, skipping cache clear"
    fi
}

run_verification() {
    info "Running post-migration verification..."
    
    verify_schema
    verify_data_integrity
    clear_cache
    
    success "Verification completed"
}

# =============================================================================
# Rollback Function
# =============================================================================

perform_rollback() {
    warn "Initiating rollback procedure..."
    
    local latest_backup
    if [ -f "$BACKUP_DIR/latest_backup.txt" ]; then
        latest_backup=$(cat "$BACKUP_DIR/latest_backup.txt")
    else
        die "No backup file found for rollback"
    fi
    
    if [ ! -f "$latest_backup" ]; then
        die "Backup file not found: $latest_backup"
    fi
    
    info "Using backup: $latest_backup"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would restore from backup"
        return
    fi
    
    # Decompress and restore
    gunzip -c "$latest_backup" | psql "$DATABASE_URL" >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        success "Rollback completed successfully"
    else
        error "Rollback failed! Manual intervention required."
        exit 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo "=============================================="
    echo "  AlgeriaTrade.dz - Phase 8 Migration Script"
    echo "=============================================="
    echo "  Timestamp: $TIMESTAMP"
    echo "  Log File: $LOG_FILE"
    echo "=============================================="
    echo ""
    
    parse_args "$@"
    check_prerequisites
    
    # Handle rollback mode
    if [ "$ROLLBACK" = true ]; then
        perform_rollback
        exit 0
    fi
    
    # Handle verify-only mode
    if [ "$VERIFY_ONLY" = true ]; then
        run_verification
        exit 0
    fi
    
    # Handle seed-only mode
    if [ "$SEED_ONLY" = true ]; then
        run_all_seeding
        create_performance_indexes
        run_verification
        exit 0
    fi
    
    # Full migration flow
    info "Starting Phase 8 database migration..."
    
    # Step 1: Backup
    create_backup
    
    # Step 2: Migrate
    run_prisma_migration
    
    # Step 3: Seed data
    run_all_seeding
    
    # Step 4: Create indexes
    create_performance_indexes
    
    # Step 5: Verify
    run_verification
    
    echo ""
    echo "=============================================="
    success "Phase 8 migration completed successfully!"
    echo "=============================================="
    echo ""
    echo "Next steps:"
    echo "  1. Restart application services"
    echo "  2. Run smoke tests"
    echo "  3. Monitor error logs"
    echo "  4. Verify new features working"
    echo ""
    echo "Log file: $LOG_FILE"
}

# Run main function
main "$@"
