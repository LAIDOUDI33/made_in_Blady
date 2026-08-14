#!/bin/bash
# =============================================================================
# Netlify Deployment Script for AlgeriaTrade.dz
# =============================================================================
# Script de déploiement Netlify pour AlgeriaTrade.dz
#
# Features:
# - Static + SSR deployment support
# - Environment configuration
# - Plugin management
# - Form handling setup
# - Rollback capability
#
# Fonctionnalités:
# - Support déploiement statique + SSR
# - Configuration de l'environnement
# - Gestion des plugins
# - Configuration des formulaires
# - Capacité de rollback
#
# Usage / Utilisation:
#   ./scripts/deployment/deploy-netlify.sh           # Production deploy
#   ./scripts/deployment/deploy-netlify.sh --preview  # Preview deploy
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration / Configuration
# =============================================================================

# Colors / Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths / Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/logs/netlify-deploy.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Options / Options
PREVIEW_MODE=false
ROLLBACK_MODE=false
SKIP_BUILD=false
FORCE_DEPLOY=false
SITE_ID=""

# =============================================================================
# Functions / Fonctions
# =============================================================================

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

warn() {
    local msg="[WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    local msg="[ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

info() {
    local msg="[INFO] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

success() {
    local msg="[SUCCESS] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

die() {
    error "$1"
    exit 1
}

setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    log "Starting Netlify deployment script"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --preview|-p)
                PREVIEW_MODE=true
                shift
                ;;
            --rollback|-r)
                ROLLBACK_MODE=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --force|-f)
                FORCE_DEPLOY=true
                shift
                ;;
            --site-id=*)
                SITE_ID="${1#*=}"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                die "Unknown argument: $1 / Argument inconnu: $1"
                ;;
        esac
    done
}

show_help() {
    cat << 'EOF'
🚀 AlgeriaTrade.dz Netlify Deployment Script

Usage: ./deploy-netlify.sh [OPTIONS]

Options:
  -p, --preview       Deploy to preview environment
  -r, --rollback      Rollback to previous deployment
  --skip-build        Skip build step
  -f, --force         Force deployment without confirmation
  --site-id=ID        Netlify site ID
  -h, --help          Show this help

Examples:
  ./deploy-netlify.sh                   # Production deploy
  ./deploy-netlify.sh --preview         # Preview deploy
  ./deploy-netlify.sh --site-id=abc123  # Deploy to specific site

Environment Variables:
  NETLIFY_AUTH_TOKEN    Netlify auth token (required)
  NETLIFY_SITE_ID       Netlify site ID (or use --site-id)
  NETLIFY_TEAM          Netlify team name (if applicable)
EOF
}

# Check prerequisites / Vérifier les prérequis
check_prerequisites() {
    log "Checking prerequisites... / Vérification des prérequis..."

    # Check Netlify CLI / Vérifier Netlify CLI
    if ! command -v netlify &> /dev/null; then
        info "Netlify CLI not found, installing... / Netlify CLI non trouvé, installation..."
        npm i -g netlify-cli@latest || die "Failed to install Netlify CLI"
        success "Netlify CLI installed: $(netlify --version)"
    else
        success "Netlify CLI is installed: $(netlify --version)"
    fi

    # Check authentication / Vérifier l'authentification
    if ! netlify whoami &> /dev/null; then
        warn "Not logged into Netlify / Non connecté à Netlify"
        
        if [[ -n "${NETLIFY_AUTH_TOKEN:-}" ]]; then
            info "Using NETLIFY_AUTH_TOKEN environment variable"
            netlify auth:$NETLIFY_AUTH_TOKEN 2>/dev/null || true
        else
            die "Please run 'netlify login' first or set NETLIFY_AUTH_TOKEN / Veuillez exécuter 'netlify login' d'abord"
        fi
    else
        success "Authenticated with Netlify / Authentifié avec Netlify"
    fi

    # Check Node/Bun / Vérifier Node/Bun
    if command -v bun &> /dev/null; then
        success "Bun available: $(bun --version)"
    elif command -v node &> /dev/null; then
        success "Node.js available: $(node --version)"
    fi

    success "Prerequisites check complete / Vérification des prérequis terminée"
}

# Load environment / Charger l'environnement
load_environment() {
    log "Loading environment configuration... / Chargement de la configuration..."

    cd "$PROJECT_ROOT"

    # Source env files / Charger les fichiers env
    for env_file in ".env.production" ".env.local" ".env"; do
        if [[ -f "$env_file" ]]; then
            info "Loading $env_file"
            set -a
            source "$env_file"
            set +a
        fi
    done

    # Set Netlify-specific vars / Définir les variables spécifiques Netlify
    export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://algeriatrade.dz}"
    export NODE_ENV="${NODE_ENV:-production}"

    success "Environment loaded / Environnement chargé"
}

# Pull latest code / Récupérer le dernier code
pull_latest_code() {
    log "Updating codebase... / Mise à jour du code..."

    cd "$PROJECT_ROOT"

    if [[ -d ".git" ]]; then
        # Stash changes if needed / Stasher si nécessaire
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            warn "Uncommitted changes detected / Changements non commités détectés"
            if [[ "$FORCE_DEPLOY" == true ]]; then
                git stash push -m "auto-stash-$(date +%s)" || true
            else
                read -rp "Stash changes? [y/N] " stash_confirm
                [[ "$stash_confirm" == "y" ]] && git stash push -m "auto-stash-$(date +%s)" || true
            fi
        fi

        git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || \
            warn "Could not pull latest code, using current state"
    fi

    success "Codebase ready / Code prêt"
}

# Install dependencies / Installer les dépendances
install_dependencies() {
    log "Installing dependencies... / Installation des dépendances..."

    cd "$PROJECT_ROOT"

    if [[ -f "bun.lockb" ]] && command -v bun &> /dev/null; then
        bun install --frozen-lockfile 2>/dev/null || bun install
    elif [[ -f "package-lock.json" ]]; then
        npm ci --prefer-offline 2>/dev/null || npm install
    else
        npm install
    fi

    success "Dependencies installed / Dépendances installées"
}

# Build application / Construire l'application
build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        info "Skipping build / Build ignoré"
        return
    fi

    log "Building application... / Construction de l'application..."

    cd "$PROJECT_ROOT"
    export NODE_ENV=production

    # Next.js static export for Netlify / Export statique Next.js pour Netlify
    if command -v bun &> /dev/null && [[ -f "bun.lockb" ]]; then
        bun run build 2>&1 | tee -a "$LOG_FILE"
    else
        npm run build 2>&1 | tee -a "$LOG_FILE"
    fi

    # Check if build output exists / Vérifier si la sortie de build existe
    if [[ ! -d ".next" ]]; then
        die "Build failed - no .next directory / Build échoué - pas de répertoire .next"
    fi

    success "Build completed / Build terminé"
}

# Configure Netlify plugins / Configurer les plugins Netlify
configure_plugins() {
    log "Configuring Netlify plugins... / Configuration des plugins Netlify..."

    cd "$PROJECT_ROOT"

    # Create netlify.toml if not exists / Créer netlify.toml s'il n'existe pas
    if [[ ! -f "netlify.toml" ]]; then
        cat > netlify.toml << 'TOMLEOF'
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

# Next.js plugin for server-side support
[[plugins]]
  package = "@netlify/plugin-nextjs"

# Headers for security
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"

# Redirects for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
TOMLEOF
        info "Created netlify.toml"
    fi

    success "Plugins configured / Plugins configurés"
}

# Deploy to Netlify / Déployer sur Netlify
deploy_to_netlify() {
    log "Deploying to Netlify... / Déploiement sur Netlify..."

    cd "$PROJECT_ROOT"

    local deploy_args=()
    
    if [[ "$PREVIEW_MODE" == true ]]; then
        info "Deploying to preview / Déploiement en prévisualisation"
        deploy_args+=("--dir=.next")
    else
        info "Deploying to production / Déploiement en production"
        deploy_args+=("--prod" "--dir=.next")
    fi

    # Add site ID if provided / Ajouter l'ID du site si fourni
    if [[ -n "$SITE_ID" ]]; then
        deploy_args+=("--site=$SITE_ID")
    elif [[ -n "${NETLIFY_SITE_ID:-}" ]]; then
        deploy_args+=("--site=${NETLIFY_SITE_ID}")
    fi

    # Execute deployment / Exécuter le déploiement
    if netlify deploy "${deploy_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        success "Netlify deployment successful / Déploiement Netlify réussi"
    else
        error "Netlify deployment failed! / Déploiement Netlify échoué!"
        
        # Try rollback / Essayer le rollback
        if [[ "$PREVIEW_MODE" != true ]]; then
            warn "Attempting rollback... / Tentative de rollback..."
            netlify rollback 2>/dev/null || true
        fi
        
        die "Deployment failed / Déploiement échoué"
    fi
}

# Perform rollback / Effectuer un rollback
perform_rollback() {
    log "Performing rollback... / Effectuation du rollback..."

    cd "$PROJECT_ROOT"

    local rollback_args=()
    [[ -n "$SITE_ID" ]] && rollback_args+=("--site=$SITE_ID")
    [[ -n "${NETLIFY_SITE_ID:-}" ]] && rollback_args+=("--site=${NETLIFY_SITE_ID}")

    if netlify rollback "${rollback_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        success "Rollback successful / Rollback réussi"
    else
        error "Rollback failed! Use Netlify dashboard for manual rollback."
        error "Rollback échoué! Utilisez le tableau de bord Netlify pour un rollback manuel."
        exit 1
    fi
}

# Post-deploy verification / Vérification post-déploiement
post_deploy_check() {
    log "Running post-deploy checks... / Exécution des vérifications post-déploiement..."

    # Get deployed URL / Obtenir l'URL déployée
    local deploy_url="${NEXT_PUBLIC_APP_URL:-https://algeriatrade.dz}"
    
    info "Checking deployment at: $deploy_url"
    
    # Simple HTTP check / Vérification HTTP simple
    if curl -sf --max-time 30 "$deploy_url" > /dev/null 2>&1; then
        success "Site is accessible / Le site est accessible"
    else
        warn "Site may not be accessible yet (propagation delay) / Le site peut ne pas être encore accessible (délai de propagation)"
    fi

    success "Post-deploy checks complete / Vérifications post-déploiement terminées"
}

# Send notification / Envoyer une notification
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color=$([[ "$status" == "success" ]] && echo "#36a64b" || echo "#dc3545")
        local emoji=$([[ "$status" == "success" ]] && echo "✅" || echo "❌")

        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"${emoji} AlgeriaTrade Netlify Deploy\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$([ \"$PREVIEW_MODE\" = true ] && echo 'Preview' || echo 'Production')\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true

        info "Notification sent / Notification envoyée"
    fi
}

# =============================================================================
# Main / Principal
# =============================================================================

main() {
    setup_logging
    parse_args "$@"

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║  🇩🇿  AlgeriaTrade.dz - Netlify Deployment   ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""

    # Handle rollback / Gérer le rollback
    if [[ "$ROLLBACK_MODE" == true ]]; then
        perform_rollback
        send_notification "success" "Rollback effectué avec succès"
        exit 0
    fi

    # Confirm / Confirmer
    if [[ "$FORCE_DEPLOY" != true ]]; then
        local target_env=$([[ "$PREVIEW_MODE" == true ]] && echo "PREVIEW" || echo "PRODUCTION")
        [[ "$target_env" == "PRODUCTION" ]] && warn "⚠️  PRODUCTION deployment!"
        read -rp "Deploy to $target_env? [y/N] " confirm
        [[ "$confirm" != "y" && "$confirm" != "Y" ]] && {
            info "Cancelled / Annulé"
            exit 0
        }
    fi

    # Execute / Exécuter
    check_prerequisites
    load_environment
    pull_latest_code
    install_dependencies
    build_application
    configure_plugins
    deploy_to_netlify
    post_deploy_check

    # Done! / Terminé!
    local target_env=$([[ "$PREVIEW_MODE" == true ]] && echo "PREVIEW" || echo "PRODUCTION")
    
    echo ""
    success "========================================"
    success "  DEPLOYMENT COMPLETE!                 "
    success "  Déploiement Terminé!                  "
    success "  Environment: $target_env             "
    success "  Timestamp: $(date)                    "
    success "========================================"
    echo ""

    send_notification "success" "Déploiement $target_env terminé avec succès"
}

main "$@"
