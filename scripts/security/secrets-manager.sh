#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz - Production Secrets Management Utility
#
# Secure helper script for managing production secrets:
# - Generate strong random values
# - Validate configuration completeness
# - Check for common security issues
# - Rotate credentials
# - Export for deployment
#
# Usage:
#   ./secrets-manager.sh [command] [options]
#
# Commands:
#   generate    - Generate random values for all required fields
#   validate    - Check .env.production for missing/weak values
#   rotate      - Rotate specific secrets (with backup)
#   export      - Create deployment-ready export (masked)
#   audit       - Full security audit of secrets file
#   diff        - Compare with staging/dev for drift detection
#
# @version 2.0.0
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.production"
ENV_TEMPLATE="${PROJECT_ROOT}/.env.production.template"
BACKUP_DIR="${PROJECT_ROOT}/.secrets-backup"

# ===========================================
# Utility Functions
# ===========================================

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

generate_password() {
    local length=${1:-32}
    # Use /dev/urandom for cryptographically secure random
    LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+-=[]{}|;:,.<>?' < /dev/urandom | head -c "$length"
}

generate_hex() {
    local length=${1:-64}
    openssl rand -hex "$((length / 2))"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command not found: $1"
        exit 1
    fi
}

ensure_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_TEMPLATE" ]]; then
            cp "$ENV_TEMPLATE" "$ENV_FILE"
            log_info "Created .env.production from template"
        else
            log_error "No .env.production or template found"
            exit 1
        fi
    fi
}

backup_secrets() {
    mkdir -p "$BACKUP_DIR"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/env.production.${timestamp}.bak"
    
    cp "$ENV_FILE" "$backup_file"
    chmod 600 "$backup_file"
    
    log_success "Backup created: $backup_file"
    echo "$backup_file"
}

# ===========================================
# Commands
# ===========================================

cmd_generate() {
    log_info "Generating production secrets..."
    
    ensure_env_file
    
    # Generate all required secrets
    local secrets=(
        "NEXTAUTH_SECRET:$(generate_hex 32)"
        "JWT_SECRET:$(generate_hex 48)"
        "SESSION_ENCRYPTION_KEY:$(generate_hex 32)"
        "POSTGRES_PASSWORD:$(generate_password 40)"
        "REDIS_PASSWORD:$(generate_password 32)"
        "CIB_API_KEY:$(generate_hex 24)"
        "CCP_API_KEY:$(generate_hex 24)"
        "BARIDIMOB_API_KEY:$(generate_hex 24)"
        "PAYMENT_ENCRYPTION_KEY:$(generate_hex 64)"
        "PAYMENT_WEBHOOK_SIGNING_SECRET:$(generate_hex 48)"
        "AWS_ACCESS_KEY_ID:AKIA$(openssl rand -hex 8)" # Format example
        "AWS_SECRET_ACCESS_KEY:$(generate_hex 40)"
        "SENTRY_DSN:https://$(openssl rand -hex 16)@o123456.ingest.sentry.io/456789"
        "SLACK_WEBHOOK_URL:https://hooks.slack.com/services/T00000000/B00000000/$(openssl rand -hex 24)"
        "PAGERDUTY_ROUTING_KEY:$(generate_hex 32)"
        "OPENAI_API_KEY:sk-proj-$(openssl rand -hex 48)"
        "HEALTH_CHECK_SECRET:$(generate_hex 32)"
        "BACKUP_ENCRYPTION_KEY:$(generate_hex 64)"
        "ALERT_WEBHOOK_SECRET:$(generate_hex 32)"
    )
    
    for secret in "${secrets[@]}"; do
        local key="${secret%%:*}"
        local value="${secret#*:}"
        
        # Only set if currently has placeholder or is empty
        if grep -q "\\[${key}:.*\\]" "$ENV_FILE" || ! grep -q "^${key}=" "$ENV_FILE"; then
            sed -i "s|\\[${key}:.*\\]|${value}|g" "$ENV_FILE"
            log_success "Generated: $key"
        else
            log_warning "Skipping $key (already configured)"
        fi
    done
    
    # Set proper permissions
    chmod 600 "$ENV_FILE"
    
    log_success "\n✅ Secrets generated successfully!"
    log_warning "⚠️  Review and update any values that require external services (API keys, etc.)"
}

cmd_validate() {
    log_info "Validating production secrets..."
    
    ensure_env_file
    
    local errors=0
    local warnings=0
    
    # Check for required fields with placeholders
    local placeholder_count=$(grep -c '\\[.*\\]' "$ENV_FILE" || true)
    if [[ $placeholder_count -gt 0 ]]; then
        log_error "Found $placeholder_count fields with placeholder values:"
        grep '\\[.*\\]' "$ENV_FILE" | while read -r line; do
            echo "  ❌ ${line%%=*}"
        done
        ((errors++))
    fi
    
    # Check password strength
    while IFS= read -r line; do
        if [[ "$line" =~ ^(.*)PASSWORD=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"
            
            if [[ ${#value} -lt 16 ]]; then
                log_warning "Weak password (length < 16): $key"
                ((warnings++))
            fi
            
            if ! [[ "$value" =~ [A-Z] ]] || ! [[ "$value" =~ [a-z] ]] || \
               ! [[ "$value" =~ [0-9] ]] || ! [[ "$value" =~ [^a-zA-Z0-9] ]]; then
                log_warning "Password lacks complexity: $key"
                ((warnings++))
            fi
        fi
    done < "$ENV_FILE"
    
    # Check for dangerous values
    local dangerous_patterns=(
        "password"
        "changeme"
        "admin"
        "123456"
        "secret"
        "letmein"
        "welcome"
        "password1"
    )
    
    for pattern in "${dangerous_patterns[@]}"; do
        if grep -qi "=${pattern}$\|=${pattern}[\"']" "$ENV_FILE"; then
            log_error "Dangerous value detected: '$pattern'"
            ((errors++))
        fi
    done
    
    # Check file permissions
    local perms=$(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %Lp "$ENV_FILE")
    if [[ "$perms" != "600" ]]; then
        log_error "Insecure file permissions: $perms (should be 600)"
        ((errors++))
    fi
    
    # Check for exposed secrets in git history
    if git -C "$PROJECT_ROOT" log --all --full-history -- ".env.production" &>/dev/null; then
        log_error "Secrets file found in git history!"
        ((errors++))
    fi
    
    # Summary
    echo ""
    if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
        log_success "✅ All checks passed!"
        return 0
    else
        log_error "❌ Validation failed: $errors error(s), $warnings warning(s)"
        return 1
    fi
}

cmd_rotate() {
    local secret_name=${1:-}
    
    if [[ -z "$secret_name" ]]; then
        log_error "Usage: $0 rotate SECRET_NAME"
        log_info "Available secrets to rotate:"
        grep -E "^(NEXTAUTH_SECRET|JWT_SECRET|POSTGRES_PASSWORD|REDIS_PASSWORD|API_KEY|WEBHOOK_SECRET)" "$ENV_FILE" | cut -d= -f1
        exit 1
    fi
    
    log_info "Rotating secret: $secret_name"
    
    # Backup before rotation
    backup_secrets
    
    # Generate new value
    case "$secret_name" in
        *SECRET|*KEY|*TOKEN)
            new_value=$(generate_hex 32)
            ;;
        *PASSWORD)
            new_value=$(generate_password 40)
            ;;
        *)
            new_value=$(generate_hex 32)
            ;;
    esac
    
    # Update the file
    if grep -q "^${secret_name}=" "$ENV_FILE"; then
        sed -i "s|^${secret_name}=.*|${secret_name}=${new_value}|" "$ENV_FILE"
        log_success "Rotated: $secret_name"
        log_warning "Remember to update dependent services!"
    else
        log_error "Secret not found: $secret_name"
        exit 1
    fi
}

cmd_export() {
    log_info "Creating masked export..."
    
    ensure_env_file
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local export_file="${PROJECT_ROOT}/.env.production.exported.${timestamp}.txt"
    
    # Create masked version
    while IFS= read -r line; do
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"
            
            # Mask sensitive values
            if [[ "$key" =~ (PASSWORD|SECRET|KEY|TOKEN) ]]; then
                if [[ ${#value} -gt 8 ]]; then
                    value="${value:0:4}****${value: -4}"
                else
                    value="****"
                fi
            fi
            
            echo "${key}=${value}" >> "$export_file"
        fi
    done < "$ENV_FILE"
    
    chmod 644 "$export_file"
    log_success "Masked export created: $export_file"
}

cmd_audit() {
    log_info "Running full security audit..."
    
    ensure_env_file
    
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║     SECRETS SECURITY AUDIT REPORT        ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    
    # File info
    echo "📁 File Information:"
    echo "   Path: $ENV_FILE"
    echo "   Size: $(du -h "$ENV_FILE" | cut -f1)"
    echo "   Modified: $(stat -c %y "$ENV_FILE" 2>/dev/null || stat -f "%Sm" "$ENV_FILE")"
    echo "   Permissions: $(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f "%Lp" "$ENV_FILE")"
    echo ""
    
    # Count secrets
    local total_secrets=$(grep -cE "^[A-Z_]+=" "$ENV_FILE")
    local filled_secrets=$(total_secrets - $(grep -c '\\[.*\\]' "$ENV_FILE" || true))
    echo "📊 Secret Statistics:"
    echo "   Total variables: $total_secrets"
    echo "   Configured: $filled_secrets"
    echo "   Pending: $((total_secrets - filled_secrets))"
    echo ""
    
    # Run validation
    cmd_validate
    
    # Check for entropy (basic)
    echo ""
    echo "🔐 Password Entropy Analysis:"
    while IFS= read -r line; do
        if [[ "$line" =~ ^(.*)PASSWORD=(.{8,})$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"
            
            # Calculate character set size
            local charset_size=0
            [[ "$value" =~ [A-Z]] && ((charset_size+=26))
            [[ "$value" =~ [a-z]] && ((charset_size+=26))
            [[ "$value" =~ [0-9]] && ((charset_size+=10))
            [[ "$value" =~ [^a-zA-Z0-9]] && ((charset_size+=33))
            
            # Calculate bits of entropy
            local entropy=$(echo "l(${#value}) * l($charset_size) / l(2)" | bc -l 2>/dev/null || echo "N/A")
            
            if [[ "$entropy" != "N/A" ]]; then
                if (( $(echo "$entropy >= 128" | bc -l) )); then
                    echo "   ✅ $key: ${entropy:0:2} bits (strong)"
                elif (( $(echo "$entropy >= 64" | bc -l) )); then
                    echo "   ⚠️  $key: ${entropy:0:2} bits (moderate)"
                else
                    echo "   ❌ $key: ${entropy:0:2} bits (weak)"
                fi
            fi
        fi
    done < "$ENV_FILE"
    
    # Recommendations
    echo ""
    echo "💡 Recommendations:"
    
    if [[ "$(stat -c %a "$ENV_FILE" 2>/dev/null)" != "600" ]]; then
        echo "   → Set file permissions to 600"
    fi
    
    if grep -q '\\[REQUIRED' "$ENV_FILE"; then
        echo "   → Fill in all required fields"
    fi
    
    echo "   → Enable disk encryption on host"
    echo "   → Use secrets manager (Vault, AWS SM) in production"
    echo "   → Implement automatic credential rotation"
    echo "   → Enable audit logging for secret access"
    echo ""
}

cmd_diff() {
    local compare_file=${1:-".env.staging"}
    
    if [[ ! -f "$compare_file" ]]; then
        log_error "Comparison file not found: $compare_file"
        exit 1
    fi
    
    log_info "Comparing $ENV_FILE vs $compare_file"
    
    # Find differences (ignoring comments and empty lines)
    diff <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sort) \
         <(grep -v '^#' "$compare_file" | grep -v '^$' | sort) || true
}

# ===========================================
# Main Entry Point
# ===========================================

main() {
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║  AlgeriaTrade Secrets Manager v2.0       ║"
    echo "║  Secure Configuration Helper             ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    
    local command=${1:-help}
    shift || true
    
    case "$command" in
        generate|gen|g)
            cmd_generate
            ;;
        validate|val|v)
            cmd_validate
            ;;
        rotate|rot|r)
            cmd_rotate "$@"
            ;;
        export|exp|e)
            cmd_export
            ;;
        audit|a)
            cmd_audit
            ;;
        diff|d)
            cmd_diff "$@"
            ;;
        help|--help|-h|h)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  generate    Generate random values for all required secrets"
            echo "  validate    Validate current configuration for security issues"
            echo "  rotate      Rotate a specific secret (creates backup first)"
            echo "  export      Create masked version for sharing/deployment"
            echo "  audit       Full security audit report"
            echo "  diff        Compare with another env file"
            echo "  help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 generate          # Generate all secrets"
            echo "  $0 validate          # Check for issues"
            echo "  $0 rotate POSTGRES_PASSWORD  # Rotate DB password"
            echo "  $0 audit             # Full audit"
            ;;
        *)
            log_error "Unknown command: $command"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"
