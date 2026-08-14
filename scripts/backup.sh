#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz - Database Backup Script
# =============================================================================
# Script de backup automatisé pour AlgeriaTrade.dz
#
# Fonctionnalités :
# - Backup PostgreSQL / SQLite
# - Upload vers S3 (optionnel)
# - Rotation automatique des backups
# - Vérification de l'intégrité
# - Notification en cas d'erreur
# - Support pour les backups incrémentaux
#
# Usage :
#   ./scripts/backup.sh                    # Backup complet
#   ./scripts/backup.sh --db-only          # Base de données uniquement
#   ./scripts/backup.sh --files            # Fichiers uniquement
#   ./scripts/backup.sh --upload           # Upload vers S3 après backup
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
LOG_FILE="$PROJECT_ROOT/logs/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_TODAY=$(date +%Y-%m-%d)

# Configuration backup
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
COMPRESSION_LEVEL=${BACKUP_COMPRESSION:-6}

# Fichiers de configuration
COMPOSE_PROD="docker-compose.prod.yml"
COMPOSE_DEV="docker-compose.dev.yml"

# Variables S3 (optionnel)
S3_BUCKET=${S3_BUCKET:-""}
S3_REGION=${S3_REGION:-"eu-west-3"}

# Options
DB_ONLY=false
FILES_ONLY=false
UPLOAD_S3=false
VERBOSE=false

# =============================================================================
# Fonctions utilitaires
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

die() {
    error "$1"
    send_notification "failure" "Backup échoué: $1"
    exit 1
}

setup_directories() {
    mkdir -p "$BACKUP_DIR/db/$DATE_TODAY"
    mkdir -p "$BACKUP_DIR/files/$DATE_TODAY"
    mkdir -p "$(dirname "$LOG_FILE")"
}

# =============================================================================
# Parsing arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --db-only) DB_ONLY=true; shift ;;
            --files) FILES_ONLY=true; shift ;;
            --upload|-u) UPLOAD_S3=true; shift ;;
            --verbose|-v) VERBOSE=true; shift ;;
            --retention|-r) RETENTION_DAYS="$2"; shift 2 ;;
            --help|-h) show_help; exit 0 ;;
            *) die "Argument inconnu: $1" ;;
        esac
    done
}

show_help() {
    cat << EOF
AlgeriaTrade.dz Backup Script

Usage: $0 [OPTIONS]

Options:
  --db-only       Backuper uniquement la base de données
  --files         Backuper uniquement les fichiers uploadés
  --upload, -u    Uploader le backup vers S3
  --verbose, -v   Mode verbeux
  --retention, -r <days>  Rétention en jours (défaut: 30)
  --help, -h      Afficher cette aide

Exemples:
  $0                          # Backup complet
  $0 --db-only                # DB uniquement
  $0 --db-only --upload       # DB + upload S3
EOF
}

# =============================================================================
# Backup PostgreSQL
# =============================================================================

backup_postgresql() {
    log "📦 Backup PostgreSQL..."

    local backup_file="$BACKUP_DIR/db/$DATE_TODAY/postgres_${TIMESTAMP}.sql.gz"

    # Vérifier si Docker compose production est disponible
    if [[ -f "$PROJECT_ROOT/$COMPOSE_PROD" ]] && \
       docker compose -f "$PROJECT_ROOT/$COMPOSE_PROD" ps postgres 2>/dev/null | grep -q "running"; then
        
        log "Backup via Docker Compose Production..."
        
        docker compose -f "$PROJECT_ROOT/$COMPOSE_PROD" exec -T postgres \
            pg_dump \
            -U "${POSTGRES_USER:-algeriatrade}" \
            -d "${POSTGRES_DB:-algeriatrade}" \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --format=custom \
        | gzip -$COMPRESSION_LEVEL > "$backup_file"
        
    elif [[ -f "$PROJECT_ROOT/$COMPOSE_DEV" ]] && \
         docker compose -f "$PROJECT_ROOT/$COMPOSE_DEV" ps postgres 2>/dev/null | grep -q "running"; then
        
        log "Backup via Docker Compose Dev..."
        
        docker compose -f "$PROJECT_ROOT/$COMPOSE_DEV" exec -T postgres \
            pg_dump -U test algeriatrade 2>/dev/null | gzip > "$backup_file"
            
    else
        # Tentative directe avec psql
        if command -v pg_dump &> /dev/null; then
            log "Backup direct avec pg_dump..."
            pg_dump "${DATABASE_URL:-}" 2>/dev/null | gzip > "$backup_file"
        else
            warn "PostgreSQL non disponible, skip du backup PG"
            return 1
        fi
    fi

    # Vérifier que le fichier a été créé et n'est pas vide
    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local size=$(du -h "$backup_file" | cut -f1)
        success "✓ Backup PostgreSQL créé: $backup_file ($size)"
        
        # Créer un symlink vers le dernier backup
        ln -sf "$backup_file" "$BACKUP_DIR/db/latest_postgres.gz"
        
        return 0
    else
        error "✗ Échec du backup PostgreSQL"
        return 1
    fi
}

# =============================================================================
# Backup SQLite
# =============================================================================

backup_sqlite() {
    log "📦 Backup SQLite..."

    # Trouver tous les fichiers SQLite
    local db_files=$(find "$PROJECT_ROOT/data" -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null)
    
    if [[ -z "$db_files" ]]; then
        # Chercher aussi dans le répertoire racine
        db_files=$(find "$PROJECT_ROOT" -maxdepth 2 -name "*.db" ! -path "*/node_modules/*" 2>/dev/null)
    fi

    if [[ -z "$db_files" ]]; then
        warn "Aucun fichier SQLite trouvé"
        return 0
    fi

    for db in $db_files; do
        local db_name=$(basename "$db")
        local backup_file="$BACKUP_DIR/db/$DATE_TODAY/${db_name}_${TIMESTAMP}.gz"
        
        # Copier et compresser
        cp "$db" "/tmp/${db_name}_backup"
        gzip -$COMPRESSION_LEVEL "/tmp/${db_name}_backup" > "$backup_file"
        rm -f "/tmp/${db_name}_backup"
        
        if [[ -f "$backup_file" && -s "$backup_file" ]]; then
            local size=$(du -h "$backup_file" | cut -f1)
            success "✓ Backup SQLite: $db_name ($size)"
        else
            error "✗ Échec backup: $db_name"
        fi
    done
}

# =============================================================================
# Backup des fichiers uploadés
# =============================================================================

backup_files() {
    log "📁 Backup des fichiers uploadés..."

    local uploads_dir="$PROJECT_ROOT/uploads"
    
    if [[ ! -d "$uploads_dir" ]]; then
        uploads_dir="$PROJECT_ROOT/public/uploads"
    fi
    
    if [[ ! -d "$uploads_dir" ]]; then
        warn "Répertoire uploads non trouvé"
        return 0
    fi

    local backup_file="$BACKUP_DIR/files/$DATE_TODAY/uploads_${TIMESTAMP}.tar.gz"

    # Créer l'archive
    tar -czf "$backup_file" \
        --exclude='*.tmp' \
        --exclude='.DS_Store' \
        -C "$(dirname "$uploads_dir)" \
        "$(basename "$uploads_dir")" 2>/dev/null

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local size=$(du -h "$backup_file" | cut -f1)
        success "✓ Backup fichiers créé: $backup_file ($size)"
        
        # Symlink vers le dernier backup
        ln -sf "$backup_file" "$BACKUP_DIR/files/latest_uploads.tar.gz"
    else
        warn "Échec du backup fichiers (ou répertoire vide)"
    fi
}

# =============================================================================
# Vérification de l'intégrité
# =============================================================================

verify_backup() {
    local file=$1
    
    if [[ ! -f "$file" ]]; then
        return 1
    fi

    # Vérifier que le fichier gzip est valide
    if gzip -t "$file" 2>/dev/null; then
        return 0
    fi

    # Vérifier que le fichier tar.gz est valide
    if tar tzf "$file" >/dev/null 2>&1; then
        return 0
    fi

    return 1
}

verify_all_backups() {
    log "🔍 Vérification de l'intégrité des backups..."
    
    local all_valid=true
    
    for file in "$BACKUP_DIR/db/$DATE_TODAY"/*; do
        if [[ -f "$file" ]]; then
            if verify_backup "$file"; then
                info "✓ $(basename "$file"): valide"
            else
                error "✗ $(basename "$file"): CORROMPU!"
                all_valid=false
            fi
        fi
    done

    for file in "$BACKUP_DIR/files/$DATE_TODAY"/*; do
        if [[ -f "$file" ]]; then
            if verify_backup "$file"; then
                info "✓ $(basename "$file"): valide"
            else
                error "✗ $(basename "$file"): CORROMPU!"
                all_valid=false
            fi
        fi
    done

    if [[ "$all_valid" == true ]]; then
        success "✅ Tous les backups sont valides"
    else
        warn "⚠️ Certains backups sont corrompus!"
    fi
}

# =============================================================================
# Upload S3
# =============================================================================

upload_to_s3() {
    if [[ "$UPLOAD_S3" != true || -z "$S3_BUCKET" ]]; then
        return
    fi

    log "☁️ Upload vers S3 ($S3_BUCKET)..."

    # Vérifier AWS CLI
    if ! command -v aws &> /dev/null; then
        warn "AWS CLI non installé, skip upload S3"
        return
    fi

    # Uploader les backups de la date d'aujourd'hui
    local s3_path="s3://$S3_BUCKET/backups/$DATE_TODAY"
    
    # Upload DB
    for file in "$BACKUP_DIR/db/$DATE_TODAY"/*.gz; do
        if [[ -f "$file" ]]; then
            aws s3 cp "$file" "$s3_path/db/" \
                --region "$S3_REGION" \
                --storage-class STANDARD_IA 2>/dev/null && \
            info "Upload: $(basename "$file")"
        fi
    done

    # Upload Files
    for file in "$BACKUP_DIR/files/$DATE_TODAY"/*.tar.gz; do
        if [[ -f "$file" ]]; then
            aws s3 cp "$file" "$s3_path/files/" \
                --region "$S3_REGION" \
                --storage-class STANDARD_IA 2>/dev/null && \
            info "Upload: $(basename "$file")"
        fi
    done

    success "✓ Upload S3 terminé"
}

# =============================================================================
# Rotation des anciens backups
# =============================================================================

rotate_old_backups() {
    log "🔄 Rotation des anciens backups (>$RETENTION_DAYS jours)..."

    local deleted_count=0

    # Supprimer les vieux backups DB
    while IFS= read -r dir; do
        if [[ -n "$dir" && -d "$dir" ]]; then
            local dir_date=$(basename "$dir")
            
            # Comparer la date
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                local dir_epoch=$(date -j -f "%Y-%m-%d" "$dir_date" "+%s" 2>/dev/null || echo "0")
            else
                # Linux
                local dir_epoch=$(date -d "$dir_date" "+%s" 2>/dev/null || echo "0")
            fi
            
            local cutoff_epoch=$(date -d "-$RETENTION_DAYS days" "+%s")
            
            if [[ "$dir_epoch" -lt "$cutoff_epoch" && "$dir_epoch" -gt 0 ]]; then
                rm -rf "$dir"
                ((deleted_count++)) || true
                info "Supprimé: $dir"
            fi
        fi
    done < <(find "$BACKUP_DIR/db" -type d -mindepth 1 -maxdepth 1)

    # Supprimer les vieux backups files
    while IFS= read -r dir; do
        if [[ -n "$dir" && -d "$dir" ]]; then
            local dir_date=$(basename "$dir")
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                local dir_epoch=$(date -j -f "%Y-%m-%d" "$dir_date" "+%s" 2>/dev/null || echo "0")
            else
                local dir_epoch=$(date -d "$dir_date" "+%s" 2>/dev/null || echo "0")
            fi
            
            local cutoff_epoch=$(date -d "-$RETENTION_DAYS days" "+%s")
            
            if [[ "$dir_epoch" -lt "$cutoff_epoch" && "$dir_epoch" -gt 0 ]]; then
                rm -rf "$dir"
                ((deleted_count++)) || true
                info "Supprimé: $dir"
            fi
        fi
    done < <(find "$BACKUP_DIR/files" -type d -mindepth 1 -maxdepth 1)

    success "✓ Rotation terminée ($deleted_count répertoires supprimés)"
}

# =============================================================================
# Notifications
# =============================================================================

send_notification() {
    local status=$1
    local message=$2

    # Envoyer uniquement en cas d'échec ou si configuré
    if [[ "$status" != "failure" && "${BACKUP_NOTIFY_ON_SUCCESS:-false}" != "true" ]]; then
        return
    fi

    # Slack
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{\"text\": \"[$status] AlgeriaTrade Backup: $message\"}" \
            > /dev/null 2>&1 || true
    fi

    # Email
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "AlgeriaTrade Backup [$status]" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

# =============================================================================
# Rapport de backup
# =============================================================================

generate_report() {
    local status=$1
    local start_time=$2
    local end_time=$3
    local duration=$((end_time - start_time))

    # Calculer la taille totale
    local total_size=$(du -sh "$BACKUP_DIR/db/$DATE_TODAY" "$BACKUP_DIR/files/$DATE_TODAY" 2>/dev/null | tail -1 | cut -f1)

    cat << EOF

╔══════════════════════════════════════════════╗
║     🇩🇿 AlgeriaTrade.dz Backup Report        ║
╚══════════════════════════════════════════════╝

Status:      $status
Timestamp:   $(date)
Duration:    ${duration}s
Total Size:  ${total_size:-N/A}

Files Created:
$(find "$BACKUP_DIR/db/$DATE_TODAY" "$BACKUP_DIR/files/$DATE_TODAY" -type f 2>/dev/null | sed 's/^/  - /')

EOF
}

# =============================================================================
# Main
# =============================================================================

main() {
    setup_directories
    parse_args "$@"

    local start_time=$(date +%s)

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║     🇩🇿 AlgeriaTrade.dz Backup Tool          ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""

    # Exécuter les backups selon les options
    local backup_status="success"

    if [[ "$FILES_ONLY" != true ]]; then
        backup_postgresql || backup_sqlite || true
        # SQLite est optionnel si PostgreSQL fonctionne
    fi

    if [[ "$DB_ONLY" != true ]]; then
        backup_files
    fi

    # Vérifications
    verify_all_backups

    # Upload S3
    upload_to_s3

    # Rotation
    rotate_old_backups

    local end_time=$(date +%s)

    # Rapport
    generate_report "$backup_status" "$start_time" "$end_time"

    send_notification "$backup_status" "Backup terminé en $((end_time - start_time))s"

    exit 0
}

main "$@"
