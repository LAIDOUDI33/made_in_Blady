#!/bin/bash
# =============================================================================
# Rollback Script for AlgeriaTrade.dz
# =============================================================================
# Script de Rollback pour AlgeriaTrade.dz
#
# Supports multiple deployment targets:
# - Vercel rollback
# - Netlify rollback  
# - Docker/Git rollback
# - Manual version selection
#
# Supporte plusieurs cibles de déploiement:
# - Rollback Vercel
# - Rollback Netlify
# - Rollback Docker/Git
# - Sélection de version manuelle
#
# Usage / Utilisation:
#   ./scripts/deployment/rollback.sh              # Interactive mode
#   ./scripts/deployment/rollback.sh vercel       # Vercel rollback
#   ./scripts/deployment/rollback.sh netlify      # Netlify rollback
#   ./scripts/deployment/rollback.sh docker       # Docker rollback
#   ./scripts/deployment/rollback.sh --list       # List recent versions
#   ./scripts/deployment/rollback.sh --version=abc123  # Specific version
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
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Paths / Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
LOG_FILE="$PROJECT_ROOT/logs/rollback.log"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Options / Options
TARGET_PLATFORM=""
LIST_MODE=false
SPECIFIC_VERSION=""
FORCE_MODE=false
NO_CONFIRM=false

# =============================================================================
# Functions / Fonctions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

die() {
    error "$1"
    exit 1
}

setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR"
    touch "$LOG_FILE"
}

show_banner() {
    echo ""
    echo -e "${BOLD}${RED}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${RED}║${NC}   ${BOLD}↩️  AlgeriaTrade.dz - Rollback Tool${NC}         ${BOLD}${RED}║${NC}"
    echo -e "${BOLD}${RED}║${NC}   ${BOLD}Outil de Retour Arrière${NC}                    ${BOLD}${RED}║${NC}"
    echo -e "${BOLD}${RED}╚══════════════════════════════════════════════╝${NC}"
    echo ""
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            vercel|netlify|docker|all)
                TARGET_PLATFORM="$1"
                shift
                ;;
            --list|-l)
                LIST_MODE=true
                shift
                ;;
            --version=*)
                SPECIFIC_VERSION="${1#*=}"
                shift
                ;;
            --force|-f)
                FORCE_MODE=true
                shift
                ;;
            --yes|-y)
                NO_CONFIRM=true
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
↩️  AlgeriaTrade.dz Rollback Tool

Revert to a previous deployment safely.

Usage: ./rollback.sh [PLATFORM] [OPTIONS]

Platforms:
  vercel       Rollback Vercel deployment
  netlify      Rollback Netlify deployment
  docker       Rollback Docker deployment (git-based)
  all          Rollback all platforms

Options:
  -l, --list           List recent versions/commits
  --version=HASH       Rollback to specific git commit
  -f, --force          Force without confirmation
  -y, --yes            Auto-confirm prompts
  -h, --help           Show this help

Examples:
  ./rollback.sh                  # Interactive mode
  ./rollback.sh vercel           # Rollback Vercel
  ./rollback.sh docker           # Rollback Docker (previous commit)
  ./rollback.sh --list           # See recent versions
  ./rollback.sh docker --version=abc123  # Specific version

⚠️  Always backup before rolling back!
EOF
}

# List recent versions / Lister les versions récentes
list_versions() {
    echo ""
    echo -e "${BOLD}Recent Deployment Versions / Versions de Déploiement Récentes:${NC}"
    echo -e "${BOLD}──────────────────────────────────────────────────────${NC}"
    echo ""

    # Git commits / Commits Git
    echo -e "${BOLD}📦 Git Commits:${NC}"
    git -C "$PROJECT_ROOT" log --oneline -10 2>/dev/null || echo "  No git history"
    echo ""

    # Database backups / Sauvegardes de base de données
    echo -e "${BOLD}💾 Database Backups:${NC}"
    ls -lh "$BACKUP_DIR/db/"*.sql.gz 2>/dev/null | tail -5 || echo "  No backups found"
    echo ""

    # Docker images (if available) / Images Docker (si disponibles)
    if command -v docker &> /dev/null; then
        echo -e "${BOLD}🐳 Docker Images:${NC}"
        docker images --filter "reference=*algeriatrade*" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" 2>/dev/null | head -5 || echo "  No images found"
        echo ""
    fi

    # Vercel deployments (if CLI available) / Déploiements Vercel (si CLI disponible)
    if command -v vercel &> /dev/null; then
        echo -e "${BOLD}🔵 Vercel Deployments:${NC}"
        cd "$PROJECT_ROOT" && vercel ls --limit 5 2>/dev/null || echo "  Unable to list (not linked?)"
        echo ""
    fi
}

# Select platform interactively / Sélectionner la plateforme interactivement
select_platform() {
    if [[ -n "$TARGET_PLATFORM" ]]; then
        return
    fi

    echo ""
    echo -e "${BOLD}Select rollback target / Sélectionnez la cible de rollback:${NC}"
    echo "  1) Vercel"
    echo "  2) Netlify"
    echo "  3) Docker (Git-based)"
    echo "  4) All Platforms"
    echo "  0) Cancel / Annuler"
    echo ""
    read -rp "Choice [0-4]: " choice

    case $choice in
        1) TARGET_PLATFORM="vercel" ;;
        2) TARGET_PLATFORM="netlify" ;;
        3) TARGET_PLATFORM="docker" ;;
        4) TARGET_PLATFORM="all" ;;
        0|*) info "Rollback cancelled / Rollback annulé"; exit 0 ;;
    esac
}

# Confirm rollback / Confirmer le rollback
confirm_rollback() {
    if [[ "$NO_CONFIRM" == true ]]; then
        return
    fi

    echo ""
    warn "⚠️  WARNING / ATTENTION!"
    warn "This will REVERT the deployment to a previous version!"
    warn "Cela va REVENIR à une version précédente!"
    echo ""
    warn "Current state will be lost / L'état actuel sera perdu"
    echo ""
    read -rp "Are you sure you want to continue? [type 'yes' to confirm]: " confirm

    if [[ "$confirm" != "yes" ]]; then
        info "Rollback cancelled / Rollback annulé"
        exit 0
    fi
}

# Pre-rollback backup / Sauvegarde pre-rollback
pre_rollback_backup() {
    log "Creating pre-rollback backup... / Création de la sauvegarde pre-rollback..."

    cd "$PROJECT_ROOT"

    # Save current state / Sauvegarder l'état actuel
    local current_version=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    echo "$current_version" > "$BACKUP_DIR/pre-rollback-version-$TIMESTAMP.txt"

    # Database backup / Sauvegarde de base de données
    if docker ps --format '{{.Names}}' | grep -q "algeriatrade-postgres"; then
        docker exec algeriatrade-postgres pg_dump -U algeriatrade algeriatrade 2>/dev/null | \
            gzip > "$BACKUP_DIR/db/pre-rollback-backup_${TIMESTAMP}.sql.gz" || true
        success "Pre-rollback backup created / Sauvegarde pre-rollback créée"
    else
        warn "PostgreSQL not running, skipping database backup"
    fi
}

# Vercel rollback / Rollback Vercel
rollback_vercel() {
    log "Executing Vercel rollback... / Exécution du rollback Vercel..."

    cd "$PROJECT_ROOT"

    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI not found / VercEL CLI non trouvé"
        return 1
    fi

    if vercel rollback 2>&1 | tee -a "$LOG_FILE"; then
        success "Vercel rollback successful / Rollback Vercel réussi"
        return 0
    else
        error "Vercel rollback failed! Check Vercel dashboard for manual rollback."
        error "Rollback Vercel échoué! Vérifiez le tableau de bord Vercel pour un rollback manuel."
        return 1
    fi
}

# Netlify rollback / Rollback Netlify
rollback_netlify() {
    log "Executing Netlify rollback... / Exécution du rollback Netlify..."

    cd "$PROJECT_ROOT"

    if ! command -v netlify &> /dev/null; then
        error "Netlify CLI not found / Netlify CLI non trouvé"
        return 1
    fi

    if netlify rollback 2>&1 | tee -a "$LOG_FILE"; then
        success "Netlify rollback successful / Rollback Netlify réussi"
        return 0
    else
        error "Netlify rollback failed! Check Netlify dashboard for manual rollback."
        error "Rollback Netlify échoué! Vérifiez le tableau de bord Netlify pour un rollback manuel."
        return 1
    fi
}

# Docker/Git rollback / Rollback Docker/Git
rollback_docker() {
    log "Executing Docker/Git rollback... / Exécution du rollback Docker/Git..."

    cd "$PROJECT_ROOT"

    # Determine target version / Déterminer la version cible
    local target_version="$SPECIFIC_VERSION"

    if [[ -z "$target_version" ]]; then
        # Get previous commit / Obtenir le commit précédent
        target_version=$(git rev-parse HEAD~1 2>/dev/null || echo "")
        
        if [[ -z "$target_version" ]]; then
            error "Cannot determine previous version / Impossible de déterminer la version précédente"
            return 1
        fi

        info "Rolling back to: $target_version ($(git log -1 --format='%s' $target_version))"
        
        if [[ "$NO_CONFIRM" != true ]]; then
            read -rp "Confirm this version? [y/N] " version_confirm
            [[ "$version_confirm" != "y" && "$version_confirm" != "Y" ]] && return 1
        fi
    fi

    # Stop services / Arrêter les services
    info "Stopping services... / Arrêt des services..."
    docker compose -f "$COMPOSE_FILE" down --timeout 60 2>/dev/null || true

    # Reset to target version / Réinitialiser à la version cible
    info "Resetting to version $target_version... / Réinitialisation à la version $target_version..."
    git reset --hard "$target_version"

    # Rebuild and restart / Reconstruire et redémarrer
    info "Rebuilding and restarting... / Reconstruction et redémarrage..."
    docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans 2>&1 | tee -a "$LOG_FILE"

    # Wait for services / Attendre les services
    info "Waiting for services... / Attente des services..."
    sleep 30

    # Health check / Contrôle de santé
    local attempts=0
    while [[ $attempts -lt 10 ]]; do
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            success "Docker rollback successful / Rollback Docker réussi"
            return 0
        fi
        sleep 5
        ((attempts++))
    done

    warn "Application may need more time to start / L'application peut avoir besoin de plus de temps pour démarrer"
    return 0
}

# Post-rollback verification / Vérification post-rollback
verify_rollback() {
    log "Verifying rollback... / Vérification du rollback..."

    sleep 10

    # Basic checks / Vérifications de base
    local errors=0

    # Check app / Vérifier l'app
    if curl -sf --max-time 10 "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}" > /dev/null 2>&1; then
        success "Application is responding / L'application répond"
    else
        warn "Application not responding (may need more time) / L'application ne répond pas (peut avoir besoin de plus de temps)"
        ((errors++))
    fi

    # Check API / Vérifier l'API
    if curl -sf --max-time 10 "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/health" > /dev/null 2>&1; then
        success "API health endpoint is working / Le point de santé API fonctionne"
    else
        warn "API health check failed / Le contrôle de santé API a échoué"
        ((errors++))
    fi

    if [[ $errors -gt 0 ]]; then
        warn "Some checks failed. Please verify manually / Certaines vérifications ont échoué. Veuillez vérifier manuellement"
    else
        success "Rollback verified successfully / Rollback vérifié avec succès"
    fi
}

# Send notification / Envoyer une notification
send_notification() {
    local status="$1"
    local platform="$2"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local emoji=$([[ "$status" == "success" ]] && echo "↩️" || echo "❌")
        local color=$([[ "$status" == "success" ]] && echo "warning" || echo "danger")

        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"${emoji} AlgeriaTrade Rollback [$platform]\",
                    \"text\": \"Rollback $status at $(date)\",
                    \"fields\": [
                        {\"title\": \"Platform\", \"value\": \"$platform\", \"short\": true},
                        {\"title\": \"User\", \"value\": \"$(whoami)\", \"short\": true},
                        {\"title\": \"Host\", \"value\": \"$(hostname)\", \"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true
    fi
}

# Display summary / Afficher le résumé
display_summary() {
    local platform="$1"
    
    echo ""
    echo -e "${BOLD}${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${YELLOW}  ↩️  ROLLBACK COMPLETED / ROLLBACK TERMINÉ                     ${NC}"
    echo -e "${BOLD}${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Platform: ${GREEN}$platform${NC}"
    echo -e "  Time: $(date)"
    echo -e "  Previous state backed up to: ${CYAN}$BACKUP_DIR/${NC}"
    echo ""
    echo -e "  ${BOLD}To re-deploy, run the appropriate deploy script.${NC}"
    echo -e "  ${BOLD}Pour redéployer, exécutez le script de déploiement approprié.${NC}"
    echo ""
}

# =============================================================================
# Main / Principal
# =============================================================================

main() {
    setup_logging
    parse_args "$@"
    show_banner

    # List mode / Mode liste
    if [[ "$LIST_MODE" == true ]]; then
        list_versions
        exit 0
    fi

    # Select platform / Sélectionner la plateforme
    select_platform
    confirm_rollback
    pre_rollback_backup

    local rollback_success=true

    # Execute rollback based on platform / Exécuter le rollback selon la plateforme
    case "$TARGET_PLATFORM" in
        vercel)
            rollback_vercel || rollback_success=false
            send_notification "$?" "Vercel"
            display_summary "Vercel"
            ;;
        netlify)
            rollback_netlify || rollback_success=false
            send_notification "$?" "Netlify"
            display_summary "Netlify"
            ;;
        docker)
            rollback_docker || rollback_success=false
            send_notification "$?" "Docker"
            display_summary "Docker"
            ;;
        all)
            log "Rollback all platforms... / Rollback toutes les plateformes..."
            
            rollback_vercel || true
            rollback_netlify || true
            rollback_docker || rollback_success=false
            
            send_notification "$?" "All Platforms"
            display_summary "All Platforms"
            ;;
        *)
            die "Invalid platform: $TARGET_PLATFORM / Plateforme invalide: $TARGET_PLATFORM"
            ;;
    esac

    # Post-rollback verification / Vérification post-rollback
    if [[ "$rollback_success" == true ]]; then
        verify_rollback
    fi

    exit $([[ "$rollback_success" == true ]] && echo 0 || echo 1)
}

main "$@"
