#!/bin/bash
# =============================================================================
# Docker Production Deployment Script for AlgeriaTrade.dz
# =============================================================================
# Script de déploiement Docker Production pour AlgeriaTrade.dz
#
# Full production stack includes / Stack complet de production inclut:
# - PostgreSQL (database robuste) / Base de données PostgreSQL
# - Redis (cache & sessions) / Cache et sessions Redis  
# - Next.js Application / Application Next.js
# - Nginx (reverse proxy SSL) / Reverse proxy SSL Nginx
# - Socket.IO Message Service / Service de messagerie Socket.IO
# - pgAdmin (optional admin) / Administration pgAdmin (optionnel)
# - Redis Commander (optional admin) / Administration Redis Commander (optionnel)
#
# Usage / Utilisation:
#   ./scripts/deployment/deploy-docker.sh              # Full production deploy
#   ./scripts/deployment/deploy-docker.sh --setup-env   # Setup .env.production
#   ./scripts/deployment/deploy-docker.sh --down        # Stop services
#   ./scripts/deployment/deploy-docker.sh --logs        # Show logs
#   ./scripts/deployment/deploy-docker.sh --admin       # Start with admin tools
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
BOLD='\033[1m'
NC='\033[0m'

# Paths / Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
ENV_FILE="$PROJECT_ROOT/.env.production"
LOG_FILE="$PROJECT_ROOT/logs/docker-deploy.log"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Container names / Noms des conteneurs
APP_CONTAINER="algeriatrade-app-prod"
POSTGRES_CONTAINER="algeriatrade-postgres"
REDIS_CONTAINER="algeriatrade-redis-prod"
NGINX_CONTAINER="algeriatrade-nginx-prod"

# Default settings / Paramètres par défaut
COMPOSE_PROFILES=""
SKIP_PULL=false
SKIP_BUILD=false
SHOW_LOGS=false
STOP_SERVICES=false
SETUP_ENV=false
WITH_ADMIN=false
FORCE_MODE=false

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

# Banner / Bannière
show_banner() {
    echo ""
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║${NC}     ${BOLD}🇩🇿  AlgeriaTrade.dz - Docker Production${NC}         ${BOLD}${CYAN}║${NC}"
    echo -e "${BOLD}${CYAN}║${NC}     ${BOLD}Déploiement Production Docker${NC}                      ${BOLD}${CYAN}║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

setup_directories() {
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR/db"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$PROJECT_ROOT/certs"
    touch "$LOG_FILE"
    log "Directories initialized / Répertoires initialisés"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --setup-env|-e)
                SETUP_ENV=true
                shift
                ;;
            --down|-d)
                STOP_SERVICES=true
                shift
                ;;
            --logs|-l)
                SHOW_LOGS=true
                shift
                ;;
            --admin|-a)
                WITH_ADMIN=true
                COMPOSE_PROFILES="admin"
                shift
                ;;
            --skip-pull)
                SKIP_PULL=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --force|-f)
                FORCE_MODE=true
                shift
                ;;
            --backup|-b)
                backup_database
                exit 0
                ;;
            --restore=*)
                RESTORE_FILE="${1#*=}"
                restore_database "$RESTORE_FILE"
                exit 0
                ;;
            --status|-s)
                show_status
                exit 0
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
🐳 AlgeriaTrade.dz Docker Production Deployment

Usage: ./deploy-docker.sh [OPTIONS]

Options:
  -e, --setup-env      Setup .env.production file
  -d, --down           Stop all services
  -l, --logs           Show container logs
  -a, --admin          Start with admin tools (pgAdmin, Redis Commander)
  --skip-pull          Skip pulling latest images
  --skip-build         Skip building images
  -f, --force          Force without confirmation
  -b, --backup         Backup database only
  --restore=FILE       Restore database from file
  -s, --status         Show service status
  -h, --help           Show this help

Examples:
  ./deploy-docker.sh                    # Full production deploy
  ./deploy-docker.sh --setup-env        # First-time setup
  ./deploy-docker.sh --admin            # Deploy with admin tools
  ./deploy-docker.sh --logs             # View logs
  ./deploy-docker.sh --down             # Stop everything

Services:
  - App (Next.js):        http://localhost:3000
  - pgAdmin:              http://localhost:5050 (with --admin)
  - Redis Commander:      http://localhost:8081 (with --admin)
EOF
}

# Setup environment file / Configurer le fichier d'environnement
setup_environment() {
    log "Setting up production environment... / Configuration de l'environnement de production..."

    if [[ -f "$ENV_FILE" ]]; then
        warn ".env.production already exists / .env.production existe déjà"
        read -rp "Overwrite? [y/N] " overwrite
        [[ "$overwrite" != "y" && "$overwrite" != "Y" ]] && return
    fi

    # Generate secrets / Générer les secrets
    local postgres_password=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    local redis_password=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    local nextauth_secret=$(openssl rand -base64 32)
    local two_factor_key=$(openssl rand -hex 32)

    cat > "$ENV_FILE" << EOF
# =============================================================================
# AlgeriaTrade.dz - Production Environment Variables
# =============================================================================
# Generated: $(date)
# ⚠️  UPDATE PASSWORDS AND SECRETS BEFORE DEPLOYMENT!
# ⚠️  METTEZ À JOUR LES MOTS DE PASSE ET SECRETS AVANT LE DÉPLOIEMENT!
# =============================================================================

# --- Application ---
NEXT_PUBLIC_APP_URL=https://algeriatrade.dz
NEXT_PUBLIC_APP_NAME=AlgeriaTrade
NODE_ENV=production
LOG_LEVEL=info

# --- Authentication ---
NEXTAUTH_URL=https://algeriatrade.dz
NEXTAUTH_SECRET=${nextauth_secret}
TWO_FACTOR_ENCRYPTION_KEY=${two_factor_key}

# --- Database (PostgreSQL) ---
POSTGRES_USER=algeriatrade
POSTGRES_PASSWORD=${postgres_password}
POSTGRES_DB=algeriatrade
DATABASE_URL=postgresql://algeriatrade:${postgres_password}@postgres:5432/algeriatrade

# --- Email (Resend recommended) ---
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@algeriatrade.dz

# --- Payment Gateways (Algerian) ---
CIB_API_KEY=
CIB_MERCHANT_ID=
CCP_MERCHANT_ID=
BARIDIMOB_API_KEY=
BARIDIMOB_WEBHOOK_SECRET=

# --- Storage (AWS S3 compatible) ---
S3_BUCKET=algeriatrade-uploads
S3_REGION=eu-west-3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# --- Cache (Redis) ---
REDIS_PASSWORD=${redis_password}
REDIS_URL=redis://:${redis_password}@redis:6379

# --- AI Services (Optional) ---
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_PROVIDER=openai

# --- Analytics ---
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GA_ENABLED=true

# --- Monitoring ---
SENTRY_DSN=

# --- Admin Tools (pgAdmin) ---
PGADMIN_EMAIL=admin@algeriatrade.dz
PGADMIN_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')
EOF

    success "Environment file created: $ENV_FILE"
    warn "⚠️  PLEASE REVIEW AND UPDATE SECRETS BEFORE DEPLOYMENT!"
    warn "⚠️  VEUILLEZ EXAMINER ET METTRE À JOUR LES SECRETS AVANT LE DÉPLOIEMENT!"
    echo ""
    info "Generated passwords:"
    info "  PostgreSQL Password: ${postgres_password}"
    info "  Redis Password: ${redis_password}"
    info "  NextAuth Secret: ${nextauth_secret:0:16}..."
}

# Check prerequisites / Vérifier les prérequis
check_prerequisites() {
    log "Checking prerequisites... / Vérification des prérequis..."

    # Check Docker / Vérifier Docker
    if ! command -v docker &> /dev/null; then
        die "Docker is not installed / Docker n'est pas installé"
    fi
    success "Docker version: $(docker --version)"

    # Check Docker Compose / Vérifier Docker Compose
    if ! docker compose version &> /dev/null; then
        die "Docker Compose is not installed / Docker Compose n'est pas installé"
    fi
    success "Docker Compose version: $(docker compose version)"

    # Check compose file / Vérifier le fichier compose
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        die "Docker compose file not found: $COMPOSE_FILE"
    fi

    # Check env file / Vérifier le fichier env
    if [[ ! -f "$ENV_FILE" ]]; then
        warn "Environment file not found: $ENV_FILE"
        warn "Run with --setup-env to create it / Exécutez avec --setup-env pour le créer"
        read -rp "Continue without .env.production? [y/N] " continue_without
        [[ "$continue_without" != "y" && "$continue_without" != "Y" ]] && exit 1
    fi

    # Check resources / Vérifier les ressources
    local available_mem=$(free -g | awk '/^Mem:/{print $7}')
    local available_disk=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | tr -d 'G')
    
    info "Available memory: ${available_mem}GB"
    info "Available disk: ${available_disk}GB"
    
    if [[ "${available_mem%.*}" -lt 2 ]]; then
        warn "Low memory detected! At least 4GB recommended / Mémoire faible! 4GB recommandés"
    fi
    
    if [[ "$available_disk" -lt 5 ]]; then
        warn "Low disk space! At least 10GB recommended / Espace disque faible! 10GB recommandés"
    fi

    success "Prerequisites check passed / Vérification des prérequis réussie"
}

# Backup database / Sauvegarder la base de données
backup_database() {
    log "Creating database backup... / Création de la sauvegarde de base de données..."

    local backup_file="$BACKUP_DIR/db/backup_${TIMESTAMP}.sql.gz"

    # Check if PostgreSQL container is running / Vérifier si le conteneur PostgreSQL tourne
    if docker ps --format '{{.Names}}' | grep -q "$POSTGRES_CONTAINER"; then
        docker exec "$POSTGRES_CONTAINER" pg_dump \
            -U algeriatrade \
            -d algeriatrade \
            --clean \
            --if-exists \
            2>/dev/null | gzip > "$backup_file"
        
        success "Backup created: $backup_file"
        info "Size: $(du -h "$backup_file" | cut -f1)"
    else
        warn "PostgreSQL container not running, skipping backup"
        return 1
    fi

    # Clean old backups / Nettoyer les anciennes sauvegardes
    find "$BACKUP_DIR/db" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
}

# Restore database / Restaurer la base de données
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        die "Backup file not found: $backup_file"
    fi

    log "Restoring database from backup... / Restauration de la base de données depuis la sauvegarde..."

    if docker ps --format '{{.Names}}' | grep -q "$POSTGRES_CONTAINER"; then
        gunzip -c "$backup_file" | docker exec -i "$POSTGRES_CONTAINER" psql \
            -U algeriatrade \
            -d algeriatrade \
            2>/dev/null
        
        success "Database restored from: $backup_file"
    else
        die "PostgreSQL container is not running"
    fi
}

# Stop existing containers / Arrêter les conteneurs existants
stop_services() {
    log "Stopping existing services... / Arrêt des services existants..."

    cd "$PROJECT_ROOT"

    # Graceful shutdown / Arrêt gracieux
    if docker compose -f "$COMPOSE_FILE" down --timeout 60 2>&1 | tee -a "$LOG_FILE"; then
        success "Services stopped / Services arrêtés"
    else
        warn "Some containers may not have stopped properly / Certains conteneurs peuvent ne pas s'être arrêtés correctement"
        docker compose -f "$COMPOSE_FILE" down --timeout 30 --remove-orphans 2>/dev/null || true
    fi
}

# Pull images / Tirer les images
pull_images() {
    if [[ "$SKIP_PULL" == true ]]; then
        info "Skipping image pull / Tirage d'image ignoré"
        return
    fi

    log "Pulling latest images... / Téléchargement des dernières images..."

    cd "$PROJECT_ROOT"

    docker compose -f "$COMPOSE_FILE" pull 2>&1 | tee -a "$LOG_FILE" || {
        warn "Some images could not be pulled, will build locally / Certaines images n'ont pas pu être tirées, construction locale"
    }

    success "Images pulled / Images téléchargées"
}

# Build images / Construire les images
build_images() {
    if [[ "$SKIP_BUILD" == true ]]; then
        info "Skipping image build / Construction d'image ignorée"
        return
    fi

    log "Building Docker images... / Construction des images Docker..."

    cd "$PROJECT_ROOT"

    local build_args=()
    [[ -f "$ENV_FILE" ]] && build_args+=(--env-file "$ENV_FILE")
    [[ -n "$COMPOSE_PROFILES" ]] && build_args+=(--profile "$COMPOSE_PROFILES")

    if docker compose -f "$COMPOSE_FILE" build "${build_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        success "Images built successfully / Images construites avec succès"
    else
        die "Image build failed / La construction des images a échoué"
    fi
}

# Start services / Démarrer les services
start_services() {
    log "Starting services... / Démarrage des services..."

    cd "$PROJECT_ROOT"

    local up_args=(-d --remove-orphans)
    [[ -n "$COMPOSE_PROFILES" ]] && up_args+=(--profile "$COMPOSE_PROFILES")

    if docker compose -f "$COMPOSE_FILE" up "${up_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        success "Services starting... / Services en cours de démarrage..."
    else
        die "Failed to start services / Échec du démarrage des services"
    fi
}

# Wait for healthy status / Attendre le statut sain
wait_for_healthy() {
    log "Waiting for services to be healthy... / Attente que les services soient sains..."

    local services=("postgres" "redis" "app")
    local max_wait=120
    local waited=0

    for service in "${services[@]}"; do
        info "Waiting for $service... / Attente de $service..."
        local elapsed=0
        
        while [[ $elapsed -lt $max_wait ]]; do
            local health_status=$(docker compose -f "$COMPOSE_FILE" ps "$service" --format json 2>/dev/null | \
                grep -o '"Health":"[^"]*"' | head -1 || echo "")
            
            if [[ "$health_status" == *'"healthy"'* ]] || \
               docker compose -f "$COMPOSE_FILE" ps --format "{{.Name}}" 2>/dev/null | grep -q "$service"; then
                success "$service is ready / $service est prêt"
                break
            fi
            
            sleep 5
            ((elapsed+=5))
            ((waited+=5))
        done

        if [[ $elapsed -ge $max_wait ]]; then
            warn "$service may not be fully ready yet / $service peut ne pas être complètement prêt"
        fi
    done

    # Additional wait for app startup / Attente supplémentaire pour le démarrage de l'app
    info "Waiting for application startup... / Attente du démarrage de l'application..."
    sleep 15
}

# Run database migrations / Exécuter les migrations de base de données
run_migrations() {
    log "Running database migrations... / Exécution des migrations de base de données..."

    cd "$PROJECT_ROOT"

    # Wait for PostgreSQL to be ready / Attendre que PostgreSQL soit prêt
    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if docker exec "$POSTGRES_CONTAINER" pg_isready -U algeriatrade &> /dev/null; then
            break
        fi
        sleep 2
        ((attempt++))
    done

    # Run Prisma migrations / Exécuter les migrations Prisma
    if docker compose -f "$COMPOSE_FILE" exec -T app npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE"; then
        success "Migrations completed / Migrations terminées"
    else
        warn "Migrations may have failed or no pending migrations / Les migrations peuvent avoir échoué ou aucune migration en attente"
    fi
}

# Health check / Contrôle de santé
health_check() {
    log "Running health checks... / Exécution des contrôles de santé..."

    local endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/status"
    )

    local all_healthy=true

    for endpoint in "${endpoints[@]}"; do
        local attempts=0
        local max_attempts=10
        
        while [[ $attempts -lt $max_attempts ]]; do
            if curl -sf --max-time 5 "$endpoint" > /dev/null 2>&1; then
                success "Healthy: $endpoint"
                break
            fi
            
            ((attempts++))
            sleep 3
        done

        if [[ $attempts -ge $max_attempts ]]; then
            warn "Unhealthy: $endpoint"
            all_healthy=false
        fi
    done

    if [[ "$all_healthy" == true ]]; then
        success "All health checks passed / Tous les contrôles de santé ont réussi"
    else
        warn "Some health checks failed. Check logs with: $0 --logs"
        warn "Certains contrôles ont échoué. Consultez les logs avec: $0 --logs"
    fi
}

# Show status / Afficher le statut
show_status() {
    echo ""
    echo -e "${BOLD}AlgeriaTrade.dz Docker Services Status${NC}"
    echo -e "${BOLD}=====================================${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    docker compose -f "$COMPOSE_FILE" ps 2>/dev/null || {
        warn "No services running / Aucun service en cours d'exécution"
    }
    
    echo ""
    echo -e "${BOLD}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | \
        grep -E "(algeriatrade|NAME)" || true
}

# Show logs / Afficher les logs
show_logs() {
    cd "$PROJECT_ROOT"
    
    local follow="${1:-false}"
    local logs_args=()
    
    [[ "$follow" == "follow" ]] && logs_args+=("-f")
    logs_args+=("--tail=100")
    
    docker compose -f "$COMPOSE_FILE" logs "${logs_args[@]}" 2>/dev/null || {
        warn "No logs available / Aucun journal disponible"
    }
}

# Display summary / Afficher le résumé
display_summary() {
    echo ""
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${GREEN}  ✅ DEPLOYMENT COMPLETE! / DÉPLOIEMENT TERMINÉ!               ${NC}"
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BOLD}Services Available:/ Services Disponibles:${NC}"
    echo -e "  🌐  App (Next.js):     ${CYAN}http://localhost:3000${NC}"
    echo -e "  🔒  HTTPS:            ${CYAN}https://algeriatrade.dz${NC}"
    
    if [[ "$WITH_ADMIN" == true ]]; then
        echo -e "  🐘  pgAdmin:           ${CYAN}http://localhost:5050${NC}"
        echo -e "  ⚡  Redis Commander:   ${CYAN}http://localhost:8081${NC}"
    fi
    
    echo ""
    echo -e "  ${BOLD}Useful Commands:/ Commandes Utiles:${NC}"
    echo -e "  View logs:    ${YELLOW}$0 --logs${NC}"
    echo -e "  Stop all:     ${YELLOW}$0 --down${NC}"
    echo -e "  Status:       ${YELLOW}$0 --status${NC}"
    echo -e "  Backup DB:    ${YELLOW}$0 --backup${NC}"
    echo ""
    echo -e "  ${BOLD}Timestamp: ${NC}$(date)"
    echo ""
}

# Send notification / Envoyer une notification
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color=$([[ "$status" == "success" ]] && echo "good" || echo "danger")
        local emoji=$([[ "$status" == "success" ]] && echo "✅" || echo "❌")

        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"${emoji} AlgeriaTrade Docker Deploy\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Host\", \"value\": \"$(hostname)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"Containers\", \"value\": \"$(docker ps --filter 'name=algeriatrade' -q | wc -l)\", \"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true
    fi
}

# =============================================================================
# Main / Principal
# =============================================================================

main() {
    setup_directories
    parse_args "$@"
    show_banner

    # Handle specific modes / Gérer les modes spécifiques
    [[ "$STOP_SERVICES" == true ]] && { stop_services; exit 0; }
    [[ "$SHOW_LOGS" == true ]] && { show_logs "follow"; exit 0; }
    [[ "$SETUP_ENV" == true ]] && { setup_environment; exit 0; }

    # Confirm deployment / Confirmer le déploiement
    if [[ "$FORCE_MODE" != true ]]; then
        warn "This will restart ALL production containers / Cela redémarrera TOUS les conteneurs de production"
        read -rp "Continue with deployment? [y/N] " confirm
        [[ "$confirm" != "y" && "$confirm" != "Y" ]] && {
            info "Deployment cancelled / Déploiement annulé"
            exit 0
        }
    fi

    # Execute deployment steps / Exécuter les étapes de déploiement
    check_prerequisites
    backup_database
    stop_services
    pull_images
    build_images
    start_services
    wait_for_healthy
    run_migrations
    health_check
    display_summary

    send_notification "success" "Docker production deployment completed at $(date)"
}

main "$@"
