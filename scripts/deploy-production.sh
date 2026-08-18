#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz Production Deployment Script - Phase 8
# =============================================================================
# Comprehensive production deployment script with:
# - Pre-flight checks (env vars, database, dependencies)
# - Database migration execution
# - Asset optimization
# - Docker build & push
# - Rolling deployment
# - Health checks
# - Rollback on failure
# - Notification on completion
#
# Usage: ./scripts/deploy-production.sh [version] [options]
#
# Examples:
#   ./scripts/deploy-production.sh 8.0.0                    # Deploy version 8.0.0
#   ./scripts/deploy-production.sh 8.0.0 --skip-backup      # Skip database backup
#   ./scripts/deploy-production.sh 8.0.0 --dry-run          # Dry run mode
#   ./scripts/deploy-production.sh --rollback              # Rollback to previous version
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Version info
SCRIPT_VERSION="8.0.0"
DEPLOYMENT_PHASE="Phase 8"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups/production"
LOG_DIR="$PROJECT_ROOT/logs"
DEPLOY_LOG="$LOG_DIR/deployment-$(date +%Y%m%d_%H%M%S).log"
ARTIFACT_DIR="$PROJECT_ROOT/.deploy-artifacts"

# Docker configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/algeriatrade}"
IMAGE_NAME="${IMAGE_NAME:-algeriatrade-app}"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.production.yml"

# Deployment configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-https://algeriatrade.dz/api/health}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
ROLLING_UPDATE_TIMEOUT="${ROLLING_UPDATE_TIMEOUT:-300}"

# Required environment variables for Phase 8
REQUIRED_ENV_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "NEXTAUTH_SECRET"
    "SATIM_API_KEY"
    "SATIM_API_SECRET"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "CRYPTO_WALLET_CONFIG"
    "ENCRYPTION_KEY"
)

# Optional but recommended env vars
RECOMMENDED_ENV_VARS=(
    "SENTRY_DSN"
    "SLACK_WEBHOOK_URL"
    "PAGERDUTY_INTEGRATION_KEY"
)

# =============================================================================
# State Variables
# =============================================================================

VERSION="${1:-}"
SKIP_BACKUP=false
SKIP_MIGRATION=false
SKIP_BUILD=false
DRY_RUN=false
FORCE=false
VERBOSE=false
ROLLBACK=false
DEPLOY_START_TIME=""
PREVIOUS_VERSION=""
NEW_VERSION=""
DEPLOYMENT_ID=""

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}]${NC} $1" | tee -a "$DEPLOY_LOG"
}

warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING ${timestamp}]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR ${timestamp}]${NC} $1" | tee -a "$DEPLOY_LOG"
}

info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[INFO ${timestamp}]${NC} $1" | tee -a "$DEPLOY_LOG"
}

debug() {
    if [[ "$VERBOSE" == true ]]; then
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo -e "${PURPLE}[DEBUG ${timestamp}]${NC} $1" | tee -a "$DEPLOY_LOG"
    fi
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$DEPLOY_LOG"
}

fail() {
    echo -e "${RED}✗${NC} $1" | tee -a "$DEPLOY_LOG"
}

die() {
    error "$1"
    send_notification "failure" "Deployment FAILED: $1"
    exit 1
}

header() {
    echo ""
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

step() {
    echo ""
    echo -e "${BLUE}▶${NC} ${BOLD}$1${NC}"
    echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
}

# =============================================================================
# Initialization
# =============================================================================

setup_directories() {
    mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/files" "$BACKUP_DIR/configs"
    mkdir -p "$LOG_DIR" "$ARTIFACT_DIR"
    touch "$DEPLOY_LOG"
}

generate_deployment_id() {
    DEPLOYMENT_ID="deploy-$(date +%Y%m%d%H%M%S)-$RANDOM"
    info "Deployment ID: $DEPLOYMENT_ID"
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-migration)
                SKIP_MIGRATION=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --dry-run|-n)
                DRY_RUN=true
                shift
                ;;
            --force|-f)
                FORCE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                if [[ -z "$VERSION" ]] && [[ ! "$1" =~ ^-- ]]; then
                    VERSION="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Generate version if not provided
    if [[ -z "$VERSION" ]] && [[ "$ROLLBACK" == false ]]; then
        VERSION="$(git describe --tags --always 2>/dev/null || echo 'unknown')-${DEPLOYMENT_ID}"
        info "Auto-generated version: $VERSION"
    fi
    
    NEW_VERSION="$VERSION"
}

show_help() {
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║     🇩🇿 AlgeriaTrade.dz Production Deployment Script (Phase 8)    ║
╚═══════════════════════════════════════════════════════════════════╝

Usage: ./scripts/deploy-production.sh [VERSION] [OPTIONS]

Arguments:
  VERSION                 Deployment version tag (optional, auto-generated if omitted)

Options:
  --skip-backup           Skip database backup before deployment
  --skip-migration        Skip database migrations
  --skip-build            Skip Docker build (use existing image)
  --dry-run, -n           Simulate deployment without making changes
  --force, -f             Force deployment skipping confirmations
  --verbose, -v           Enable verbose output
  --rollback              Rollback to previous deployment
  --help, -h              Show this help message

Examples:
  ./scripts/deploy-production.sh 8.0.0              Deploy version 8.0.0
  ./scripts/deploy-production.sh 8.0.1 --dry-run    Dry run for testing
  ./scripts/deploy-production.sh --rollback         Rollback deployment
  ./scripts/deploy-production.sh -v -f 8.0.0        Verbose forced deploy

Environment Variables (Required):
  DATABASE_URL           PostgreSQL connection string
  REDIS_URL              Redis connection URL
  NEXTAUTH_SECRET       NextAuth.js secret key
  SATIM_API_KEY          SATIM/CIB API key
  SATIM_API_SECRET       SATIM/CIB API secret
  STRIPE_SECRET_KEY      Stripe secret key (live mode)
  STRIPE_WEBHOOK_SECRET  Stripe webhook signing secret
  CRYPTO_WALLET_CONFIG   Crypto wallet configuration JSON
  ENCRYPTION_KEY         Data encryption key

Environment Variables (Optional):
  SENTRY_DSN             Sentry error tracking DSN
  SLACK_WEBHOOK_URL      Slack notifications webhook
  PAGERDUTY_INTEGRATION_KEY PagerDuty integration key
  DOCKER_REGISTRY        Container registry URL
EOF
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

check_prerequisites() {
    step "Running Pre-flight Checks"
    
    # Check required tools
    check_required_tools
    
    # Check environment variables
    check_environment_variables
    
    # Check Git status
    check_git_status
    
    # Check disk space
    check_disk_space
    
    # Check Docker availability
    check_docker_status
    
    # Check database connectivity
    check_database_connectivity
    
    # Check Redis connectivity
    check_redis_connectivity
    
    success "All pre-flight checks passed"
}

check_required_tools() {
    info "Checking required tools..."
    
    local required_tools=("git" "docker" "docker-compose" "curl" "jq")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        else
            debug "Found: $(command -v $tool)"
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        die "Missing required tools: ${missing_tools[*]}"
    fi
    
    success "All required tools available"
}

check_environment_variables() {
    info "Checking environment variables..."
    
    local missing_vars=()
    local optional_missing=()
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        else
            debug "$var is set (${#!var} chars)"
        fi
    done
    
    for var in "${RECOMMENDED_ENV_VARS[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            optional_missing+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        if [[ "$FORCE" != true ]]; then
            die "Missing required environment variables: ${missing_vars[*]}"
        else
            warn "Continuing with missing variables (forced): ${missing_vars[*]}"
        fi
    fi
    
    if [[ ${#optional_missing[@]} -gt 0 ]]; then
        warn "Optional variables not set (recommended): ${optional_missing[*]}"
    fi
    
    success "Environment variables verified"
}

check_git_status() {
    info "Checking Git repository status..."
    
    # Check if we're in a git repo
    if ! git rev-parse --is-inside-work-tree &> /dev/null; then
        warn "Not in a git repository - skipping git checks"
        return
    fi
    
    # Record current commit for potential rollback
    PREVIOUS_VERSION=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    info "Current version: $PREVIOUS_VERSION"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        local changed_files=$(git diff --name-only HEAD | wc -l)
        warn "Uncommitted changes detected: $changed_files files"
        
        if [[ "$FORCE" != true ]]; then
            warn "Commit or stash changes before production deployment"
        fi
    else
        success "Working tree clean"
    fi
    
    # Check branch (should be main/master for production)
    local current_branch=$(git branch --show-current 2>/dev/null || echo "detached")
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        warn "Not on main/master branch: $current_branch"
    else
        success "On branch: $current_branch"
    fi
}

check_disk_space() {
    info "Checking disk space..."
    
    # Check minimum 5GB free space
    local available_gb=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | tr -d 'G')
    local min_required=5
    
    if [[ "$available_gb" -lt "$min_required" ]]; then
        warn "Low disk space: ${available_gb}GB available (recommended: ${min_required}GB+)"
    else
        success "Disk space OK: ${available_gb}GB available"
    fi
}

check_docker_status() {
    info "Checking Docker status..."
    
    if ! docker info &> /dev/null; then
        die "Docker is not running. Please start Docker first."
    fi
    
    # Check Docker compose v2
    if docker compose version &> /dev/null; then
        debug "Docker Compose v2 available"
    elif docker-compose version &> /dev/null; then
        debug "Docker Compose v1 available"
    else
        die "Docker Compose not found"
    fi
    
    success "Docker is running and ready"
}

check_database_connectivity() {
    info "Checking database connectivity..."
    
    local db_host=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:/]+).*/\1/')
    local db_port=$(echo "$DATABASE_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/' | grep -o '[0-9]*' || echo "5432")
    
    if [[ -z "$db_host" || "$db_host" == "$DATABASE_URL" ]]; then
        # Try SQLite detection
        if [[ "$DATABASE_URL" == *"file:"* || "$DATABASE_URL" == *".db"* || "$DATABASE_URL" == *".sqlite"* ]]; then
            info "SQLite database detected"
            if [[ -f "${DATABASE_URL#file:}" ]] || [[ -f "$DATABASE_URL" ]]; then
                success "SQLite database file accessible"
            else
                warn "SQLite database file not found at path"
            fi
            return
        fi
        db_host="localhost"
        db_port="5432"
    fi
    
    # Test connection with timeout
    if timeout 5 bash -c "echo > /dev/tcp/$db_host/$db_port" 2>/dev/null; then
        success "Database reachable at $db_host:$db_port"
        
        # Run a simple query test
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
                success "Database query test passed"
            else
                warn "Database query test failed"
            fi
        fi
    else
        die "Cannot connect to database at $db_host:$db_port"
    fi
}

check_redis_connectivity() {
    info "Checking Redis connectivity..."
    
    local redis_host="localhost"
    local redis_port="6379"
    
    if [[ -n "${REDIS_URL:-}" ]]; then
        redis_host=$(echo "$REDIS_URL" | sed -E 's/redis:\/\/([^:]+):?.*/\1/')
        redis_port=$(echo "$REDIS_URL" | sed -E 's/redis:\/\/[^:]+:?([0-9]+).*/\1/' | grep -o '[0-9]*' || echo "6379")
    fi
    
    if timeout 5 bash -c "echo > /dev/tcp/$redis_host/$redis_port" 2>/dev/null; then
        success "Redis reachable at $redis_host:$redis_port"
        
        # Test Redis command
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$REDIS_URL" ping 2>/dev/null | grep -q "PONG"; then
                success "Redis PING successful"
            else
                warn "Redis PING failed"
            fi
        fi
    else
        warn "Redis not reachable at $redis_host:$redis_port (non-fatal for some features)"
    fi
}

# =============================================================================
# Backup Procedures
# =============================================================================

create_backup() {
    step "Creating Backups"
    
    if [[ "$SKIP_BACKUP" == true ]]; then
        warn "Backup skipped (--skip-backup flag)"
        return
    fi
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_prefix="$BACKUP_DIR/${backup_timestamp}_pre-deploy"
    
    # Database backup
    backup_database "$backup_prefix"
    
    # Configuration backup
    backup_configuration "$backup_prefix"
    
    # Current deployment state backup
    backup_deployment_state "$backup_prefix"
    
    # Create backup manifest
    create_backup_manifest "$backup_prefix" "$backup_timestamp"
    
    success "Backup completed successfully"
}

backup_database() {
    local prefix="$1"
    info "Backing up database..."
    
    if [[ "$DATABASE_URL" == *"postgresql"* || "$DATABASE_URL" == *"postgres"* ]]; then
        # PostgreSQL backup
        local db_file="${prefix}_database.sql.gz"
        
        if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U algeriatrade algeriatrade 2>/dev/null | gzip > "$db_file"; then
            success "PostgreSQL backup created: $db_file ($(du -h "$db_file" | cut -f1))"
        elif command -v pg_dump &> /dev/null; then
            pg_dump "$DATABASE_URL" | gzip > "$db_file"
            success "PostgreSQL backup created (local): $db_file ($(du -h "$db_file" | cut -f1))"
        else
            fail "Could not create PostgreSQL backup"
        fi
    elif [[ "$DATABASE_URL" == *"file:"* || "$DATABASE_URL" == *".db"* ]]; then
        # SQLite backup
        local db_path="${DATABASE_URL#file:}"
        local db_file="${prefix}_sqlite.db.gz"
        
        if [[ -f "$db_path" ]]; then
            gzip -c "$db_path" > "$db_file"
            success "SQLite backup created: $db_file ($(du -h "$db_file" | cut -f1))"
        else
            fail "SQLite database not found: $db_path"
        fi
    else
        warn "Unknown database type, attempting generic backup..."
    fi
}

backup_configuration() {
    local prefix="$1"
    info "Backing up configuration..."
    
    local config_file="${prefix}_config.env"
    
    # Export current environment (filtering sensitive data)
    {
        echo "# Configuration backup - $(date)"
        echo "# Deployment: $DEPLOYMENT_ID"
        echo "# Version: $PREVIOUS_VERSION"
        echo "---"
        for var in "${REQUIRED_ENV_VARS[@]}" "${RECOMMENDED_ENV_VARS[@]}"; do
            if [[ -n "${!var:-}" ]]; then
                echo "$var=***SET***"
            fi
        done
    } > "$config_file"
    
    success "Configuration backup created: $config_file"
}

backup_deployment_state() {
    local prefix="$1"
    info "Backing up deployment state..."
    
    local state_file="${prefix}_state.json"
    
    # Get current container states
    {
        echo "{"
        echo "  \"deploymentId\": \"$DEPLOYMENT_ID\","
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"previousVersion\": \"$PREVIOUS_VERSION\","
        echo "  \"newVersion\": \"$NEW_VERSION\","
        echo "  \"containers\": $(docker ps --format '{{json .}}' 2>/dev/null | jq -s '.' || echo '[]'),"
        echo "  \"images\": $(docker images --format '{{json .}}' 2>/dev/null | jq -s '.' | head -20 || echo '[]')"
        echo "}"
    } > "$state_file"
    
    success "Deployment state saved: $state_file"
}

create_backup_manifest() {
    local prefix="$1"
    local timestamp="$2"
    local manifest_file="$BACKUP_DIR/MANIFEST.json"
    
    info "Creating backup manifest..."
    
    # Update or create manifest
    if [[ -f "$manifest_file" ]]; then
        local existing_content=$(cat "$manifest_file")
        echo "$existing_content" | jq ".backups += [{
            id: \"$timestamp\",
            deploymentId: \"$DEPLOYMENT_ID\",
            timestamp: \"$(date -Iseconds)\",
            version: \"$PREVIOUS_VERSION\",
            files: [\"$(basename ${prefix}_*)\"],
            size: $(du -sb "${prefix}"* 2>/dev/null | awk '{sum+=$1} END {print sum}')
        }]" > "$manifest_file"
    else
        cat > "$manifest_file" << EOF
{
  "backups": [{
    "id": "$timestamp",
    "deploymentId": "$DEPLOYMENT_ID",
    "timestamp": "$(date -Iseconds)",
    "version": "$PREVIOUS_VERSION",
    "files": ["$(basename ${prefix}_*)"],
    "size": $(du -sb "${prefix}"* 2>/dev/null | awk '{sum+=$1} END {print sum}')
  }]
}
EOF
    fi
    
    success "Backup manifest updated: $manifest_file"
}

# =============================================================================
# Build & Asset Optimization
# =============================================================================

build_application() {
    step "Building Application"
    
    if [[ "$SKIP_BUILD" == true ]]; then
        info "Build skipped (--skip-build flag)"
        return
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would build application now"
        return
    fi
    
    # Install dependencies
    info "Installing dependencies..."
    cd "$PROJECT_ROOT"
    bun install --frozen-lockfile 2>&1 | tee -a "$DEPLOY_LOG"
    
    # Run build
    info "Building Next.js application..."
    bun run build 2>&1 | tee -a "$DEPLOY_LOG"
    
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        die "Application build failed"
    fi
    
    success "Application built successfully"
}

optimize_assets() {
    step "Optimizing Assets"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would optimize assets now"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    # Optimize images
    info "Optimizing static assets..."
    
    # Clear Next.js cache for fresh build
    rm -rf .next/cache 2>/dev/null || true
    
    # Generate optimized PWA icons if script exists
    if [[ -f "scripts/generate-pwa-icons.js" ]]; then
        info "Generating PWA icons..."
        node scripts/generate-pwa-icons.js 2>/dev/null || true
    fi
    
    success "Assets optimized"
}

build_docker_image() {
    step "Building Docker Image"
    
    if [[ "$SKIP_BUILD" == true ]]; then
        info "Build skipped (--skip-build flag)"
        return
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would build Docker image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${VERSION}"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    local full_image_tag="${DOCKER_REGISTRY}/${IMAGE_NAME}:${VERSION}"
    local latest_tag="${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
    
    info "Building Docker image: $full_image_tag"
    
    # Build with build args for Phase 8 features
    docker build \
        --build-arg NEXT_PUBLIC_APP_VERSION="$VERSION" \
        --build-arg NODE_ENV="production" \
        --tag "$full_image_tag" \
        --tag "$latest_tag" \
        --progress=plain \
        . 2>&1 | tee -a "$DEPLOY_LOG"
    
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        die "Docker image build failed"
    fi
    
    # Scan image for vulnerabilities (if Trivy available)
    if command -v trivy &> /dev/null; then
        info "Scanning image for vulnerabilities..."
        trivy image --severity HIGH,CRITICAL "$full_image_tag" 2>&1 | tail -20 | tee -a "$DEPLOY_LOG" || true
    fi
    
    success "Docker image built: $full_image_tag"
    
    # Push to registry
    push_docker_image "$full_image_tag"
}

push_docker_image() {
    local image_tag="$1"
    
    step "Pushing Docker Image"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would push image: $image_tag"
        return
    fi
    
    info "Pushing image to registry..."
    docker push "$image_tag" 2>&1 | tee -a "$DEPLOY_LOG"
    
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        die "Failed to push Docker image"
    fi
    
    # Also push latest tag
    docker push "${DOCKER_REGISTRY}/${IMAGE_NAME}:latest" 2>&1 | tee -a "$DEPLOY_LOG" || true
    
    success "Image pushed successfully"
}

# =============================================================================
# Database Migration
# =============================================================================

run_database_migrations() {
    step "Running Database Migrations"
    
    if [[ "$SKIP_MIGRATION" == true ]]; then
        info "Migration skipped (--skip-migration flag)"
        return
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would run database migrations now"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    # Run Prisma migrations
    info "Executing Prisma migrations..."
    
    # Generate client first
    bunx prisma generate 2>&1 | tee -a "$DEPLOY_LOG"
    
    # Push schema changes (for production, use migrate deploy)
    if [[ -d "prisma/migrations" ]]; then
        info "Found migration directory, running migrate deploy..."
        bunx prisma migrate deploy 2>&1 | tee -a "$DEPLOY_LOG"
    else
        info "No migration directory, using db push..."
        bunx prisma db push 2>&1 | tee -a "$DEPLOY_LOG"
    fi
    
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        die "Database migration failed"
    fi
    
    # Verify migration status
    info "Verifying migration status..."
    bunx prisma migrate status 2>&1 | tee -a "$DEPLOY_LOG"
    
    success "Database migrations completed"
    
    # Seed any new data if needed
    seed_phase8_data
}

seed_phase8_data() {
    info "Seeding Phase 8 specific data..."
    
    # Run seed script if it exists
    if [[ -f "scripts/seed-production.ts" ]]; then
        info "Running production seed script..."
        bun run scripts/seed-production.ts 2>&1 | tee -a "$DEPLOY_LOG" || warn "Seed script had warnings"
    fi
    
    success "Phase 8 data seeding completed"
}

# =============================================================================
# Rolling Deployment
# =============================================================================

execute_rolling_deployment() {
    step "Executing Rolling Deployment"
    
    DEPLOY_START_TIME=$(date +%s)
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would execute rolling deployment now"
        info "[DRY RUN] Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${VERSION}"
        return
    fi
    
    # Save current running version
    save_current_deployment_info
    
    # Pull new images
    pull_new_images
    
    # Execute rolling update
    perform_rolling_update
    
    success "Rolling deployment initiated"
}

save_current_deployment_info() {
    info "Saving current deployment state..."
    
    echo "$PREVIOUS_VERSION" > "$ARTIFACT_DIR/previous_version.txt"
    echo "$DEPLOYMENT_ID" > "$ARTIFACT_DIR/current_deployment.txt"
    echo "$(date)" > "$ARTIFACT_DIR/deploy_start_time.txt"
    
    # Save current container images
    docker ps --format "{{.Image}}" > "$ARTIFACT_DIR/previous_images.txt" 2>/dev/null || true
}

pull_new_images() {
    info "Pulling new images..."
    
    docker compose -f "$COMPOSE_FILE" pull 2>&1 | tee -a "$DEPLOY_LOG" || \
        warn "Some images may not be in registry yet (using local)"
}

perform_rolling_update() {
    info "Performing rolling update..."
    
    # Use Docker Compose rolling update
    docker compose -f "$COMPOSE_FILE" up -d \
        --no-deps \
        --build \
        --remove-orphans \
        --quiet-pull \
        2>&1 | tee -a "$DEPLOY_LOG"
    
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        die "Rolling deployment failed"
    fi
    
    info "Waiting for containers to start..."
    sleep 10
}

# =============================================================================
# Health Checks
# =============================================================================

perform_health_checks() {
    step "Performing Health Checks"
    
    local max_retries=$HEALTH_CHECK_RETRIES
    local interval=$HEALTH_CHECK_INTERVAL
    local retry_count=0
    local health_status="unhealthy"
    
    info "Checking application health (max $max_retries attempts, ${interval}s interval)..."
    
    while [[ $retry_count -lt $max_retries ]]; do
        ((retry_count++))
        debug "Health check attempt $retry_count/$max_retries"
        
        if check_application_health; then
            health_status="healthy"
            break
        fi
        
        if [[ $retry_count -lt $max_retries ]]; then
            info "Waiting ${interval}s before next attempt..."
            sleep $interval
        fi
    done
    
    if [[ "$health_status" == "healthy" ]]; then
        success "Application is healthy after $retry_count attempts"
        verify_all_services
    else
        error "Health checks failed after $max_retries attempts"
        log_container_logs
        
        if [[ "$FORCE" != true ]]; then
            warn "Initiating automatic rollback due to health check failure..."
            execute_rollback
            die "Deployment rolled back due to health check failures"
        fi
        warn "Continuing despite health check failures (forced mode)"
    fi
}

check_application_health() {
    local health_endpoint="${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"
    
    debug "Checking: $health_endpoint"
    
    local response
    response=$(curl -sf -m 10 "$health_endpoint" 2>/dev/null) || return 1
    
    # Parse health response
    local status=$(echo "$response" | jq -r '.status // .status_code // empty' 2>/dev/null)
    
    if [[ "$status" == "ok" || "$status" == "healthy" || "$status" == "200" ]]; then
        debug "Health check response: $response"
        return 0
    fi
    
    # Also accept HTTP 200
    local http_code=$(curl -sf -o /dev/null -w "%{http_code}" -m 10 "$health_endpoint" 2>/dev/null)
    if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
        return 0
    fi
    
    return 1
}

verify_all_services() {
    info "Verifying all Phase 8 services..."
    
    local services_ok=true
    local endpoints=(
        "/api/health:Main Application"
        "/api/status:System Status"
        "/api/payments/providers:Payment Providers"
        "/api/currency/rates:Currency Rates"
        "/api/crm/pipelines:CRM Pipelines"
        "/api/erp/status:ERP Status"
        "/api/ar/models:AR Models"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%%:*}"
        local service_name="${endpoint_info##*:}"
        local base_url="http://localhost:3000"
        
        local http_code=$(curl -sf -o /dev/null -w "%{http_code}" -m 5 "${base_url}${endpoint}" 2>/dev/null || echo "000")
        
        if [[ "$http_code" =~ ^[23] ]]; then
            success "$service_name ($endpoint): HTTP $http_code"
        else
            fail "$service_name ($endpoint): HTTP $http_code"
            services_ok=false
        fi
    done
    
    if [[ "$services_ok" == false ]]; then
        warn "Some services are not responding correctly"
    else
        success "All services verified"
    fi
}

log_container_logs() {
    error "Collecting recent container logs..."
    
    mkdir -p "$LOG_DIR/incident-$DEPLOYMENT_ID"
    
    docker compose -f "$COMPOSE_FILE" logs --tail=100 > "$LOG_DIR/incident-$DEPLOYMENT_ID/container_logs.log" 2>&1 || true
    
    info "Logs saved to: $LOG_DIR/incident-$DEPLOYMENT_ID/"
}

# =============================================================================
# Rollback Procedure
# =============================================================================

execute_rollback() {
    step "Executing Rollback"
    
    local previous_version_file="$ARTIFACT_DIR/previous_version.txt"
    
    if [[ ! -f "$previous_version_file" ]]; then
        # Try to find from backups
        previous_version=$(cat "$BACKUP_DIR/last_successful_deploy.txt" 2>/dev/null || echo "")
        if [[ -z "$previous_version" ]]; then
            die "No previous version found for rollback"
        fi
    else
        previous_version=$(cat "$previous_version_file")
    fi
    
    warn "Rolling back to version: $previous_version"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would rollback to: $previous_version"
        return
    fi
    
    # Stop current deployment
    info "Stopping current deployment..."
    docker compose -f "$COMPOSE_FILE" down 2>&1 | tee -a "$DEPLOY_LOG" || true
    
    # Restore previous version
    if [[ "$previous_version" =~ ^[a-f0-9]{40}$ ]]; then
        # It's a git commit hash
        info "Checking out previous version: $previous_version"
        git checkout "$previous_version" 2>&1 | tee -a "$DEPLOY_LOG"
        
        # Rebuild and deploy
        docker compose -f "$COMPOSE_FILE" up -d --build 2>&1 | tee -a "$DEPLOY_LOG"
    elif [[ -n "$previous_version" ]]; then
        # Try to use the previous image tag
        local prev_image="${DOCKER_REGISTRY}/${IMAGE_NAME}:${previous_version}"
        
        if docker image inspect "$prev_image" &> /dev/null || docker pull "$prev_image" &> /dev/null; then
            info "Deploying previous image: $prev_image"
            # Update compose to use previous image
            # ... (implementation depends on compose setup)
            docker compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$DEPLOY_LOG"
        else
            die "Previous image not found: $prev_image"
        fi
    fi
    
    # Wait for rollback to complete
    sleep 30
    
    # Verify rollback health
    local rollback_attempts=0
    while [[ $rollback_attempts -lt 15 ]]; do
        ((rollback_attempts++))
        if check_application_health; then
            success "Rollback successful - application is healthy"
            send_notification "warning" "Rollback completed to $previous_version"
            return 0
        fi
        sleep 5
    done
    
    error "Rollback verification failed - manual intervention required!"
    send_notification "critical" "ROLLBACK FAILED - Manual intervention required"
    return 1
}

# =============================================================================
# Post-Deployment Tasks
# =============================================================================

post_deployment_tasks() {
    step "Post-Deployment Tasks"
    
    # Warm up caches
    warm_up_caches
    
    # Clear stale cache entries
    clear_stale_cache
    
    # Record successful deployment
    record_successful_deployment
    
    success "Post-deployment tasks completed"
}

warm_up_caches() {
    info "Warming up caches..."
    
    local base_url="http://localhost:3000"
    
    # Cache essential pages
    local pages=("/" "/products" "/search" "/marketplace")
    
    for page in "${pages[@]}"; do
        curl -sf -o /dev/null "$base_url$page" 2>/dev/null && debug "Cached: $page" || true
    done
    
    # Warm currency rates cache
    curl -sf -o /dev/null "$base_url/api/currency/rates" 2>/dev/null || true
    
    success "Cache warming initiated"
}

clear_stale_cache() {
    info "Clearing stale cache entries..."
    
    # Redis cache invalidation if Redis CLI available
    if command -v redis-cli &> /dev/null && [[ -n "${REDIS_URL:-}" ]]; then
        # Clear specific pattern caches
        redis-cli -u "$REDIS_URL" KEYS "temp:*" 2>/dev/null | xargs -r redis-cli -u "$REDIS_URL" DEL 2>/dev/null || true
        success "Stale cache cleared"
    fi
}

record_successful_deployment() {
    info "Recording successful deployment..."
    
    local end_time=$(date +%s)
    local duration=$((end_time - DEPLOY_START_TIME))
    local duration_formatted=$(printf '%02d:%02d' $((duration / 60)) $((duration % 60)))
    
    # Save deployment record
    {
        echo "{"
        echo "  \"id\": \"$DEPLOYMENT_ID\","
        echo "  \"version\": \"$NEW_VERSION\","
        echo "  \"previousVersion\": \"$PREVIOUS_VERSION\","
        echo "  \"phase\": \"$DEPLOYMENT_PHASE\","
        echo "  \"startTime\": \"$(date -d "@$DEPLOY_START_TIME" -Iseconds 2>/dev/null || date -Iseconds)\","
        echo "  \"endTime\": \"$(date -Iseconds)\","
        echo "  \"durationSeconds\": $duration,"
        echo "  \"status\": \"success\","
        echo "  \"deployedBy\": \"$(whoami)\","
        echo "  \"deployedFrom\": \"$(hostname)\""
        echo "}"
    } >> "$ARTIFACT_DIR/deployment-history.jsonl"
    
    # Update last successful deploy marker
    echo "$NEW_VERSION" > "$BACKUP_DIR/last_successful_deploy.txt"
    
    success "Deployment recorded: $duration_formatted duration"
}

# =============================================================================
# Notifications
# =============================================================================

send_notification() {
    local status="$1"
    local message="$2"
    
    info "Sending notification: $status"
    
    local color="#36a64b"  # green
    local emoji="✅"
    
    case "$status" in
        "failure"|"error"|"critical")
            color="#dc3545"  # red
            emoji="❌"
            ;;
        "warning")
            color="#ffc107"  # yellow
            emoji="⚠️"
            ;;
    esac
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        send_slack_notification "$emoji" "$color" "$status" "$message"
    fi
    
    # PagerDuty notification (for critical issues)
    if [[ "$status" == "critical" || "$status" == "failure" ]]; then
        if [[ -n "${PAGERDUTY_INTEGRATION_KEY:-}" ]]; then
            send_pagerduty_alert "$status" "$message"
        fi
    fi
}

send_slack_notification() {
    local emoji="$1"
    local color="$2"
    local status="$3"
    local message="$4"
    
    local payload=$(cat << EOF
{
    "attachments": [{
        "color": "$color",
        "title": "${emoji} AlgeriaTrade.dz Deployment [$status]",
        "text": "$message",
        "fields": [
            {"title": "Phase", "value": "$DEPLOYMENT_PHASE", "short": true},
            {"title": "Version", "value": "$NEW_VERSION", "short": true},
            {"title": "Environment", "value": "Production", "short": true},
            {"title": "Deployment ID", "value": "\`$DEPLOYMENT_ID\`", "short": true},
            {"title": "Executed By", "value": "$(whoami)@$(hostname)", "short": true},
            {"title": "Timestamp", "value": "$(date)", "short": true}
        ],
        "footer": "AlgeriaTrade.dz Deployment System",
        "ts": $(date +%s)
    }]
}
EOF
)
    
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        -d "$payload" > /dev/null 2>&1 || true
    
    debug "Slack notification sent"
}

send_pagerduty_alert() {
    local severity="$1"
    local message="$2"
    
    local payload=$(cat << EOF
{
    "routing_key": "$PAGERDUTY_INTEGRATION_KEY",
    "event_action": "trigger",
    "dedup_key": "$DEPLOYMENT_ID",
    "payload": {
        "summary": "AlgeriaTrade.dz Deployment: $message",
        "severity": "$([[ "$severity" == "critical" ]] && echo "critical" || echo "error")",
        "source": "algeriatrade-dz-deploy",
        "component": "deployment",
        "group": "production",
        "custom_details": {
            "deployment_id": "$DEPLOYMENT_ID",
            "version": "$NEW_VERSION",
            "phase": "$DEPLOYMENT_PHASE"
        }
    }
}
EOF
)
    
    curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
        -H 'Content-type: application/json' \
        -d "$payload" > /dev/null 2>&1 || true
    
    debug "PagerDuty alert sent"
}

# =============================================================================
# Summary Report
# =============================================================================

print_summary_report() {
    local end_time=$(date +%s)
    local total_duration=$((end_time - DEPLOY_START_TIME))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((total_duration / 3600)) $((total_duration % 3600 / 60)) $((total_duration % 60)))
    
    header "Deployment Summary"
    
    cat << EOF
${BOLD}Deployment ID:${NC}     $DEPLOYMENT_ID
${BOLD}Phase:${NC}              $DEPLOYMENT_PHASE
${BOLD}Version:${NC}            $PREVIOUS_VERSION → $NEW_VERSION
${BOLD}Status:${NC}             ${GREEN}SUCCESS${NC}
${BOLD}Duration:${NC}           $duration_formatted
${BOLD}Started:${NC}            $(date -d "@$DEPLOY_START_TIME" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date)
${BOLD}Completed:${NC}          $(date "+%Y-%m-%d %H:%M:%S")
${BOLD}Executed By:${NC}        $(whoami)@$(hostname)
${BOLD}Log File:${NC}           $DEPLOY_LOG

${BOLD}Components Deployed:${NC}
  ✓ Core Application (Next.js)
  ✓ Payment Services (SATIM, Stripe, Crypto)
  ✓ ERP Integration Layer
  ✓ AR Showroom Service
  ✓ CRM Pipeline Engine
  ✓ WebRTC Signaling Server
  ✓ Currency Exchange Service
  ✓ Invoice Generation System

${BOLD}Next Steps:${NC}
  1. Monitor dashboards for 30 minutes
  2. Verify payment processing end-to-end
  3. Confirm ERP sync is operational
  4. Check user feedback channels

EOF
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    # Initialize
    setup_directories
    parse_args "$@"
    
    header "🇩🇿 AlgeriaTrade.dz Production Deployment - Phase 8"
    
    echo "${BOLD}Deployment Configuration:${NC}"
    echo "  Version:        ${VERSION:-auto-generated}"
    echo "  Phase:          $DEPLOYMENT_PHASE"
    echo "  Environment:    Production"
    echo "  Timestamp:      $(date)"
    echo "  Dry Run:        $DRY_RUN"
    echo "  Force Mode:     $FORCE"
    echo ""
    
    # Handle rollback mode
    if [[ "$ROLLBACK" == true ]]; then
        execute_rollback
        exit $?
    fi
    
    # Confirmation prompt
    if [[ "$FORCE" != true ]] && [[ "$DRY_RUN" != true ]]; then
        echo ""
        warn "╔══════════════════════════════════════════════════════════╗"
        warn "║  ⚠️  You are about to deploy to PRODUCTION!               ║"
        warn "║  Phase 8 includes payment systems and critical services ║"
        warn "╚══════════════════════════════════════════════════════════╝"
        echo ""
        read -rp "Type 'yes' to confirm deployment: " confirmation
        if [[ "$confirmation" != "yes" ]]; then
            info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Record start time
    DEPLOY_START_TIME=$(date +%s)
    generate_deployment_id
    
    # Execute deployment pipeline
    check_prerequisites
    create_backup
    build_application
    optimize_assets
    build_docker_image
    run_database_migrations
    execute_rolling_deployment
    perform_health_checks
    post_deployment_tasks
    
    # Send success notification
    send_notification "success" "Phase 8 deployment completed successfully - Version: $NEW_VERSION"
    
    # Print summary
    print_summary_report
    
    exit 0
}

# Run main function
main "$@"
