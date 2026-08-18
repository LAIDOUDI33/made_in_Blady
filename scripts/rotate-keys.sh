#!/bin/bash

# =============================================================================
# AlgeriaTrade.dz - Secure Key Rotation Script
# =============================================================================
#
# This script provides secure rotation of API keys and secrets for all payment
# providers without downtime. It creates backups, validates new keys, and
# performs atomic updates.
#
# Usage:
#   ./scripts/rotate-keys.sh --provider <provider> [--dry-run] [--backup-only]
#   ./scripts/rotate-keys.sh --all [--dry-run]
#   ./scripts/rotate-keys.sh --list
#   ./scripts/rotate-keys.sh --restore <backup-file>
#
# Examples:
#   ./scripts/rotate-keys.sh --provider stripe --dry-run    # Test run for Stripe
#   ./scripts/rotate-keys.sh --provider satim               # Rotate SATIM keys
#   ./scripts/rotate-keys.sh --all                          # Rotate all keys
#   ./scripts/rotate-keys.sh --list                         # List current status
#
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Files
ENV_PRODUCTION="$PROJECT_ROOT/.env.production"
ENV_STAGING="$PROJECT_ROOT/.env.staging"
BACKUP_DIR="$PROJECT_ROOT/backups/secrets"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Provider configurations
declare -A PROVIDER_KEYS
PROVIDER_KEYS[satim]="SATIM_MERCHANT_ID SATIM_API_KEY SATIM_API_SECRET SATIM_WEBHOOK_SECRET"
PROVIDER_KEYS[stripe]="STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET"
PROVIDER_KEYS[crypto]="USDT_TRC20_WALLET_ADDRESS USDT_ERC20_WALLET_ADDRESS BTC_WALLET_ADDRESS ETH_WALLET_ADDRESS CRYPTO_WEBHOOK_SECRET"
PROVIDER_KEYS[exchange]="FIXER_API_KEY COINGECKO_API_KEY EXCHANGERATE_API_KEY"
PROVIDER_KEYS[security]="JWT_SECRET ENCRYPTION_KEY SESSION_SECRET"

# =============================================================================
# Utility Functions
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
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    local missing_deps=()
    
    command -v openssl >/dev/null 2>&1 || missing_deps+=("openssl")
    command -v sed >/dev/null 2>&1 || missing_deps+=("sed")
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
}

create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        # Restrict permissions to owner only
        chmod 700 "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# =============================================================================
# Backup Functions
# =============================================================================

create_backup() {
    local provider="${1:-all}"
    local backup_file="$BACKUP_DIR/env_backup_${provider}_${TIMESTAMP}.enc"
    
    create_backup_dir
    
    log_info "Creating backup for provider: $provider"
    
    if [ ! -f "$ENV_PRODUCTION" ]; then
        log_error "Production environment file not found: $ENV_PRODUCTION"
        return 1
    fi
    
    # Create encrypted backup
    # Generate a temporary encryption key
    local temp_key=$(openssl rand -hex 32)
    
    # Encrypt the env file (or relevant section)
    if [ "$provider" = "all" ]; then
        openssl enc -aes-256-cbc -salt -pbkdf2 \
            -in "$ENV_PRODUCTION" \
            -out "$backup_file" \
            -pass "pass:$temp_key" \
            2>/dev/null || {
                log_error "Failed to create encrypted backup"
                return 1
            }
        
        # Store the decryption key separately (in production, use a proper secret manager)
        echo "$temp_key" > "$backup_file.key"
        chmod 600 "$backup_file.key"
    else
        # Extract provider-specific keys and backup
        local temp_file=$(mktemp)
        grep -E "^($(echo ${PROVIDER_KEYS[$provider]} | tr ' ' '|'))=" "$ENV_PRODUCTION" > "$temp_file" 2>/dev/null || true
        
        if [ -s "$temp_file" ]; then
            openssl enc -aes-256-cbc -salt -pbkdf2 \
                -in "$temp_file" \
                -out "$backup_file" \
                -pass "pass:$temp_key" \
                2>/dev/null
            
            echo "$temp_key" > "$backup_file.key"
            chmod 600 "$backup_file.key"
        else
            log_warning "No keys found for provider: $provider"
            rm -f "$temp_file"
            return 0
        fi
        
        rm -f "$temp_file"
    fi
    
    chmod 600 "$backup_file"
    log_success "Backup created: $backup_file"
    echo "$backup_file"
}

restore_backup() {
    local backup_file="$1"
    local key_file="${backup_file}.key"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    if [ ! -f "$key_file" ]; then
        log_error "Key file not found: $key_file"
        return 1
    fi
    
    local temp_key=$(cat "$key_file")
    local restored_file=$(mktemp)
    
    openssl enc -aes-256-cbc -d -pbkdf2 \
        -in "$backup_file" \
        -out "$restored_file" \
        -pass "pass:$temp_key" \
        2>/dev/null || {
            log_error "Failed to decrypt backup"
            rm -f "$restored_file"
            return 1
        }
    
    log_success "Restored to: $restored_file"
    log_info "Review the file and manually merge into $ENV_PRODUCTION"
}

list_backups() {
    create_backup_dir
    
    log_info "Available backups:"
    echo ""
    
    if [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_warning "No backups found"
        return 0
    fi
    
    ls -lah "$BACKUP_DIR"/*.enc 2>/dev/null | while read line; do
        echo "  $line"
    done
}

# =============================================================================
# Key Rotation Functions
# =============================================================================

generate_new_secret() {
    local type="${1:-generic}"
    
    case "$type" in
        api_key)
            # Generate API key-like string (32 chars, alphanumeric)
            openssl rand -base64 24 | tr -d '/+=' | head -c 32
            ;;
        webhook_secret)
            # Generate webhook secret (43 chars, base64)
            openssl rand -base64 32 | tr -d '\n'
            ;;
        jwt_secret)
            # Generate JWT secret (64 chars, hex)
            openssl rand -hex 32
            ;;
        encryption_key)
            # Generate encryption key (32 bytes, base64)
            openssl rand -base64 32 | tr -d '\n'
            ;;
        wallet_address|btc)
            # Placeholder - real wallet addresses must be generated properly
            echo "WALLET_ADDRESS_MUST_BE_GENERATED_PROPERLY"
            ;;
        generic|*)
            # Generic secure random string
            openssl rand -base64 32 | tr -d '/+=\n' | head -c 40
            ;;
    esac
}

validate_key_format() {
    local key_name="$1"
    local key_value="$2"
    
    case "$key_name" in
        STRIPE_SECRET_KEY)
            [[ "$key_value" =~ ^sk_(live|test)_ ]] && return 0 || return 1
            ;;
        STRIPE_PUBLISHABLE_KEY)
            [[ "$key_value" =~ ^pk_(live|test)_ ]] && return 0 || return 1
            ;;
        STRIPE_WEBHOOK_SECRET)
            [[ "$key_value" =~ ^whsec_ ]] && return 0 || return 1
            ;;
        SATIM_MERCHANT_ID)
            [[ "$key_value" =~ ^[0-9]{15,18}$ ]] && return 0 || return 1
            ;;
        USDT_TRC20_WALLET_ADDRESS)
            [[ "$key_value" =~ ^T[A-Za-z1-9]{33}$ ]] && return 0 || return 1
            ;;
        BTC_WALLET_ADDRESS)
            [[ "$key_value" =~ ^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$ ]] && return 0 || return 1
            ;;
        ETH_WALLET_ADDRESS|USDT_ERC20_WALLET_ADDRESS)
            [[ "$key_value" =~ ^0x[a-fA-F0-9]{40}$ ]] && return 0 || return 1
            ;;
        *)
            # For other keys, just check non-empty and reasonable length
            [ ${#key_value} -ge 8 ] && return 0 || return 1
            ;;
    esac
}

rotate_provider_keys() {
    local provider="$1"
    local dry_run="${2:-false}"
    
    log_info "Starting key rotation for provider: $provider"
    
    # Check if provider is valid
    if [ -z "${PROVIDER_KEYS[$provider]+x}" ]; then
        log_error "Unknown provider: $provider"
        log_info "Valid providers: ${!PROVIDER_KEYS[*]}"
        return 1
    fi
    
    # Check if production env file exists
    if [ ! -f "$ENV_PRODUCTION" ]; then
        log_error "Production environment file not found: $ENV_PRODUCTION"
        return 1
    fi
    
    # Create backup before any changes
    if [ "$dry_run" != "true" ]; then
        log_info "Creating backup before rotation..."
        create_backup "$provider"
    fi
    
    local keys=(${PROVIDER_KEYS[$provider]})
    local rotated_keys=()
    
    for key in "${keys[@]}"; do
        local current_value=$(grep "^${key}=" "$ENV_PRODUCTION" 2>/dev/null | cut -d'=' -f2- || echo "")
        
        if [ -z "$current_value" ] || [[ "$current_value" == \$\{* ]]; then
            log_warning "Key $key is not set or is a placeholder - skipping"
            continue
        fi
        
        log_info "Processing key: $key"
        
        # Determine key type for generation
        local key_type="generic"
        case "$key" in
            *WEBHOOK*) key_type="webhook_secret" ;;
            *SECRET*|*API_SECRET*) key_type="api_key" ;;
            *API_KEY*) key_type="api_key" ;;
            *JWT*) key_type="jwt_secret" ;;
            *ENCRYPTION*) key_type="encryption_key" ;;
            *WALLET*) key_type="wallet_address" ;;
        esac
        
        # Generate new value
        local new_value
        if [ "$key_type" = "wallet_address" ]; then
            log_warning "Wallet addresses cannot be auto-generated. Please provide new value:"
            read -p "Enter new $key value (or press Enter to skip): " new_value
            if [ -z "$new_value" ]; then
                log_warning "Skipping $key"
                continue
            fi
        else
            new_value=$(generate_new_secret "$key_type")
        fi
        
        # Validate format (if not dry run)
        if [ "$dry_run" != "true" ]; then
            if ! validate_key_format "$key" "$new_value"; then
                log_warning "Generated key may not match expected format for $key"
                log_info "Current value mask: ${current_value:0:4}... (${#current_value} chars)"
                log_info "New value mask: ${new_value:0:4}... (${#new_value} chars)"
                
                read -p "Use this value anyway? (y/n): " confirm
                if [[ "$confirm" != "y" ]]; then
                    log_warning "Skipping $key"
                    continue
                fi
            fi
        fi
        
        # Apply changes
        if [ "$dry_run" = "true" ]; then
            log_info "[DRY RUN] Would update $key:"
            log_info "  Old: ${current_value:0:4}...(${#current_value} chars)"
            log_info "  New: ${new_value:0:4}...(${#new_value} chars)"
        else
            # Update the file using sed
            if grep -q "^${key}=" "$ENV_PRODUCTION"; then
                sed -i "s|^${key}=.*|${key}=${new_value}|" "$ENV_PRODUCTION"
                log_success "Updated $key"
                rotated_keys+=("$key")
            else
                # Add new key if it doesn't exist
                echo "${key}=${new_value}" >> "$ENV_PRODUCTION"
                log_success "Added $key"
                rotated_keys+=("$key")
            fi
        fi
    done
    
    if [ "$dry_run" = "true" ]; then
        log_info "[DRY RUN] No changes were made"
    else
        log_success "Rotation complete for provider: $provider"
        log_info "Rotated keys: ${rotated_keys[*]:-none}"
        log_warning "Remember to restart your application to load new keys!"
    fi
}

# =============================================================================
# Status & Listing Functions
# =============================================================================

show_status() {
    log_info "Payment Configuration Status"
    echo "=========================================="
    
    if [ ! -f "$ENV_PRODUCTION" ]; then
        log_error "Production environment file not found"
        return 1
    fi
    
    for provider in "${!PROVIDER_KEYS[@]}"; do
        echo ""
        echo -e "${BLUE}Provider: ${provider^^}${NC}"
        echo "----------------------------------------"
        
        local keys=(${PROVIDER_KEYS[$provider]})
        local configured=0
        local total=${#keys[@]}
        
        for key in "${keys[@]}"; do
            local value=$(grep "^${key}=" "$ENV_PRODUCTION" 2>/dev/null | cut -d'=' -f2- || echo "")
            
            if [ -n "$value" ] && [[ "$value" != \$\{* ]]; then
                local masked="${value:0:6}$(printf '%0.1s' '.'{1..20})${value: -4}"
                echo -e "  ${GREEN}✓${NC} $key: $masked"
                ((configured++))
            elif [[ "$value" == \$\{* ]]; then
                echo -e "  ${YELLOW}○${NC} $key: [PLACEHOLDER]"
            else
                echo -e "  ${RED}✗${NC} $key: [NOT SET]"
            fi
        done
        
        local percentage=$((configured * 100 / total))
        if [ $percentage -eq 100 ]; then
            echo -e "\n  Status: ${GREEN}Fully Configured${NC} ($configured/$total)"
        elif [ $percentage -gt 0 ]; then
            echo -e "\n  Status: ${YELLOW}Partially Configured${NC} ($configured/$total)"
        else
            echo -e "\n  Status: ${RED}Not Configured${NC} ($configured/$total)"
        fi
    done
    
    echo ""
    echo "=========================================="
}

# =============================================================================
# Main Entry Point
# =============================================================================

print_usage() {
    cat << EOF
AlgeriaTrade.dz Key Rotation Script

Usage: $0 [OPTIONS]

Options:
  --provider <name>     Rotate keys for specific provider
                        Providers: satim, stripe, crypto, exchange, security
  
  --all                 Rotate keys for ALL providers
  
  --dry-run             Show what would be changed without making changes
  
  --backup-only         Create backup without rotating keys
  
  --restore <file>      Restore from a backup file
  
  --list                List available backups
  
  --status              Show current configuration status
  
  --help                Show this help message

Examples:
  $0 --status                              Show current key status
  $0 --provider stripe --dry-run           Preview Stripe key rotation
  $0 --provider satim                      Rotate SATIM keys
  $0 --all                                 Rotate all keys
  $0 --backup-only                         Create backup only
  $0 --list                                List backups

Security Notes:
  - Backups are encrypted with AES-256-CBC
  - Keys are stored with restricted permissions (600)
  - Always test with --dry-run first
  - Keep backup keys secure!

EOF
}

main() {
    check_dependencies
    
    local provider=""
    local dry_run=false
    local action="status"
    local restore_file=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --provider)
                provider="$2"
                action="rotate"
                shift 2
                ;;
            --all)
                action="rotate-all"
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --backup-only)
                action="backup"
                shift
                ;;
            --restore)
                restore_file="$2"
                action="restore"
                shift 2
                ;;
            --list)
                action="list-backups"
                shift
                ;;
            --status)
                action="status"
                shift
                ;;
            --help|-h)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # Execute action
    case "$action" in
        status)
            show_status
            ;;
        rotate)
            if [ -z "$provider" ]; then
                log_error "--provider is required for rotation"
                exit 1
            fi
            rotate_provider_keys "$provider" "$dry_run"
            ;;
        rotate-all)
            for prov in satim stripe crypto; do
                echo ""
                rotate_provider_keys "$prov" "$dry_run"
            done
            ;;
        backup)
            create_backup "all"
            ;;
        restore)
            if [ -z "$restore_file" ]; then
                log_error "--restore requires a backup file path"
                exit 1
            fi
            restore_backup "$restore_file"
            ;;
        list-backups)
            list_backups
            ;;
    esac
}

# Run main function
main "$@"
