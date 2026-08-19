#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz API Developer Portal - Main Deployment Script
# Production Deployment with Health Checks & Rollback
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy/api-portal"
BACKUP_DIR="$DEPLOY_DIR/backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version tracking
DEPLOY_VERSION="${DEPLOY_VERSION:-$(date +%Y%m%d%H%M%S)}"
ROLLBACK_VERSION=""

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------
check_prerequisites() {
    log_info "Running pre-flight checks..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed."
        exit 1
    fi
    
    # Check available resources
    local total_mem=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$total_mem" -lt 8 ]; then
        log_warn "System has less than 8GB RAM. Recommended minimum is 8GB."
    fi
    
    # Check disk space (need at least 20GB)
    local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2{print $4}' | tr -d 'G')
    if [ "$available_space" -lt 20 ]; then
        log_error "Insufficient disk space. Need at least 20GB available."
        exit 1
    fi
    
    log_success "Pre-flight checks passed."
}

# -----------------------------------------------------------------------------
# Environment Variable Validation
# -----------------------------------------------------------------------------
validate_environment() {
    log_info "Validating environment variables..."
    
    local env_file="$DEPLOY_DIR/.env.production"
    
    if [ ! -f "$env_file" ]; then
        log_error ".env.production file not found at $env_file"
        log_info "Please copy .env.example to .env.production and configure values."
        exit 1
    fi
    
    # Source environment file
    set -a
    source "$env_file"
    set +a
    
    # Required variables
    local required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "ENCRYPTION_KEY"
        "SMTP_HOST"
        "SMTP_USER"
        "SMTP_PASS"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        fi
        exit 1
    fi
    
    # Validate secrets strength
    local min_secret_length=32
    if [ ${#JWT_SECRET} -lt $min_secret_length ]; then
        log_warn "JWT_SECRET should be at least $min_secret_length characters."
    fi
    
    if [ ${#ENCRYPTION_KEY} -lt $min_secret_length ]; then
        log_warn "ENCRYPTION_KEY should be at least $min_secret_length characters."
    fi
    
    log_success "Environment validation passed."
}

# -----------------------------------------------------------------------------
# Database Migration
# -----------------------------------------------------------------------------
run_migrations() {
    log_info "Running database migrations..."
    
    # Ensure PostgreSQL is ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres pg_isready -U apiportal; then
            break
        fi
        log_info "Waiting for PostgreSQL... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "PostgreSQL did not become ready in time."
        exit 1
    fi
    
    # Run Prisma migrations
    log_info "Applying Prisma schema migrations..."
    cd "$PROJECT_ROOT"
    
    # Generate Prisma client
    npx prisma generate
    
    # Push schema changes
    npx prisma db push --accept-data-loss || {
        log_error "Database migration failed!"
        exit 1
    }
    
    # Run seed data if this is a fresh installation
    if [ "${FRESH_INSTALL:-false}" = "true" ]; then
        log_info "Seeding initial data..."
        npx prisma db seed || log_warn "Seed data import had warnings."
    fi
    
    log_success "Database migrations completed."
}

# -----------------------------------------------------------------------------
# Asset Optimization
# -----------------------------------------------------------------------------
optimize_assets() {
    log_info "Optimizing application assets..."
    
    cd "$PROJECT_ROOT"
    
    # Build Next.js application with production optimizations
    log_info "Building Next.js application..."
    npm run build || {
        log_error "Build failed!"
        exit 1
    }
    
    # Optimize images
    if command -v npx &> /dev/null; then
        log_info "Optimizing images..."
        npx next optimize || true
    fi
    
    log_success "Asset optimization completed."
}

# -----------------------------------------------------------------------------
# Create Backup Before Deployment
# -----------------------------------------------------------------------------
create_backup() {
    log_info "Creating deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/config"
    
    # Backup database
    log_info "Backing up database..."
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
        pg_dumpall -U apiportal > "$BACKUP_DIR/database/full_backup.sql" 2>/dev/null || \
        log_warn "Database backup may be incomplete."
    
    # Backup configuration
    cp "$DEPLOY_DIR/.env.production" "$BACKUP_DIR/config/" 2>/dev/null || true
    cp "$DEPLOY_DIR/docker-compose.api-portal.yml" "$BACKUP_DIR/config/" 2>/dev/null || true
    
    # Store version info
    echo "$DEPLOY_VERSION" > "$BACKUP_DIR/version.txt"
    git rev-parse HEAD > "$BACKUP_DIR/git_commit.txt" 2>/dev/null || true
    
    log_success "Backup created at $BACKUP_DIR"
}

# -----------------------------------------------------------------------------
# Deploy Application
# -----------------------------------------------------------------------------
deploy_application() {
    log_info "Deploying AlgeriaTrade API Developer Portal v$DEPLOY_VERSION..."
    
    cd "$DEPLOY_DIR"
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f docker-compose.api-portal.yml pull --quiet || true
    
    # Build custom images
    log_info "Building application image..."
    docker-compose -f docker-compose.api-portal.yml build --parallel
    
    # Start services
    log_info "Starting services..."
    docker-compose -f docker-compose.api-portal.yml up -d --remove-orphans
    
    log_success "Deployment initiated."
}

# -----------------------------------------------------------------------------
# Health Checks
# -----------------------------------------------------------------------------
run_health_checks() {
    log_info "Running health checks..."
    
    local base_url="${APP_URL:-https://localhost}"
    local max_wait=300
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $max_wait ]; then
            log_error "Health checks timed out after ${max_wait}s"
            return 1
        fi
        
        # Check API Gateway health
        if curl -sf "$base_url/api/health" > /dev/null 2>&1; then
            log_success "API Gateway is healthy."
        else
            log_info "Waiting for API Gateway... (${elapsed}s elapsed)"
            sleep 5
            continue
        fi
        
        # Check database connectivity
        if docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
           pg_isready -U apiportal > /dev/null 2>&1; then
            log_success "Database connection is healthy."
        else
            log_warn "Database health check failed."
            return 1
        fi
        
        # Check Redis connectivity
        if docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T redis \
           redis-cli ping 2>/dev/null | grep -q PONG; then
            log_success "Redis connection is healthy."
        else
            log_warn "Redis health check failed."
            return 1
        fi
        
        # Check critical endpoints
        local endpoints=(
            "/api/ready"
            "/api/v1/docs"
            "/api/portal/status"
        )
        
        local all_healthy=true
        for endpoint in "${endpoints[@]}"; do
            if curl -sf --max-time 10 "$base_url$endpoint" > /dev/null 2>&1; then
                : # Endpoint healthy
            else
                log_warn "Endpoint $endpoint is not responding."
                all_healthy=false
            fi
        done
        
        if $all_healthy; then
            log_success "All health checks passed!"
            return 0
        fi
        
        sleep 10
    done
}

# -----------------------------------------------------------------------------
# Rollback Procedure
# -----------------------------------------------------------------------------
rollback() {
    ROLLBACK_VERSION="${1:-}"
    
    if [ -z "$ROLLBACK_VERSION" ]; then
        # Find most recent backup
        ROLLBACK_VERSION=$(ls -dt "$DEPLOY_DIR/backups"/*/ 2>/dev/null | head -1 | xargs basename)
        
        if [ -z "$ROLLBACK_VERSION" ] || [ ! -d "$DEPLOY_DIR/backups/$ROLLBACK_VERSION" ]; then
            log_error "No backup found for rollback."
            exit 1
        fi
    fi
    
    log_warn "Initiating rollback to version: $ROLLBACK_VERSION"
    
    local rollback_dir="$DEPLOY_DIR/backups/$ROLLBACK_VERSION"
    
    if [ ! -d "$rollback_dir" ]; then
        log_error "Rollback directory not found: $rollback_dir"
        exit 1
    fi
    
    # Stop current deployment
    log_info "Stopping current deployment..."
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" down
    
    # Restore database
    if [ -f "$rollback_dir/database/full_backup.sql" ]; then
        log_info "Restoring database from backup..."
        docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" up -d postgres
        sleep 10
        docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T postgres \
            psql -U apiportal -d algeriatrade_portal < "$rollback_dir/database/full_backup.sql" || {
            log_error "Database restore failed!"
            exit 1
        }
    fi
    
    # Restore configuration
    if [ -f "$rollback_dir/config/.env.production" ]; then
        cp "$rollback_dir/config/.env.production" "$DEPLOY_DIR/.env.production"
    fi
    
    # Restart services
    log_info "Restarting services..."
    docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" up -d
    
    # Run health checks
    if run_health_checks; then
        log_success "Rollback completed successfully!"
    else
        log_error "Rollback completed but health checks are failing!"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Post-deployment Tasks
# -----------------------------------------------------------------------------
post_deploy() {
    log_info "Running post-deployment tasks..."
    
    # Clear Redis cache (optional)
    if [ "${CLEAR_CACHE:-true}" = "true" ]; then
        log_info "Clearing Redis cache..."
        docker-compose -f "$DEPLOY_DIR/docker-compose.api-portal.yml" exec -T redis \
            redis-cli FLUSHDB 2>/dev/null || true
    fi
    
    # Warm up caches
    log_info "Warming up application caches..."
    local base_url="${APP_URL:-https://localhost}"
    curl -sf "$base_url/" > /dev/null 2>&1 || true
    curl -sf "$base_url/api/v1/docs" > /dev/null 2>&1 || true
    
    # Send deployment notification
    if [ "${SLACK_WEBHOOK_URL:-}" != "" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"✅ AlgeriaTrade API Portal deployed successfully (v$DEPLOY_VERSION)\"}" \
            > /dev/null 2>&1 || true
    fi
    
    log_success "Post-deployment tasks completed."
}

# -----------------------------------------------------------------------------
# Cleanup Old Backups
# -----------------------------------------------------------------------------
cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7)..."
    
    find "$DEPLOY_DIR/backups" -maxdepth 1 -type d -name "20*" | \
        sort -r | tail -n +8 | xargs rm -rf 2>/dev/null || true
    
    log_success "Cleanup completed."
}

# -----------------------------------------------------------------------------
# Main Deployment Flow
# -----------------------------------------------------------------------------
main() {
    echo ""
    echo "============================================================"
    echo "  AlgeriaTrade.dz API Developer Portal - Deployment Script"
    echo "  Version: $DEPLOY_VERSION"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"
    echo ""
    
    # Handle rollback mode
    if [ "${1:-}" = "rollback" ]; then
        rollback "${2:-}"
        exit 0
    fi
    
    # Standard deployment flow
    check_prerequisites
    validate_environment
    create_backup
    run_migrations
    optimize_assets
    deploy_application
    
    if run_health_checks; then
        post_deploy
        cleanup_old_backups
        echo ""
        log_success "============================================"
        log_success "  DEPLOYMENT COMPLETED SUCCESSFULLY!"
        log_success "  Version: $DEPLOY_VERSION"
        log_success "  Backup: $BACKUP_DIR"
        log_success "============================================"
        echo ""
    else
        log_error "Health checks failed! Initiating rollback..."
        rollback
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
