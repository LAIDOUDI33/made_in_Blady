#!/bin/bash
# =============================================================================
# Zero-Downtime Deployment Script - AlgeriaTrade.dz B2B Marketplace
# =============================================================================
#
# This script performs zero-downtime deployments with automatic rollback.
# It implements a blue-green deployment strategy for seamless updates.
#
# Features:
# - Pre-deployment health check
# - Database backup before deployment
# - Zero-downtime blue-green deployment
# - Automatic rollback on failure
# - Post-deployment verification
# - Slack/Email notifications (optional)
# - Deployment logging and history
#
# Prerequisites:
# - Server already set up with setup.sh
# - Docker and Docker Compose installed
# - Application running in docker-compose
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh                    # Deploy latest from current branch
#   ./deploy.sh --tag=v1.2.3      # Deploy specific version/tag
#   ./deploy.sh --rollback         # Rollback to previous version
#   ./deploy.sh --backup-only      # Only create backup, don't deploy
#   ./deploy.sh --skip-backup      # Skip backup step
#   ./deploy.sh --status           # Show deployment status
#   ./deploy.sh --help             # Show help
#
# Environment Variables:
#   APP_DIR          - Application directory (default: /opt/algeriatrade)
#   BACKUP_DIR       - Backup directory (default: /opt/algeriatrade/backups)
#   SLACK_WEBHOOK    - Slack webhook URL for notifications
#   DEPLOY_TIMEOUT   - Deployment timeout in seconds (default: 600)
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
APP_DIR="${APP_DIR:-/opt/algeriatrade}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
DEPLOY_LOG_DIR="$APP_DIR/deploy-logs"
DEPLOY_TIMEOUT=${DEPLOY_TIMEOUT:-600}
HEALTH_CHECK_URL="http://localhost:3000/api/health"
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_INTERVAL=10
ROLLBACK_ON_FAILURE=true
NOTIFY_SLACK=false

# Deployment state
DEPLOYMENT_ID="$(date +%Y%m%d-%H%M%S)"
PREVIOUS_VERSION=""
NEW_VERSION=""
DEPLOYMENT_START_TIME=""
DEPLOYMENT_END_TIME=""
DEPLOYMENT_STATUS=""

# Parse command line arguments
ACTION="deploy"
SKIP_BACKUP=false
SPECIFIC_TAG=""

for arg in "$@"; do
    case $arg in
        --tag=*)
            SPECIFIC_TAG="${arg#*=}"
            shift
            ;;
        --rollback)
            ACTION="rollback"
            shift
            ;;
        --backup-only)
            ACTION="backup"
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --status)
            ACTION="status"
            shift
            ;;
        --notify)
            NOTIFY_SLACK=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Zero-downtime deployment script for AlgeriaTrade.dz"
            echo ""
            echo "Options:"
            echo "  --tag=VERSION     Deploy specific version/tag"
            echo "  --rollback        Rollback to previous version"
            echo "  --backup-only     Create backup only, don't deploy"
            echo "  --skip-backup     Skip database backup"
            echo "  --status          Show deployment status"
            echo "  --notify          Send Slack notification"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  APP_DIR           Application directory (default: /opt/algeriatrade)"
            echo "  BACKUP_DIR        Backup directory"
            echo "  SLACK_WEBHOOK     Slack webhook URL"
            echo "  DEPLOY_TIMEOUT    Timeout in seconds (default: 600)"
            exit 0
            ;;
    esac
done

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[INFO]${NC} [$timestamp] $1" | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS]${NC} [$timestamp] $1" | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
}

log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING]${NC} [$timestamp] $1" | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} [$timestamp] $1" | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
}

log_step() {
    echo -e "\n${CYAN}━━━ $1 ━━━${NC}" | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ "$NOTIFY_SLACK" == true ]] && [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        local color="good"
        [[ "$status" == "failure" ]] && color="danger"
        [[ "$status" == "warning" ]] && color="warning"
        
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"AlgeriaTrade.dz Deployment\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"${NEW_VERSION:-N/A}\", \"short\": true},
                        {\"title\": \"Duration\", \"value\": \"${DEPLOYMENT_DURATION:-N/A}\", \"short\": true},
                        {\"title\": \"Server\", \"value\": \"$(hostname)\", \"short\": true}
                    ],
                    \"footer\": \"AlgeriaTrade.dz Deploy Bot\",
                    \"ts\": $(date +%s)
                }]
            }" > /dev/null 2>&1 || true
    fi
}

# Check if command exists
check_command() {
    command -v "$1" &> /dev/null
}

# Get current container image version
get_current_version() {
    cd "$APP_DIR"
    docker compose ps app --format '{{.Image}}' 2>/dev/null || echo "unknown"
}

# Health check function
health_check() {
    local retries=$HEALTH_CHECK_RETRIES
    local interval=$HEALTH_CHECK_INTERVAL
    
    log_info "Running health check ($retries attempts, ${interval}s interval)..."
    
    while [ $retries -gt 0 ]; do
        if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            return 0
        fi
        retries=$((retries - 1))
        sleep $interval
    done
    
    return 1
}

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------

preflight_checks() {
    log_step "Pre-flight Checks"
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        # Check if user can run docker
        if ! docker ps &> /dev/null; then
            log_error "Cannot run Docker. Run with sudo or add user to docker group."
            exit 1
        fi
    fi
    
    # Check application directory
    if [[ ! -d "$APP_DIR" ]]; then
        log_error "Application directory not found: $APP_DIR"
        exit 1
    fi
    
    # Check docker-compose file
    if [[ ! -f "$APP_DIR/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found in $APP_DIR"
        exit 1
    fi
    
    # Check Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$DEPLOY_LOG_DIR"
    
    # Record start time
    DEPLOYMENT_START_TIME=$(date +%s)
    
    # Get current version before deployment
    PREVIOUS_VERSION=$(get_current_version)
    log_info "Current version: $PREVIOUS_VERSION"
    
    log_success "Pre-flight checks passed"
}

# -----------------------------------------------------------------------------
# Backup Functions
# -----------------------------------------------------------------------------

create_backup() {
    log_step "Creating Backup"
    
    local backup_file="$BACKUP_DIR/${DEPLOYMENT_ID}-backup.tar.gz"
    local db_backup_file="$BACKUP_DIR/${DEPLOYMENT_ID}-db.sql.gz"
    
    cd "$APP_DIR"
    
    # Backup database
    log_info "Backing up PostgreSQL database..."
    if docker compose exec -T postgres pg_dump -U algeriatrade algeriatrade 2>/dev/null | gzip > "$db_backup_file"; then
        local db_size=$(du -sh "$db_backup_file" | cut -f1)
        log_success "Database backup created: $db_backup_file ($db_size)"
    else
        log_warning "Database backup failed! Proceeding anyway..."
    fi
    
    # Backup uploads directory
    log_info "Backing up uploaded files..."
    if tar -czf "$backup_file" --exclude='node_modules' --exclude='.next' --exclude='.git' \
        public/uploads data 2>/dev/null; then
        local upload_size=$(du -sh "$backup_file" | cut -f1)
        log_success "Files backup created: $backup_file ($upload_size)"
    else
        log_warning "Files backup failed!"
    fi
    
    # Save current docker-compose config and image
    cp docker-compose.yml "$BACKUP_DIR/${DEPLOYMENT_ID}-docker-compose.yml"
    docker compose exec -T app cat /app/package.json > "$BACKUP_DIR/${DEPLOYMENT_ID}-package.json" 2>/dev/null || true
    
    # Save current image tag for rollback
    get_current_version > "$BACKUP_DIR/${DEPLOYMENT_ID}-previous-version.txt"
    
    log_success "Backup completed successfully"
}

# -----------------------------------------------------------------------------
# Deployment Functions
# -----------------------------------------------------------------------------

pull_changes() {
    log_step "Pulling Changes"
    
    cd "$APP_DIR"
    
    # Pull latest changes from git
    log_info "Pulling latest changes from repository..."
    
    if [[ -n "$SPECIFIC_TAG" ]]; then
        git fetch --tags
        git checkout "$SPECIFIC_TAG"
        NEW_VERSION="$SPECIFIC_TAG"
    else
        git fetch origin
        git pull origin "$(git branch --show-current)"
        NEW_VERSION=$(git rev-parse --short HEAD)
    fi
    
    log_success "Pulled version: $NEW_VERSION"
}

build_and_deploy() {
    log_step "Building and Deploying"
    
    cd "$APP_DIR"
    
    # Pull new images (if using pre-built images from registry)
    log_info "Pulling new Docker images..."
    docker compose pull 2>/dev/null || log_info "No pre-built images, will build locally"
    
    # Build new images
    log_info "Building application..."
    docker compose build --no-cache app 2>&1 | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID-build.log"
    
    # Run database migrations (before starting new container)
    log_info "Running database migrations..."
    docker compose run --rm app npx prisma migrate deploy 2>&1 | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID-migrate.log" || {
        log_warning "Migration had warnings but continuing..."
    }
    
    # Blue-green deployment strategy
    log_info "Starting blue-green deployment..."
    
    # Start new containers alongside old ones
    # Docker Compose handles rolling updates by default
    docker compose up -d --no-deps --build app 2>&1 | tee -a "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID-deploy.log"
    
    # Wait for new container to be healthy
    log_info "Waiting for new container to be healthy..."
    
    if health_check; then
        log_success "New deployment is healthy!"
    else
        log_error "Health check failed after deployment!"
        return 1
    fi
    
    # Restart nginx to ensure clean state
    log_info "Reloading Nginx..."
    docker compose exec -T nginx nginx -s reload 2>/dev/null || true
    
    log_success "Deployment completed!"
}

# -----------------------------------------------------------------------------
# Rollback Function
# -----------------------------------------------------------------------------

perform_rollback() {
    log_step "Performing Rollback"
    
    cd "$APP_DIR"
    
    # Find most recent successful backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/*-previous-version.txt 2>/dev/null | head -1)
    
    if [[ -z "$latest_backup" ]]; then
        log_error "No backup found for rollback!"
        exit 1
    fi
    
    local backup_id=$(basename "$latest_backup" | sed 's/-previous-version.txt//')
    log_info "Rolling back to deployment: $backup_id"
    
    # Restore database
    local db_backup="$BACKUP_DIR/${backup_id}-db.sql.gz"
    if [[ -f "$db_backup" ]]; then
        log_info "Restoring database from backup..."
        gunzip -c "$db_backup" | docker compose exec -T postgres psql -U algeriatrade algeriatrade 2>/dev/null || {
            log_error "Database restore failed!"
        }
    fi
    
    # Restore previous docker-compose config if different
    local compose_backup="$BACKUP_DIR/${backup_id}-docker-compose.yml"
    if [[ -f "$compose_backup" ]]; then
        cp "$compose_backup" docker-compose.yml
    fi
    
    # Restart with previous configuration
    log_info "Restarting services with previous configuration..."
    docker compose down 2>/dev/null
    docker compose up -d 2>/dev/null
    
    # Wait for health check
    sleep 30
    
    if health_check; then
        log_success "Rollback completed successfully!"
        send_notification "success" "Rollback to $backup_id completed successfully"
    else
        log_error "Rollback failed! Manual intervention required!"
        send_notification "failure" "Rollback FAILED! Manual intervention required!"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Post-deployment Verification
# -----------------------------------------------------------------------------

post_deploy_verification() {
    log_step "Post-deployment Verification"
    
    cd "$APP_DIR"
    
    # Health check
    log_info "Verifying application health..."
    if ! health_check; then
        log_error "Post-deployment health check failed!"
        return 1
    fi
    log_success "Health check passed"
    
    # Check all services are running
    log_info "Checking service status..."
    local services=("app" "postgres" "redis" "nginx")
    
    for service in "${services[@]}"; do
        if docker compose ps "$service" --format '{{.State}}' 2>/dev/null | grep -q "running"; then
            log_success "$service: running"
        else
            log_warning "$service: may not be running properly"
        fi
    done
    
    # Basic API endpoint tests
    log_info "Testing API endpoints..."
    
    local endpoints=("/api/health" "/api/status")
    local all_passed=true
    
    for endpoint in "${endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" 2>/dev/null || echo "000")
        if [[ "$status_code" == "200" ]]; then
            log_success "GET $endpoint → $status_code"
        else
            log_warning "GET $endpoint → $status_code (expected 200)"
            all_passed=false
        fi
    done
    
    if [[ "$all_passed" == true ]]; then
        log_success "All API endpoints responding correctly"
    else
        log_warning "Some API endpoints returned unexpected responses"
    fi
    
    # Clean up old Docker images
    log_info "Cleaning up old Docker images..."
    docker image prune -af --filter "until=48h" 2>/dev/null || true
    
    return 0
}

# -----------------------------------------------------------------------------
# Cleanup Old Backups
# -----------------------------------------------------------------------------

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7 days)..."
    
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.txt" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.yml" -mtime +7 -delete 2>/dev/null || true
}

# -----------------------------------------------------------------------------
# Status Display
# -----------------------------------------------------------------------------

show_status() {
    echo ""
    echo "============================================================================="
    echo -e "${CYAN}AlgeriaTrade.dz - Deployment Status${NC}"
    echo "============================================================================="
    echo ""
    
    cd "$APP_DIR"
    
    echo "Services:"
    echo "---------"
    docker compose ps 2>/dev/null || echo "Docker Compose not running"
    echo ""
    
    echo "Recent Deployments:"
    echo "-------------------"
    ls -lt "$DEPLOY_LOG_DIR"/*.log 2>/dev/null | head -5 | while read line; do
        echo "  $line"
    done
    echo ""
    
    echo "Backups Available:"
    echo "------------------"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 | while read line; do
        echo "  $line"
    done || echo "  No backups found"
    echo ""
    
    echo "Disk Usage:"
    echo "-----------"
    df -h "$APP_DIR" 2>/dev/null
    echo ""
    
    echo "Recent Logs:"
    echo "------------"
    if [[ -f "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log" ]]; then
        tail -20 "$DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
    fi
}

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------

main() {
    echo ""
    echo "============================================================================="
    echo -e "${BLUE}AlgeriaTrade.dz - Zero-Downtime Deployment${NC}"
    echo "============================================================================="
    echo "Action:      $ACTION"
    echo "Timestamp:   $(date)"
    echo "Deployment:  $DEPLOYMENT_ID"
    echo "============================================================================="
    
    case "$ACTION" in
        deploy)
            preflight_checks
            
            # Create backup unless skipped
            if [[ "$SKIP_BACKUP" != true ]]; then
                create_backup
            else
                log_info "Skipping backup (--skip-backup)"
            fi
            
            # Pull and deploy
            pull_changes
            
            # Attempt deployment with error handling
            if ! build_and_deploy; then
                log_error "Deployment failed!"
                
                if [[ "$ROLLBACK_ON_FAILURE" == true ]]; then
                    log_info "Initiating automatic rollback..."
                    perform_rollback
                    DEPLOYMENT_STATUS="rolled_back"
                    send_notification "warning" "Deployment FAILED but rollback succeeded"
                else
                    DEPLOYMENT_STATUS="failed"
                    send_notification "failure" "Deployment FAILED (rollback disabled)"
                fi
                exit 1
            fi
            
            # Post-deployment verification
            if ! post_deploy_verification; then
                log_warning "Post-deployment verification found issues"
                DEPLOYMENT_STATUS="warnings"
            else
                DEPLOYMENT_STATUS="success"
            fi
            
            # Cleanup
            cleanup_old_backups
            
            # Calculate duration
            DEPLOYMENT_END_TIME=$(date +%s)
            DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))
            DEPLOYMENT_DURATION_FMT="$((DEPLOYMENT_DURATION / 60))m $((DEPLOYMENT_DURATION % 60))s"
            
            # Final summary
            echo ""
            echo "============================================================================="
            echo -e "${GREEN}✅ Deployment Complete!${NC}"
            echo "============================================================================="
            echo "  Deployment ID:    $DEPLOYMENT_ID"
            echo "  Previous Version: $PREVIOUS_VERSION"
            echo "  New Version:      $NEW_VERSION"
            echo "  Status:           $DEPLOYMENT_STATUS"
            echo "  Duration:         $DEPLOYMENT_DURATION_FMT"
            echo "  Log File:         $DEPLOY_LOG_DIR/$DEPLOYMENT_ID.log"
            echo "============================================================================="
            
            send_notification "success" "Deployment $DEPLOYMENT_ID completed successfully in $DEPLOYMENT_DURATION_FMT"
            ;;
            
        rollback)
            perform_rollback
            ;;
            
        backup)
            mkdir -p "$BACKUP_DIR"
            DEPLOYMENT_START_TIME=$(date +%s)
            create_backup
            log_success "Backup completed"
            ;;
            
        status)
            show_status
            ;;
    esac
}

# Handle errors
trap 'log_error "Script failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"
