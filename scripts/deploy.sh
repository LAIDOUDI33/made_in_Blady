#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz - Deployment Script
# =============================================================================
# Script de déploiement interactif pour AlgeriaTrade.dz
# 
# Fonctionnalités :
# - Choix de l'environnement (staging/production)
# - Pré-déploiement checks
# - Backup automatique de la base de données
# - Déploiement avec rollback possible
# - Post-déploiement verification
# - Notifications (Slack/Email)
#
# Usage :
#   ./scripts/deploy.sh                    # Mode interactif
#   ./scripts/deploy.sh --env production    # Déploiement direct
#   ./scripts/deploy.sh --rollback          # Rollback au déploiement précédent
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
DEPLOY_LOG="$PROJECT_ROOT/logs/deploy.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Fichiers de configuration
COMPOSE_FILE_PROD="docker-compose.prod.yml"
COMPOSE_FILE_DEV="docker-compose.dev.yml"

# Variables (peuvent être surchargées)
ENVIRONMENT=""
SKIP_CHECKS=false
SKIP_BACKUP=false
NO_CONFIRM=false
ROLLBACK=false

# =============================================================================
# Fonctions utilitaires
# =============================================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

die() {
    error "$1"
    exit 1
}

# Créer les répertoires nécessaires
setup_directories() {
    mkdir -p "$BACKUP_DIR/db"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$(dirname "$DEPLOY_LOG")"
}

# =============================================================================
# Parsing des arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env|-e)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --yes|-y)
                NO_CONFIRM=true
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
                die "Argument inconnu: $1"
                ;;
        esac
    done
}

show_help() {
    cat << EOF
AlgeriaTrade.dz Deployment Script

Usage: $0 [OPTIONS]

Options:
  -e, --env <env>       Environnement (staging|production)
  --skip-checks         Passer les pré-checks
  --skip-backup         Passer le backup de la base de données
  -y, --yes             Confirmer automatiquement (non-interactif)
  --rollback            Annuler le dernier déploiement
  -h, --help            Afficher cette aide

Exemples:
  $0                                    # Mode interactif
  $0 -e production                      # Déploiement production
  $0 -e staging --skip-backup           # Déploiement staging sans backup
  $0 --rollback                         # Rollback
EOF
}

# =============================================================================
# Sélection de l'environnement
# =============================================================================

select_environment() {
    if [[ -n "$ENVIRONMENT" ]]; then
        return
    fi

    echo ""
    info "Sélectionnez l'environnement de déploiement :"
    echo "  1) Staging (test/pré-production)"
    echo "  2) Production"
    echo ""
    read -rp "Choix [1-2]: " choice

    case $choice in
        1) ENVIRONMENT="staging" ;;
        2) ENVIRONMENT="production" ;;
        *) die "Choix invalide" ;;
    esac
}

confirm_deployment() {
    if [[ "$NO_CONFIRM" == true ]]; then
        return
    fi

    echo ""
    warn "=========================================="
    warn " DÉPLOIEMENT VERS : $ENVIRONMENT"
    warn "=========================================="
    echo ""
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        warn "⚠️  Vous êtes sur le point de déployer en PRODUCTION !"
        echo ""
    fi
    
    read -rp "Confirmer le déploiement ? [oui/NON] " confirm
    if [[ "$confirm" != "oui" && "$confirm" != "OUI" && "$confirm" != "yes" ]]; then
        info "Déploiement annulé."
        exit 0
    fi
}

# =============================================================================
# Pré-déploiement checks
# =============================================================================

pre_deploy_checks() {
    if [[ "$SKIP_CHECKS" == true ]]; then
        warn "Pré-checks ignorés"
        return
    fi

    log "🔍 Exécution des pré-déploiement checks..."

    # Check 1: Vérifier que nous sommes dans la bonne branche
    local current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local expected_branch=$([[ "$ENVIRONMENT" == "production" ]] && echo "main" || echo "develop")
    
    if [[ "$current_branch" != "$expected_branch" ]]; then
        warn "Branche actuelle: $current_branch (attendue: $expected_branch)"
        
        if [[ "$ENVIRONMENT" == "production" ]]; then
            read -rp "Continuer quand même ? [oui/NON] " force_continue
            if [[ "$force_continue" != "oui" ]]; then
                die "Déploiement annulé: mauvaise branche"
            fi
        fi
    else
        success "✓ Branche correcte: $current_branch"
    fi

    # Check 2: Vérifier qu'il n'y a pas de changements non-commit
    if ! git diff-index --quiet HEAD --; then
        warn "Changements non-commit détectés !"
        git status --short
        
        if [[ "$ENVIRONMENT" == "production" ]]; then
            die "Veuillez committer ou stash vos changements avant le déploiement production"
        fi
    else
        success "✓ Pas de changements non-commit"
    fi

    # Check 3: Vérifier les tests (si disponibles)
    log "Exécution des tests..."
    if bun run test:ci 2>/dev/null; then
        success "✓ Tests passés"
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        die "Tests échoués - impossible de déployer en production"
    else
        warn "Tests échoués ou indisponibles (continuation en staging)"
    fi

    # Check 4: Vérifier le build
    log "Build de l'application..."
    if bun run build; then
        success "✓ Build réussi"
    else
        die "Build échoué"
    fi

    # Check 5: Vérifier l'espace disque
    local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | tr -d 'G')
    if [[ "$available_space" -lt 5 ]]; then
        warn "Espace disque faible: ${available_space}GB disponible"
    else
        success "✓ Espace disque suffisant: ${available_space}GB"
    fi

    success "✅ Tous les pré-checks passés"
}

# =============================================================================
# Backup de la base de données
# =============================================================================

backup_database() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warn "Backup ignoré"
        return
    fi

    log "💾 Backup de la base de données..."

    local backup_file="$BACKUP_DIR/db/backup_${TIMESTAMP}.sql.gz"

    # Déterminer le type de base de données
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # PostgreSQL via Docker
        if docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE_PROD" ps postgres 2>/dev/null | grep -q "running"; then
            docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE_PROD" exec -T postgres \
                pg_dump -U algeriatrade algeriatrade | gzip > "$backup_file"
            
            success "✓ Backup PostgreSQL créé: $backup_file"
        else
            warn "PostgreSQL non détected, tentative SQLite..."
            backup_sqlite
        fi
    else
        backup_sqlite
    fi

    # Nettoyer les vieux backups (garder 7 jours)
    find "$BACKUP_DIR/db" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
}

backup_sqlite() {
    local db_files=$(find "$PROJECT_ROOT" -name "*.db" -o -name "*.sqlite" 2>/dev/null)
    
    for db in $db_files; do
        local backup_file="$BACKUP_DIR/db/$(basename "$db")_${TIMESTAMP}.gz"
        gzip -c "$db" > "$backup_file"
        success "✓ Backup SQLite créé: $backup_file"
    done
}

# =============================================================================
# Déploiement
# =============================================================================

deploy() {
    log "🚀 Démarrage du déploiement vers $ENVIRONMENT..."

    cd "$PROJECT_ROOT"

    # Sauvegarder la version actuelle pour rollback
    local previous_version=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    echo "$previous_version" > "$BACKUP_DIR/last_successful_deploy.txt"

    if [[ "$ENVIRONMENT" == "production" ]]; then
        deploy_docker_production
    else
        deploy_docker_dev
    fi

    success "✅ Déploiement terminé avec succès !"
}

deploy_docker_production() {
    log "Déploiement Docker Production..."

    # Pull des dernières images
    docker compose -f "$COMPOSE_FILE_PROD" pull 2>/dev/null || true

    # Build et démarrage
    docker compose -f "$COMPOSE_FILE_PROD" up -d --build --remove-orphans

    # Attendre que l'application soit pronte
    log "Attente de l'application..."
    sleep 30

    # Health check
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            success "✓ Application saine après ${attempt} tentatives"
            break
        fi
        
        warn "Tentative $attempt/$max_attempts - En attente..."
        sleep 10
        ((attempt++))
    done

    if [[ $attempt -gt $max_attempts ]]; then
        error "❌ L'application ne répond pas après le déploiement"
        log "Logs récents:"
        docker compose -f "$COMPOSE_FILE_PROD" logs --tail=50 app
        die "Déploiement échoué - voir les logs ci-dessus"
    fi
}

deploy_docker_dev() {
    log "Déploiement Docker Dev..."

    docker compose -f "$COMPOSE_FILE_DEV" up -d --build

    sleep 15

    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        success "✓ Application dev saine"
    else
        warn "Application dev peut prendre quelques secondes de plus..."
    fi
}

# =============================================================================
# Post-déploiement verification
# =============================================================================

post_deploy_verification() {
    log "🔍 Post-déploiement verification..."

    # Test des endpoints critiques
    local endpoints=(
        "/api/health"
        "/api/status"
        "/"
        "/api/categories"
    )

    local all_ok=true

    for endpoint in "${endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" 2>/dev/null || echo "000")
        
        if [[ "$status_code" =~ ^[23] ]]; then
            success "✓ $endpoint → $status_code"
        else
            warn "✗ $endpoint → $status_code"
            all_ok=false
        fi
    done

    if [[ "$all_ok" == true ]]; then
        success "✅ Toutes les vérifications post-déploiement passées"
    else
        warn "⚠️ Certaines vérifications ont échoué - veuillez vérifier manuellement"
    fi
}

# =============================================================================
# Notifications
# =============================================================================

send_notification() {
    local status=$1
    local message=$2

    log "Envoi de la notification..."

    # Notification Slack (optionnel)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color=$([[ "$status" == "success" ]] && echo "good" || echo "danger")
        local emoji=$([[ "$status" == "success" ]] && echo "✅" || echo "❌")
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"$emoji AlgeriaTrade Deploy [$ENVIRONMENT]\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"User\", \"value\": \"$(whoami)\", \"short\": true},
                        {\"title\": \"Host\", \"value\": \"$(hostname)\", \"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true
        
        success "Notification Slack envoyée"
    fi

    # Notification Email (optionnel)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "AlgeriaTrade Deploy [$ENVIRONMENT]: $status" "$NOTIFICATION_EMAIL" 2>/dev/null || true
        success "Notification email envoyée"
    fi
}

# =============================================================================
# Rollback
# =============================================================================

perform_rollback() {
    log "🔄 Exécution du rollback..."

    local last_deploy=$(cat "$BACKUP_DIR/last_successful_deploy.txt" 2>/dev/null || echo "")

    if [[ -z "$last_deploy" ]]; then
        die "Aucun déploiement précédent trouvé pour le rollback"
    fi

    info "Rollback vers: $last_deploy"

    git checkout "$last_deploy"

    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker compose -f "$COMPOSE_FILE_PROD" up -d --build
    else
        docker compose -f "$COMPOSE_FILE_DEV" up -d --build
    fi

    sleep 20

    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        success "✅ Rollback effectué avec succès"
        send_notification "success" "Rollback effectué vers $last_deploy"
    else
        error "❌ Rollback échoué - intervention manuelle requise"
        send_notification "failure" "Rollback ÉCHOUÉ - intervention manuelle requise"
        exit 1
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    setup_directories
    
    parse_args "$@"

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║     🇩🇿 AlgeriaTrade.dz Deployment Tool      ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""

    # Rollback mode
    if [[ "$ROLLBACK" == true ]]; then
        select_environment
        perform_rollback
        exit 0
    fi

    # Déploiement normal
    select_environment
    confirm_deployment
    pre_deploy_checks
    backup_database
    deploy
    post_deploy_verification
    send_notification "success" "Déploiement $ENVIRONMENT terminé avec succès"

    echo ""
    success "========================================"
    success "  DEPLOIEMENT TERMINÉ AVEC SUCCÈS     "
    success "  Environment: $ENVIRONMENT           "
    success "  Timestamp: $(date)                  "
    success "========================================"
    echo ""
}

# Exécuter
main "$@"
