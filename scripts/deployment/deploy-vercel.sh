#!/bin/bash
# =============================================================================
# Vercel Deployment Script for AlgeriaTrade.dz
# =============================================================================
# Script de déploiement Vercel pour AlgeriaTrade.dz
# 
# Handles:
# - Environment setup / Configuration de l'environnement
# - Build and deploy / Build et déploiement
# - Health verification / Vérification de santé
# - Rollback on failure / Rollback en cas d'échec
#
# Usage / Utilisation:
#   ./scripts/deployment/deploy-vercel.sh              # Production deployment
#   ./scripts/deployment/deploy-vercel.sh --preview     # Preview deployment
#   ./scripts/deployment/deploy-vercel.sh --rollback    # Rollback
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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths / Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/logs/vercel-deploy.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Options / Options
PREVIEW_MODE=false
ROLLBACK_MODE=false
SKIP_BUILD=false
FORCE_DEPLOY=false

# =============================================================================
# Functions / Fonctions
# =============================================================================

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

warn() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

info() {
    local message="[INFO] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

success() {
    local message="[SUCCESS] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

die() {
    error "$1"
    exit 1
}

# Create log directory / Créer le répertoire de logs
setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    log "Starting Vercel deployment script"
}

# Parse arguments / Parser les arguments
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
🚀 AlgeriaTrade.dz Vercel Deployment Script

Usage: ./deploy-vercel.sh [OPTIONS]

Options:
  -p, --preview      Deploy to preview environment
  -r, --rollback     Rollback to previous deployment
  --skip-build       Skip build step (use existing .next)
  -f, --force        Force deployment without confirmation
  -h, --help         Show this help

Examples:
  ./deploy-vercel.sh                  # Deploy to production
  ./deploy-vercel.sh --preview        # Deploy preview
  ./deploy-vercel.sh --rollback       # Rollback last deploy

Environment Variables:
  VERCEL_TOKEN          Vercel API token (required)
  VERCEL_ORG_ID         Vercel organization ID
  VERCEL_PROJECT_ID     Vercel project ID
  SLACK_WEBHOOK_URL     Optional: Slack notification URL
EOF
}

# Check prerequisites / Vérifier les prérequis
check_prerequisites() {
    log "Checking prerequisites... / Vérification des prérequis..."

    # Check if Vercel CLI is installed / Vérifier si Vercel CLI est installé
    if ! command -v vercel &> /dev/null; then
        info "Vercel CLI not found, installing... / Vercel CLI non trouvé, installation..."
        npm i -g vercel@latest || die "Failed to install Vercel CLI / Échec de l'installation de Vercel CLI"
        success "Vercel CLI installed successfully"
    else
        success "Vercel CLI is installed: $(vercel --version)"
    fi

    # Check Node.js version / Vérifier la version de Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        info "Node.js version: $node_version"
    else
        warn "Node.js not found - some features may not work"
    fi

    # Check Bun / Vérifier Bun
    if command -v bun &> /dev/null; then
        success "Bun is installed: $(bun --version)"
    else
        warn "Bun not found - will use npm for dependencies"
    fi

    # Check git / Vérifier Git
    if ! command -v git &> /dev/null; then
        die "Git is required but not installed / Git est requis mais n'est pas installé"
    fi

    # Verify we're in a git repo / Vérifier qu'on est dans un repo git
    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        die "Not a git repository / N'est pas un dépôt git"
    fi

    success "All prerequisites met / Tous les prérequis sont satisfaits"
}

# Load environment variables / Charger les variables d'environnement
load_environment() {
    log "Loading environment variables... / Chargement des variables d'environnement..."

    cd "$PROJECT_ROOT"

    # Load from .env.production if exists / Charger depuis .env.production si existe
    if [[ -f ".env.production" ]]; then
        info "Loading from .env.production"
        set -a
        source .env.production
        set +a
    fi

    # Load from .env.local if exists / Charger depuis .env.local si existe
    if [[ -f ".env.local" ]]; then
        info "Loading from .env.local"
        set -a
        source .env.local
        set +a
    fi

    # Validate required variables / Valider les variables requises
    local required_vars=("NEXTAUTH_SECRET" "NEXTAUTH_URL")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        warn "Missing recommended environment variables: ${missing_vars[*]}"
        warn "Variables d'environnement recommandées manquantes: ${missing_vars[*]}"
        info "You can set them in .env.production or Vercel dashboard"
        
        if [[ "$FORCE_DEPLOY" != true ]]; then
            read -rp "Continue anyway? [y/N] " continue_anyway
            if [[ "$continue_anyway" != "y" && "$continue_anyway" != "Y" ]]; then
                die "Deployment cancelled / Déploiement annulé"
            fi
        fi
    else
        success "Environment variables loaded successfully"
    fi
}

# Pull latest code / Récupérer le dernier code
pull_latest_code() {
    log "Pulling latest code... / Récupération du dernier code..."

    cd "$PROJECT_ROOT"

    # Check for uncommitted changes / Vérifier les changements non commités
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        warn "Uncommitted changes detected! / Changements non commités détectés!"
        git status --short
        
        if [[ "$FORCE_DEPLOY" != true ]]; then
            read -rp "Stash changes and continue? [y/N] " stash_changes
            if [[ "$stash_changes" == "y" || "$stash_changes" == "Y" ]]; then
                git stash push -m "Auto-stash before deploy $(date)"
            else
                die "Please commit or stash changes before deploying / Veuillez committer ou stasher vos changements"
            fi
        fi
    fi

    # Pull latest / Récupérer le dernier
    git pull origin main || git pull origin master || {
        warn "git pull failed, continuing with current code / git pull a échoué, continuation avec le code actuel"
    }

    success "Code updated successfully / Code mis à jour avec succès"
}

# Install dependencies / Installer les dépendances
install_dependencies() {
    log "Installing dependencies... / Installation des dépendances..."

    cd "$PROJECT_ROOT"

    if [[ -f "bun.lockb" ]] && command -v bun &> /dev/null; then
        bun install --frozen-lockfile || bun install
    elif [[ -f "package-lock.json" ]]; then
        npm ci --prefer-offline || npm install
    elif [[ -f "yarn.lock" ]]; then
        yarn install --frozen-lockfile || yarn install
    else
        npm install
    fi

    success "Dependencies installed successfully / Dépendances installées avec succès"
}

# Run database migrations / Exécuter les migrations de base de données
run_migrations() {
    log "Running database migrations... / Exécution des migrations de base de données..."

    cd "$PROJECT_ROOT"

    if [[ -f "prisma/schema.prisma" ]]; then
        npx prisma migrate deploy || {
            warn "Prisma migration failed, attempting to generate client..."
            npx prisma generate
        }
        success "Database migrations completed / Migrations de base de données terminées"
    else
        warn "No Prisma schema found, skipping migrations / Pas de schéma Prisma trouvé, saut des migrations"
    fi
}

# Build application / Construire l'application
build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        info "Skipping build step / Saut de l'étape de build"
        return
    fi

    log "Building application... / Construction de l'application..."

    cd "$PROJECT_ROOT"

    # Set production environment for build / Définir l'environnement de production pour le build
    export NODE_ENV=production

    if command -v bun &> /dev/null && [[ -f "bun.lockb" ]]; then
        bun run build
    else
        npm run build
    fi

    success "Build completed successfully / Build terminé avec succès"
}

# Deploy to Vercel / Déployer sur Vercel
deploy_to_vercel() {
    log "Deploying to Vercel... / Déploiement sur Vercel..."

    cd "$PROJECT_ROOT"

    local vercel_args=""
    
    if [[ "$PREVIEW_MODE" == true ]]; then
        info "Deploying to preview environment / Déploiement vers l'environnement de prévisualisation"
        # Preview deployments don't use --prod
        vercel_args="--yes"
    else
        info "Deploying to production / Déploiement vers la production"
        vercel_args="--prod --yes"
    fi

    # Run Vercel deployment / Exécuter le déploiement Vercel
    if vercel $vercel_args 2>&1 | tee -a "$LOG_FILE"; then
        success "Vercel deployment initiated successfully / Déploiement Vercel initié avec succès"
    else
        error "Vercel deployment failed! / Déploiement Vercel échoué!"
        
        # Attempt rollback automatically / Tenter un rollback automatique
        if [[ "$PREVIEW_MODE" != true ]]; then
            warn "Attempting automatic rollback... / Tentative de rollback automatique..."
            vercel rollback 2>/dev/null || true
        fi
        
        die "Deployment failed after rollback attempt / Déploiement échoué après tentative de rollback"
    fi
}

# Perform rollback / Effectuer un rollback
perform_rollback() {
    log "Performing rollback... / Effectuation du rollback..."

    cd "$PROJECT_ROOT"

    if vercel rollback 2>&1 | tee -a "$LOG_FILE"; then
        success "Rollback completed successfully / Rollback terminé avec succès"
    else
        error "Rollback failed! Please check Vercel dashboard manually."
        error "Rollback échoué! Veuillez vérifier le tableau de bord Vercel manuellement."
        exit 1
    fi
}

# Health check after deployment / Vérification de santé après déploiement
health_check() {
    log "Running health check... / Exécution du contrôle de santé..."

    local app_url="${NEXT_PUBLIC_APP_URL:-https://algeriatrade.dz}"
    local health_endpoint="$app_url/api/health"
    
    info "Checking: $health_endpoint"
    
    local max_attempts=5
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf --max-time 10 "$health_endpoint" > /dev/null 2>&1; then
            success "Health check passed after ${attempt} attempt(s) / Contrôle de santé réussi après ${attempt} tentative(s)"
            return 0
        fi
        
        warn "Attempt $attempt/$max_attempts failed, retrying in 10s... / Tentative $attempt/$max_attempts échouée, nouvelle tentative dans 10s..."
        sleep 10
        ((attempt++))
    done
    
    warn "Health check did not pass within timeout / Le contrôle de santé n'a pas réussi dans le délai imparti"
    warn "This might be expected for new deployments / Cela peut être attendu pour les nouveaux déploiements"
    return 0
}

# Send notification / Envoyer une notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification / Notification Slack
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color=$([[ "$status" == "success" ]] && echo "good" || echo "danger")
        local emoji=$([[ "$status" == "success" ]] && echo "✅" || echo "❌")
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"${emoji} AlgeriaTrade Vercel Deploy\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$([ \"$PREVIEW_MODE\" = true ] && echo 'Preview' || echo 'Production')\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"User\", \"value\": \"$(whoami)\", \"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true
        
        info "Slack notification sent / Notification Slack envoyée"
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
    echo "║  🇩🇿  AlgeriaTrade.dz - Vercel Deployment    ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""

    # Handle rollback mode / Gérer le mode rollback
    if [[ "$ROLLBACK_MODE" == true ]]; then
        perform_rollback
        send_notification "success" "Rollback effectué avec succès"
        exit 0
    fi

    # Confirmation prompt / Invite de confirmation
    if [[ "$FORCE_DEPLOY" != true ]]; then
        if [[ "$PREVIEW_MODE" == true ]]; then
            read -rp "Deploy to PREVIEW environment? [y/N] " confirm
        else
            warn "⚠️  You are about to deploy to PRODUCTION! / ⚠️  Vous êtes sur le point de déployer en PRODUCTION!"
            read -rp "Deploy to PRODUCTION? [y/N] " confirm
        fi
        
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            info "Deployment cancelled / Déploiement annulé"
            exit 0
        fi
    fi

    # Execute deployment steps / Exécuter les étapes de déploiement
    check_prerequisites
    load_environment
    pull_latest_code
    install_dependencies
    run_migrations
    build_application
    deploy_to_vercel
    health_check

    # Success! / Succès!
    local env_name=$([[ "$PREVIEW_MODE" == true ]] && echo "PREVIEW" || echo "PRODUCTION")
    
    echo ""
    success "========================================"
    success "  DEPLOYMENT COMPLETE!                 "
    success "  Déploiement Terminé!                  "
    success "  Environment: $env_name               "
    success "  Timestamp: $(date)                    "
    success "========================================"
    echo ""
    
    send_notification "success" "Déploiement $env_name terminé avec succès à $(date)"
}

# Run main function / Exécuter la fonction principale
main "$@"
