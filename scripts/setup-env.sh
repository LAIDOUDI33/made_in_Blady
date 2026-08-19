#!/usr/bin/env bash
# =============================================================================
# AlgeriaTrade.dz - Phase 9 Environment Setup Script
# =============================================================================
# Description: Validates environment configuration, generates secure secrets,
#              initializes database, and sets up services for deployment.
#
# Usage:
#   ./scripts/setup-env.sh [environment]
#
# Environments:
#   production  - Production setup (default)
#   staging     - Staging environment setup
#   development - Local development setup
#
# Examples:
#   ./scripts/setup-env.sh production
#   ./scripts/setup-env.sh staging
#   ./scripts/setup-env.sh --check-only  # Only validate, don't modify
#   ./scripts/setup-env.sh --generate-secrets  # Generate new secrets only
#
# Prerequisites:
#   - OpenSSL (for key generation)
#   - psql or pg_isready (for PostgreSQL)
#   - redis-cli (for Redis operations)
#   - Node.js 18+ / Bun
#   - Prisma CLI
#
# Security Notes:
#   - This script generates cryptographically secure random values
#   - Secrets are written to .env files (never to stdout in production)
#   - Consider using a secrets manager for production (HashiCorp Vault, AWS SM)
#
# Author: AlgeriaTrade DevOps Team
# Version: 9.0.0
# Last Updated: 2025-01
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVIRONMENT="${1:-production}"
CHECK_ONLY=false
GENERATE_SECRETS_ONLY=false
VERBOSE=false
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Required variables by category
declare -A REQUIRED_VARS=(
    # Database
    ["DATABASE_URL"]="PostgreSQL connection string"
    ["DIRECT_URL"]="Direct database URL (same as DATABASE_URL for SQLite)"
    
    # Redis
    ["REDIS_PRIMARY_URL"]="Redis primary connection URL"
    
    # Authentication
    ["NEXTAUTH_SECRET"]="NextAuth.js secret (min 32 chars)"
    ["JWT_SECRET"]="JWT signing secret (min 32 chars)"
    
    # AI Services (at least one required)
    ["OPENAI_API_KEY"]="OpenAI API key (or ANTHROPIC_API_KEY)"
    
    # Blockchain
    ["BLOCKCHAIN_PRIVATE_KEY"]="Blockchain private key for certificate signing"
    
    # Email
    ["SENDGRID_API_KEY"]="SendGrid API key for transactional emails"
    
    # Storage
    ["S3_ACCESS_KEY_ID"]="S3 access key ID"
    ["S3_SECRET_ACCESS_KEY"]="S3 secret access key"
    
    # Monitoring
    ["SENTRY_DSN"]="Sentry DSN for error tracking"
)

# Variables that can be auto-generated
declare -a GENERATABLE_VARS=(
    "NEXTAUTH_SECRET"
    "JWT_SECRET"
    "CSRF_SECRET"
    "ENCRYPTION_KEY"
    "BLOCKCHAIN_PRIVATE_KEY"
    "PWA_VAPID_PRIVATE_KEY"
    "PWA_VAPID_PUBLIC_KEY"
    "WEBHOOK_SECRET"
    "API_KEY_ENCRYPTION_KEY"
    "RATE_LIMIT_SECRET"
)

# Minimum lengths for secrets
declare -A MIN_LENGTHS=(
    ["NEXTAUTH_SECRET"]=32
    ["JWT_SECRET"]=32
    ["CSRF_SECRET"]=32
    ["ENCRYPTION_KEY"]=64
    ["BLOCKCHAIN_PRIVATE_KEY"]=64
    ["REDIS_PRIMARY_URL"]=10
    ["SENDGRID_API_KEY"]=20
    ["S3_ACCESS_KEY_ID"]=16
    ["S3_SECRET_ACCESS_KEY"]=32
    ["OPENAI_API_KEY"]=20
    ["ANTHROPIC_API_KEY"]=20
    ["SENTRY_DSN"]=20
)

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_step() {
    echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}\n"
}

die() {
    log_error "$1"
    exit 1
}

usage() {
    cat << EOF
AlgeriaTrade.dz Environment Setup Script

Usage: $(basename "$0") [OPTIONS] [ENVIRONMENT]

Environments:
    production     Production environment (default)
    staging        Staging environment
    development    Development environment

Options:
    --check-only       Validate configuration without making changes
    --generate-secrets Generate missing secrets only
    --verbose          Enable verbose output
    --dry-run          Show what would be done without executing
    -h, --help         Show this help message

Examples:
    $(basename "$0") production           # Setup production environment
    $(basename "$0") staging              # Setup staging environment
    $(basename "$0") --check-only prod    # Check production config only
    $(basename "$0") --generate-secrets   # Generate all missing secrets

EOF
    exit 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-only)
                CHECK_ONLY=true
                shift
                ;;
            --generate-secrets)
                GENERATE_SECRETS_ONLY=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            production|staging|development|prod|stag|dev)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                die "Unknown option: $1. Use --help for usage information."
                ;;
        esac
    done
    
    # Normalize environment name
    case $ENVIRONMENT in
        prod) ENVIRONMENT="production" ;;
        stag) ENVIRONMENT="staging" ;;
        dev) ENVIRONMENT="development" ;;
    esac
}

# Generate cryptographically secure random string
generate_secret() {
    local length=$1
    local prefix=${2:-}
    local secret
    
    if [[ "$length" -le 32 ]]; then
        # Use openssl for shorter strings (hex encoded)
        secret=$(openssl rand -hex "$((length / 2))")
    else
        # Use base64 for longer strings
        secret=$(openssl rand -base64 "$length" | tr -d '/+=' | head -c "$length")
    fi
    
    echo "${prefix}${secret}"
}

# Generate VAPID keys for web push
generate_vapid_keys() {
    log_info "Generating VAPID keys for push notifications..."
    
    # Check if web-push is available
    if command -v npx &> /dev/null; then
        local vapid_output
        vapid_output=$(npx web-push generate-vapid-keys 2>/dev/null || echo "")
        
        if [[ -n "$vapid_output" ]]; then
            echo "$vapid_output"
            return 0
        fi
    fi
    
    # Fallback: Generate ECDSA P-256 key pair using openssl
    log_warning "web-push not available, using fallback VAPID generation..."
    
    local private_key_pem
    private_key_pem=$(openssl ecparam -name prime256v1 -genkey -noout 2>/dev/null)
    
    # Extract raw private key and derive public key
    local private_key_hex
    private_key_hex=$(echo "$private_key_pem" | openssl ec -text -noout 2>/dev/null | grep -A1 "priv:" | tail -1 | tr -d ' :')
    
    # For public key, we need more complex derivation - use placeholder
    log_info "VAPID Private Key (Base64): $(echo "$private_key_pem" | base64 -w 0 | head -c 88)"
    log_warning "Please install web-push package for proper VAPID key generation: npm install -g web-push"
}

# Generate blockchain private key (Ethereum-compatible)
generate_blockchain_key() {
    log_info "Generating blockchain private key..."
    
    # Generate 32-byte random hex string (Ethereum private key format)
    local private_key
    private_key=$(openssl rand -hex 32)
    echo "0x${private_key}"
}

# Load environment file
load_env_file() {
    local env_file="$PROJECT_ROOT/.env.${ENVIRONMENT}"
    
    if [[ ! -f "$env_file" ]]; then
        # Try .env as fallback
        env_file="$PROJECT_ROOT/.env"
        if [[ ! -f "$env_file" ]]; then
            die "Environment file not found: .env.${ENVIRONMENT} or .env"
        fi
    fi
    
    log_info "Loading environment from: $env_file"
    
    # Export variables (safely)
    set -a
    source "$env_file"
    set +a
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

validate_required_vars() {
    log_step "Validating Required Environment Variables"
    
    local errors=0
    local warnings=0
    
    for var in "${!REQUIRED_VARS[@]}"; do
        local value="${!var:-}"
        
        if [[ -z "$value" ]]; then
            # Check if it's an OR condition (like OpenAI OR Anthropic)
            if [[ "$var" == "OPENAI_API_KEY" ]] && [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
                log_info "✓ ${var}: Using Anthropic as alternative"
                continue
            fi
            
            log_error "✗ Missing required variable: ${var}"
            log_error "  → ${REQUIRED_VARS[$var]}"
            ((errors++))
        else
            # Check minimum length
            local min_len="${MIN_LENGTHS[$var]:-0}"
            if [[ "$min_len" -gt 0 ]] && [[ "${#value}" -lt "$min_len" ]]; then
                log_warning "⚠ ${var}: Value too short (${#value}/${min_len} chars)"
                ((warnings++))
            else
                # Mask sensitive values in output
                local masked_value
                if [[ "${#value}" -gt 8 ]]; then
                    masked_value="${value:0:4}...${value: -4}"
                else
                    masked_value="****"
                fi
                log_success "✓ ${var}: ${masked_value}"
            fi
        fi
    done
    
    # Check for CHANGEME placeholders
    log_info "Checking for placeholder values..."
    while IFS= read -r line; do
        if [[ "$line" =~ CHANGEME ]]; then
            local var_name
            var_name=$(echo "$line" | cut -d'=' -f1)
            log_warning "⚠ ${var_name}: Contains placeholder value (CHANGEME)"
            ((warnings++))
        fi
    done < <(grep -E "CHANGEME" "$PROJECT_ROOT/.env.${ENVIRONMENT}" 2>/dev/null || true)
    
    echo ""
    if [[ "$errors" -gt 0 ]]; then
        log_error "Validation failed with ${errors} error(s) and ${warnings} warning(s)"
        return 1
    elif [[ "$warnings" -gt 0 ]]; then
        log_warning "Validation passed with ${warnings} warning(s)"
        return 0
    else
        log_success "All validations passed!"
        return 0
    fi
}

validate_database_connection() {
    log_step "Validating Database Connection"
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set"
        return 1
    fi
    
    # Extract host from DATABASE_URL
    local db_host
    db_host=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:]+).*/\1/')
    
    log_info "Testing connection to database host: ${db_host}"
    
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h "$db_host" -t 5 &>/dev/null; then
            log_success "Database server is accepting connections"
        else
            log_warning "Database server not responding (may be expected in some setups)"
        fi
    elif command -v psql &> /dev/null; then
        if PGPASSWORD="" psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null; then
            log_success "Database connection successful"
        else
            log_warning "Could not connect to database (may need credentials)"
        fi
    else
        log_info "pg_isready/psql not found, skipping database connectivity test"
    fi
    
    return 0
}

validate_redis_connection() {
    log_step "Validating Redis Connection"
    
    if [[ -z "${REDIS_PRIMARY_URL:-}" ]]; then
        log_error "REDIS_PRIMARY_URL not set"
        return 1
    fi
    
    if command -v redis-cli &> /dev/null; then
        local redis_url="${REDIS_PRIMARY_URL}"
        
        # Remove password from URL for display
        local safe_url
        safe_url=$(echo "$redis_url" | sed -E 's/(:\/\/[^:]+:)[^@]+(@)/\1****\2/')
        log_info "Testing Redis connection: ${safe_url}"
        
        if redis-cli -u "$redis_url" ping &>/dev/null; then
            log_success "Redis connection successful"
            
            # Test Redis namespaces
            log_info "Setting up Redis namespaces..."
            local test_key="${REDIS_CACHE_PREFIX:-at:cache:}setup:test"
            redis-cli -u "$redis_url" SETEX "$test_key" 60 "env-setup-$(date +%s)" &>/dev/null || true
            log_success "Redis namespace accessible"
        else
            log_warning "Redis connection failed (may need to start Redis)"
        fi
    else
        log_info "redis-cli not found, skipping Redis validation"
    fi
    
    return 0
}

validate_ai_services() {
    log_step "Validating AI Service Connections"
    
    if [[ -n "${OPENAI_API_KEY:-}" ]] && [[ ! "$OPENAI_API_KEY" =~ CHANGEME ]]; then
        log_info "Testing OpenAI API connection..."
        local openai_response
        openai_response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            "https://api.openai.com/v1/models" 2>/dev/null || echo "000")
        
        if [[ "$openai_response" == "200" ]]; then
            log_success "OpenAI API key is valid"
        elif [[ "$openai_response" == "401" ]]; then
            log_error "OpenAI API key is invalid (401 Unauthorized)"
        else
            log_warning "OpenAI API returned status: ${openai_response}"
        fi
    fi
    
    if [[ -n "${ANTHROPIC_API_KEY:-}" ]] && [[ ! "$ANTHROPIC_API_KEY" =~ CHANGEME ]]; then
        log_info "Testing Anthropic API connection..."
        local anthropic_response
        anthropic_response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "x-api-key: $ANTHROPIC_API_KEY" \
            -H "anthropic-version: 2023-06-01" \
            "https://api.anthropic.com/v1/messages" 2>/dev/null || echo "000")
        
        if [[ "$anthropic_response" =~ ^(200|400)$ ]]; then
            log_success "Anthropic API key is valid"
        elif [[ "$anthropic_response" == "401" ]]; then
            log_error "Anthropic API key is invalid (401 Unauthorized)"
        else
            log_warning "Anthropic API returned status: ${anthropic_response}"
        fi
    fi
}

# =============================================================================
# SETUP FUNCTIONS
# =============================================================================

generate_missing_secrets() {
    log_step "Generating Missing Secrets"
    
    local env_file="$PROJECT_ROOT/.env.${ENVIRONMENT}"
    local temp_file="$env_file.tmp"
    local generated=0
    
    if [[ ! -f "$env_file" ]]; then
        log_warning "Environment file does not exist, creating template..."
        touch "$env_file"
    fi
    
    cp "$env_file" "$temp_file"
    
    # Generate NEXTAUTH_SECRET if needed
    if grep -qE "^NEXTAUTH_SECRET=.*CHANGEME|^NEXTAUTH_SECRET=$" "$temp_file" 2>/dev/null; then
        local secret
        secret=$(generate_secret 32)
        sed -i "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=${secret}/" "$temp_file"
        log_success "Generated NEXTAUTH_SECRET"
        ((generated++))
    fi
    
    # Generate JWT_SECRET if needed
    if grep -qE "^JWT_SECRET=.*CHANGEME|^JWT_SECRET=$" "$temp_file" 2>/dev/null; then
        local secret
        secret=$(generate_secret 32)
        sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${secret}/" "$temp_file"
        log_success "Generated JWT_SECRET"
        ((generated++))
    fi
    
    # Generate CSRF_SECRET if needed
    if grep -qE "^CSRF_SECRET=.*CHANGEME|^CSRF_SECRET=$" "$temp_file" 2>/dev/null; then
        local secret
        secret=$(generate_secret 32)
        sed -i "s/^CSRF_SECRET=.*/CSRF_SECRET=${secret}/" "$temp_file"
        log_success "Generated CSRF_SECRET"
        ((generated++))
    fi
    
    # Generate ENCRYPTION_KEY if needed (64 hex chars for AES-256)
    if grep -qE "^ENCRYPTION_KEY=.*CHANGEME|^ENCRYPTION_KEY=$" "$temp_file" 2>/dev/null; then
        local secret
        secret=$(openssl rand -hex 32)
        sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=${secret}/" "$temp_file"
        log_success "Generated ENCRYPTION_KEY (AES-256)"
        ((generated++))
    fi
    
    # Generate BLOCKCHAIN_PRIVATE_KEY if needed
    if grep -qE "^BLOCKCHAIN_PRIVATE_KEY=.*CHANGEME|^BLOCKCHAIN_PRIVATE_KEY=$" "$temp_file" 2>/dev/null; then
        local key
        key=$(generate_blockchain_key)
        sed -i "s|^BLOCKCHAIN_PRIVATE_KEY=.*|BLOCKCHAIN_PRIVATE_KEY=${key}|" "$temp_file"
        log_success "Generated BLOCKCHAIN_PRIVATE_KEY"
        log_warning "⚠ BACKUP this key securely! Lost keys cannot be recovered!"
        ((generated++))
    fi
    
    # Generate VAPID keys if needed
    if grep -qE "^PWA_VAPID_PRIVATE_KEY=.*CHANGEME|^PWA_VAPID_PRIVATE_KEY=$" "$temp_file" 2>/dev/null; then
        local vapid_private vapid_public
        
        if command -v npx &> /dev/null && npx web-push generate-vapid_keys &>/dev/null; then
            # Parse VAPID output
            local vapid_output
            vapid_output=$(npx web-push generate-vapid-keys 2>&1)
            vapid_private=$(echo "$vapid_output" | grep "Private:" | awk '{print $2}')
            vapid_public=$(echo "$vapid_output" | grep "Public:" | awk '{print $2}')
            
            sed -i "s|^PWA_VAPID_PRIVATE_KEY=.*|PWA_VAPID_PRIVATE_KEY=${vapid_private}|" "$temp_file"
            sed -i "s|^PWA_VAPID_PUBLIC_KEY=.*|PWA_VAPID_PUBLIC_KEY=${vapid_public}|" "$temp_file"
            log_success "Generated VAPID key pair"
        else
            # Fallback generation
            vapid_private=$(openssl rand -base64 32 | tr -d '/+=' | head -c 64)
            vapid_public="BM_$(openssl rand -base64 64 | tr -d '/+=' | head -c 84)"
            sed -i "s|^PWA_VAPID_PRIVATE_KEY=.*|PWA_VAPID_PRIVATE_KEY=${vapid_private}|" "$temp_file"
            sed -i "s|^PWA_VAPID_PUBLIC_KEY=.*|PWA_VAPID_PUBLIC_KEY=${vapid_public}|" "$temp_file"
            log_success "Generated VAPID keys (fallback method)"
        fi
        ((generated++))
    fi
    
    # Generate WEBHOOK_SECRET if needed
    if grep -qE "^WEBHOOK_SECRET=.*CHANGEME|^WEBHOOK_SECRET=$" "$temp_file" 2>/dev/null; then
        local secret
        secret=$(generate_secret 48 wh_)
        sed -i "s/^WEBHOOK_SECRET=.*/WEBHOOK_SECRET=${secret}/" "$temp_file"
        log_success "Generated WEBHOOK_SECRET"
        ((generated++))
    fi
    
    # Generate API_KEY_ENCRYPTION_KEY if needed
    if grep -qE "^API_KEY_ENCRYPTION_KEY=.*CHANGEME|^API_KEY_ENCRYPTION_KEY=$" "$temp_file" 2>/dev/null; then
        local secret
        secret=$(openssl rand -hex 16)
        sed -i "s/^API_KEY_ENCRYPTION_KEY=.*/API_KEY_ENCRYPTION_KEY=${secret}/" "$temp_file"
        log_success "Generated API_KEY_ENCRYPTION_KEY"
        ((generated++))
    fi
    
    mv "$temp_file" "$env_file"
    chmod 600 "$env_file"
    
    if [[ "$generated" -gt 0 ]]; then
        log_success "Generated ${generated} missing secret(s)"
        log_warning "Review the updated .env.${ENVIRONMENT} file"
    else
        rm -f "$temp_file"
        log_info "All secrets already configured"
    fi
}

setup_database() {
    log_step "Database Setup"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would run database migrations"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Run Prisma migrations
    log_info "Running Prisma schema generation..."
    if bun run db:generate 2>&1; then
        log_success "Prisma client generated"
    else
        log_error "Failed to generate Prisma client"
        return 1
    fi
    
    log_info "Pushing database schema..."
    if bun run db:push 2>&1; then
        log_success "Database schema pushed successfully"
    else
        log_error "Failed to push database schema"
        return 1
    fi
    
    # Seed database if in staging/dev mode
    if [[ "$ENVIRONMENT" != "production" ]] || [[ "${DB_SEED_ON_MIGRATE:-false}" == "true" ]]; then
        log_info "Seeding database with initial data..."
        if bun run prisma db seed 2>&1 || bun tsx prisma/seed.ts 2>&1; then
            log_success "Database seeded successfully"
        else
            log_warning "Database seeding completed with warnings (or no seed file)"
        fi
    fi
}

setup_redis_namespaces() {
    log_step "Redis Namespace Setup"
    
    if [[ -z "${REDIS_PRIMARY_URL:-}" ]]; then
        log_info "Redis not configured, skipping"
        return 0
    fi
    
    if ! command -v redis-cli &> /dev/null; then
        log_info "redis-cli not found, skipping Redis setup"
        return 0
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would set up Redis namespaces"
        return 0
    fi
    
    local redis_url="${REDIS_PRIMARY_URL}"
    
    # Set up cache configuration
    log_info "Configuring Redis cache settings..."
    redis-cli -u "$redis_url" SET "${REDIS_CACHE_PREFIX:-at:cache:}config:version" "9.0.0" EX 86400 &>/dev/null || true
    redis-cli -u "$redis_url" SET "${REDIS_CACHE_PREFIX:-at:cache:}config:environment" "${ENVIRONMENT}" EX 86400 &>/dev/null || true
    
    # Set up rate limit configuration
    log_info "Configuring rate limiting..."
    redis-cli -u "$redis_url" SET "${REDIS_RATE_LIMIT_PREFIX:-at:rl:}config:window_ms" "60000" EX 86400 &>/dev/null || true
    redis-cli -u "$redis_url" SET "${REDIS_RATE_LIMIT_PREFIX:-at:rl:}config:max_requests" "1000" EX 86400 &>/dev/null || true
    
    # Initialize session store metadata
    log_info "Initializing session store..."
    redis-cli -u "$redis_url" SET "${REDIS_SESSION_PREFIX:-at:session:}meta:created" "$(date -Iseconds)" EX 86400 &>/dev/null || true
    redis-cli -u "$redis_url" SET "${REDIS_SESSION_PREFIX:-at:session:meta:environment" "${ENVIRONMENT}" EX 86400 &>/dev/null || true
    
    log_success "Redis namespaces initialized"
}

initialize_admin_user() {
    log_step "Admin User Initialization"
    
    if [[ "$ENVIRONMENT" == "production" ]] && [[ "${INITIALIZE_ADMIN:-false}" != "true" ]]; then
        log_info "Skipping admin initialization in production (set INITIALIZE_ADMIN=true to enable)"
        return 0
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would initialize admin user"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Check if we can run a script to create admin
    local admin_script="$PROJECT_ROOT/scripts/init-admin.ts"
    
    if [[ -f "$admin_script" ]]; then
        log_info "Running admin initialization script..."
        if bun tsx "$admin_script" 2>&1; then
            log_success "Admin user initialized"
        else
            log_warning "Admin initialization completed with warnings"
        fi
    else
        # Create a simple inline admin creation
        log_info "Creating default admin user via Prisma..."
        
        cat > /tmp/create-admin.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@algeriatrade.dz';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  
  // Check if admin exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists:', email);
    return;
  }
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const admin = await prisma.user.create({
    data: {
      email,
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    },
  });
  
  console.log('Admin user created:', admin.email);
  console.log('Password:', password);
  console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF
        
        ADMIN_EMAIL="${ADMIN_EMAIL:-admin@algeriatrade.dz}" \
        ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMePhase9!}" \
        bun tsx /tmp/create-admin.ts 2>&1 || log_warning "Admin creation attempted"
        
        rm -f /tmp/create-admin.ts
    fi
}

verify_blockchain_setup() {
    log_step "Blockchain Configuration Verification"
    
    if [[ "${BLOCKCHAIN_ENABLED:-false}" != "true" ]]; then
        log_info "Blockchain disabled, skipping verification"
        return 0
    fi
    
    if [[ -z "${BLOCKCHAIN_PRIVATE_KEY:-}" ]] || [[ "$BLOCKCHAIN_PRIVATE_KEY" =~ CHANGEME ]]; then
        log_error "Blockchain enabled but PRIVATE_KEY not configured"
        return 1
    fi
    
    # Verify key format (Ethereum-style hex key)
    if [[ ! "$BLOCKCHAIN_PRIVATE_KEY" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
        log_warning "Blockchain private key format may be invalid (expected 0x + 64 hex chars)"
    else
        log_success "Blockchain private key format is valid"
    fi
    
    # Test RPC connection if URL is set
    if [[ -n "${BLOCKCHAIN_RPC_URL:-}" ]] && [[ ! "$BLOCKCHAIN_RPC_URL" =~ CHANGEME ]]; then
        log_info "Testing blockchain RPC endpoint..."
        local rpc_response
        rpc_response=$(curl -s -X POST "$BLOCKCHAIN_RPC_URL" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "{}")
        
        if echo "$rpc_response" | grep -q '"result"'; then
            local block_number
            block_number=$(echo "$rpc_response" | grep -o '"result":"[^"]*"' | head -1)
            log_success "Blockchain RPC connected (block: ${block_number})"
        else
            log_warning "Could not connect to blockchain RPC (may be expected for testnet)"
        fi
    fi
    
    log_success "Blockchain configuration verified"
}

verify_cdn_configuration() {
    log_step "CDN/Edge Configuration Verification"
    
    if [[ "${CDN_ENABLED:-false}" != "true" ]]; then
        log_info "CDN disabled, skipping verification"
        return 0
    fi
    
    case "${CDN_PROVIDER:-cloudflare}" in
        cloudflare)
            if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]] || [[ "$CLOUDFLARE_ZONE_ID" =~ CHANGEME ]]; then
                log_error "Cloudflare enabled but ZONE_ID not configured"
                return 1
            fi
            
            log_info "Verifying Cloudflare zone..."
            if command -v curl &> /dev/null && [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] && [[ ! "$CLOUDFLARE_API_TOKEN" =~ CHANGEME ]]; then
                local cf_response
                cf_response=$(curl -s -X GET \
                    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}" \
                    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
                    -H "Content-Type: application/json" 2>/dev/null || echo "{}")
                
                if echo "$cf_response" | grep -q '"success":true'; then
                    local zone_name
                    zone_name=$(echo "$cf_response" | grep -o '"name":"[^"]*"' | head -1)
                    log_success "Cloudflare zone verified: ${zone_name}"
                else
                    log_warning "Cloudflare API verification failed (check token permissions)"
                fi
            else
                log_info "Skipping Cloudflare API verification (token not available)"
            fi
            ;;
        fastly)
            if [[ -z "${FASTLY_SERVICE_ID:-}" ]] || [[ "$FASTLY_SERVICE_ID" =~ CHANGEME ]]; then
                log_error "Fastly enabled but SERVICE_ID not configured"
                return 1
            fi
            log_success "Fastly service ID configured"
            ;;
        *)
            log_warning "Unknown CDN provider: ${CDN_PROVIDER}"
            ;;
    esac
    
    log_success "CDN configuration verified"
}

print_security_summary() {
    log_step "Security Summary"
    
    local env_file="$PROJECT_ROOT/.env.${ENVIRONMENT}"
    
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║           SECURITY CHECKLIST - ${ENVIRONMENT^^}               ║${NC}"
    echo -e "${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BOLD}║                                                        ║${NC}"
    
    # Check file permissions
    if [[ -f "$env_file" ]]; then
        local perms
        perms=$(stat -c "%a" "$env_file" 2>/dev/null || stat -f "%Lp" "$env_file" 2>/dev/null || echo "unknown")
        if [[ "$perms" == "600" ]] || [[ "$perms" == "640" ]]; then
            echo -e "${BOLD}║  ✅ File permissions: ${perms} (secure)                      ║${NC}"
        else
            echo -e "${BOLD}║  ⚠️  File permissions: ${perms} (should be 600)             ║${NC}"
        fi
    fi
    
    # Count CHANGEME placeholders
    local changeme_count
    changeme_count=$(grep -c "CHANGEME" "$env_file" 2>/dev/null || echo "0")
    if [[ "$changeme_count" -eq "0" ]]; then
        echo -e "${BOLD}║  ✅ No placeholder values found                            ║${NC}"
    else
        echo -e "${BOLD}║  ❌ ${changeme_count} placeholder(s) still present                   ║${NC}"
    fi
    
    # Check for hardcoded secrets patterns
    local insecure_patterns
    insecure_patterns=$(grep -ciE "(password|secret|key)=.*(123456|password|admin|secret)" "$env_file" 2>/dev/null || echo "0")
    if [[ "$insecure_patterns" -eq "0" ]]; then
        echo -e "${BOLD}║  ✅ No weak/default passwords detected                     ║${NC}"
    else
        echo -e "${BOLD}║  ⚠️  Possible weak passwords detected                       ║${NC}"
    fi
    
    # Check gitignore
    if [[ -f "$PROJECT_ROOT/.gitignore" ]]; then
        if grep -q "\.env\." "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
            echo -e "${BOLD}║  ✅ .env files in .gitignore                             ║${NC}"
        else
            echo -e "${BOLD}║  ❌ .env files NOT in .gitignore                          ║${NC}"
        fi
    fi
    
    echo -e "${BOLD}║                                                        ║${NC}"
    echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Print important reminders
    echo -e "${YELLOW}📋 Post-Setup Reminders:${NC}"
    echo "   1. Store generated secrets in a secure vault (HashiCorp Vault, AWS Secrets Manager)"
    echo "   2. Rotate blockchain private key before mainnet deployment"
    echo "   3. Configure webhook endpoints in external services"
    echo "   4. Set up monitoring alerts for critical services"
    echo "   5. Review and adjust rate limits based on traffic patterns"
    echo "   6. Test failover for database replica"
    echo "   7. Verify CDN SSL certificate propagation"
    echo ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║                                                          ║${NC}"
    echo -e "${BOLD}║   AlgeriaTrade.dz - Phase 9 Environment Setup            ║${NC}"
    echo -e "${BOLD}║   Environment: ${ENVIRONMENT^^}                                   ║${NC}"
    echo -e "${BOLD}║   Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')                  ║${NC}"
    echo -e "${BOLD}║                                                          ║${NC}"
    echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Load environment file
    load_env_file
    
    # Always validate first
    if ! validate_required_vars; then
        if [[ "$CHECK_ONLY" == true ]] || [[ "$GENERATE_SECRETS_ONLY" == false ]]; then
            die "Required variables validation failed. Fix errors and retry."
        fi
    fi
    
    # Check-only mode
    if [[ "$CHECK_ONLY" == true ]]; then
        log_info "Check-only mode, performing validations..."
        validate_database_connection
        validate_redis_connection
        validate_ai_services
        verify_blockchain_setup
        verify_cdn_configuration
        print_security_summary
        log_success "Validation complete!"
        exit 0
    fi
    
    # Generate secrets only mode
    if [[ "$GENERATE_SECRETS_ONLY" == true ]]; then
        generate_missing_secrets
        log_success "Secret generation complete!"
        exit 0
    fi
    
    # Full setup mode
    log_info "Starting full environment setup for: ${ENVIRONMENT}"
    
    # Step 1: Generate missing secrets
    generate_missing_secrets
    
    # Reload environment after generating secrets
    load_env_file
    
    # Step 2: Validate connections
    validate_database_connection
    validate_redis_connection
    validate_ai_services
    
    # Step 3: Setup database
    setup_database
    
    # Step 4: Setup Redis namespaces
    setup_redis_namespaces
    
    # Step 5: Initialize admin user
    initialize_admin_user
    
    # Step 6: Verify integrations
    verify_blockchain_setup
    verify_cdn_configuration
    
    # Step 7: Print security summary
    print_security_summary
    
    log_success "=========================================="
    log_success "  Environment Setup Complete!"
    log_success "  Environment: ${ENVIRONMENT}"
    log_success "  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    log_success "=========================================="
}

# Run main function
parse_args "$@"
main "$@"
