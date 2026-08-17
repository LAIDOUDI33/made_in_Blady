#!/bin/bash
# =============================================================================
# Production Backup Script
# =============================================================================
# AlgeriaTrade.dz B2B Platform - Automated Backup Strategy
#
# This script handles automated backups for production:
#   - PostgreSQL daily backups (30-day retention)
#   - Redis snapshots (hourly)
#   - Uploaded files backup (S3/GCS sync)
#   - Configuration version control
#
# Usage:
#   chmod +x scripts/backup-production.sh
#   ./scripts/backup-production.sh [OPTIONS]
#
# Cron Schedule Examples:
#   # Full backup daily at 2 AM UTC
#   0 2 * * * /opt/algeriatrade/scripts/backup-production.sh --full
#   
#   # Database backup every 6 hours
#   0 */6 * * * /opt/algeriatrade/scripts/backup-production.sh --database
#   
#   # Redis snapshot hourly
#   0 * * * * /opt/algeriatrade/scripts/backup-production.sh --redis
#
# Prerequisites:
#   - AWS CLI configured for S3 backups (or gsutil for GCS)
#   - Docker access for database dumps
#   - Sufficient disk space for local backups
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp for backup filenames
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y%m%d")

# Backup directories
LOCAL_BACKUP_DIR="${LOCAL_BACKUP_DIR:-$PROJECT_ROOT/backups}"
DB_BACKUP_DIR="$LOCAL_BACKUP_DIR/database"
REDIS_BACKUP_DIR="$LOCAL_BACKUP_DIR/redis"
FILES_BACKUP_DIR="$LOCAL_BACKUP_DIR/files"
CONFIG_BACKUP_DIR="$LOCAL_BACKUP_DIR/config"

# Retention policies (in days)
DB_RETENTION_DAYS="${DB_RETENTION_DAYS:-30}"
REDIS_RETENTION_DAYS="${REDIS_RETENTION_DAYS:-7}"
FILES_RETENTION_DAYS="${FILES_RETENTION_DAYS:-30}"
LOGS_RETENTION_DAYS="${LOGS_RETENTION_DAYS:-7}"

# Cloud storage settings
BACKUP_STORAGE_PROVIDER="${BACKUP_STORAGE_PROVIDER:-local}"  # local | s3 | gcs
S3_BUCKET="${S3_BUCKET:-algeriatrade-backups}"
S3_REGION="${S3_REGION:-eu-west-3}"
GCS_BUCKET="${GCS_BUCKET:-algeriatrade-backups}"

# Docker compose file
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.production.yml"
COMPOSE_CMD="docker compose -f $DOCKER_COMPOSE_FILE"

# Notification settings
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"; }

# ---------------------------------------------------------------------------
# Utility Functions
# ---------------------------------------------------------------------------

create_backup_dirs() {
    log_info "Creating backup directories..."
    mkdir -p "$DB_BACKUP_DIR" "$REDIS_BACKUP_DIR" "$FILES_BACKUP_DIR" "$CONFIG_BACKUP_DIR"
}

cleanup_old_backups() {
    local dir=$1
    local days=$2
    
    if [[ -d "$dir" ]]; then
        log_info "Cleaning up backups older than $days days in $dir..."
        find "$dir" -type f -mtime +$days -delete 2>/dev/null || true
        log_success "Cleanup completed for $dir"
    fi
}

send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji="✅"
        local color="good"
        
        if [[ "$status" != "success" ]]; then
            emoji="❌"
            color="danger"
        fi
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"$emoji AlgeriaTrade Backup - $status\",
                    \"text\": \"$message\",
                    \"ts\": $(date +%s),
                    \"fields\": [{
                        \"title\": \"Server\",
                        \"value\": \"$(hostname)\",
                        \"short\": true
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }]
                }]
            }" > /dev/null 2>&1 || true
    fi
}

sync_to_cloud() {
    local source_dir=$1
    local remote_prefix=$2
    
    case "$BACKUP_STORAGE_PROVIDER" in
        s3)
            log_info "Syncing to S3: s3://$S3_BUCKET/$remote_prefix/"
            aws s3 sync "$source_dir/" "s3://$S3_BUCKET/$remote_prefix/" \
                --region "$S3_REGION" \
                --storage-class STANDARD_IA \
                --delete || log_warn "S3 sync failed"
            ;;
        gcs)
            log_info "Syncing to GCS: gs://$GCS_BUCKET/$remote_prefix/"
            gsutil -m rsync -r "$source_dir/" "gs://$GCS_BUCKET/$remote_prefix/" || log_warn "GCS sync failed"
            ;;
        *)
            log_info "Cloud sync skipped (provider: $BACKUP_STORAGE_PROVIDER)"
            ;;
    esac
}

# ---------------------------------------------------------------------------
# PostgreSQL Backup Functions
# ---------------------------------------------------------------------------

backup_postgresql() {
    log_info "Starting PostgreSQL backup..."
    
    local backup_file="$DB_BACKUP_DIR/postgresql_${TIMESTAMP}.sql.gz"
    local backup_status="success"
    local error_message=""
    
    # Execute pg_dump inside the container
    if $COMPOSE_CMD exec -T db pg_dumpall \
        -U "${POSTGRES_USER:-algeriatrade}" \
        --no-password 2>/dev/null | gzip > "$backup_file"; then
        
        # Verify backup file exists and has content
        if [[ -f "$backup_file" ]] && [[ -s "$backup_file" ]]; then
            local file_size=$(du -h "$backup_file" | cut -f1)
            log_success "PostgreSQL backup completed: $backup_file ($file_size)"
            
            # Create checksum
            md5sum "$backup_file" > "${backup_file}.md5"
            
            # Sync to cloud
            sync_to_cloud "$DB_BACKUP_DIR" "database"
            
            # Cleanup old backups
            cleanup_old_backups "$DB_BACKUP_DIR" "$DB_RETENTION_DAYS"
        else
            backup_status="failed"
            error_message="Backup file is empty or missing"
            log_error "$error_message"
        fi
    else
        backup_status="failed"
        error_message="pg_dump command failed"
        log_error "$error_message"
    fi
    
    return 0
}

backup_postgresql_custom() {
    log_info "Starting PostgreSQL custom format backup..."
    
    local backup_file="$DB_BACKUP_DIR/postgresql_custom_${TIMESTAMP}.dump"
    
    $COMPOSE_CMD exec -T db pg_dump \
        -U "${POSTGRES_USER:-algeriatrade}" \
        -d "${POSTGRES_DB:-algeriatrade}" \
        -F c \
        -f "/tmp/backup.dump" 2>/dev/null
    
    $COMPOSE_CMD cp "db:/tmp/backup.dump" "$backup_file"
    
    if [[ -f "$backup_file" ]]; then
        gzip "$backup_file"
        local file_size=$(du -h "${backup_file}.gz" | cut -f1)
        log_success "PostgreSQL custom backup: ${backup_file}.gz ($file_size)"
    else
        log_error "Custom format backup failed"
    fi
}

# ---------------------------------------------------------------------------
# Redis Backup Functions
# ---------------------------------------------------------------------------

backup_redis() {
    log_info "Starting Redis backup..."
    
    local backup_file="$REDIS_BACKUP_DIR/redis_${TIMESTAMP}.rdb"
    
    # Trigger Redis SAVE command to create RDB snapshot
    $COMPOSE_EXEC redis redis-cli -a "${REDIS_PASSWORD:-changeme}" BGSAVE 2>/dev/null || true
    
    # Wait for save to complete
    sleep 5
    
    # Copy RDB file from container
    $COMPOSE_CMD cp "redis:/data/dump.rdb" "$backup_file" 2>/dev/null || {
        log_warn "Could not copy RDB file, trying alternative method..."
        return 1
    }
    
    if [[ -f "$backup_file" ]]; then
        # Compress the backup
        gzip -f "$backup_file"
        local file_size=$(du -h "${backup_file}.gz" | cut -f1)
        log_success "Redis backup completed: ${backup_file}.gz ($file_size)"
        
        # Create checksum
        md5sum "${backup_file}.gz" > "${backup_file}.gz.md5"
        
        # Sync to cloud
        sync_to_cloud "$REDIS_BACKUP_DIR" "redis"
        
        # Cleanup old backups
        cleanup_old_backups "$REDIS_BACKUP_DIR" "$REDIS_RETENTION_DAYS"
    else
        log_error "Redis backup file not created"
        return 1
    fi
}

export_redis_data() {
    log_info "Exporting Redis data as JSON..."
    
    local export_file="$REDIS_BACKUP_DIR/redis_export_${TIMESTAMP}.json"
    
    # Export all keys to JSON using redis-cli
    $COMPOSE_CMD exec -T redis redis-cli -a "${REDIS_PASSWORD:-changeme}" \
        --scan | while read key; do
            type=$($COMPOSE_CMD exec -T redis redis-cli -a "${REDIS_PASSWORD:-changeme}" TYPE "$key")
            value=$($COMPOSE_CMD exec -T redis redis-cli -a "${REDIS_PASSWORD:-changeme}" GET "$key" 2>/dev/null || echo "")
            echo "{\"key\":\"$key\",\"type\":\"$type\",\"value\":$value}"
        done > "$export_file" 2>/dev/null || true
    
    if [[ -f "$export_file" ]] && [[ -s "$export_file" ]]; then
        gzip -f "$export_file"
        log_success "Redis export completed: ${export_file}.gz"
    else
        log_warn "Redis export may be empty"
    fi
}

# ---------------------------------------------------------------------------
# Files Backup Functions
# ---------------------------------------------------------------------------

backup_uploaded_files() {
    log_info "Backing up uploaded files..."
    
    local uploads_dir="$PROJECT_ROOT/uploads"
    local backup_file="$FILES_BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
    
    if [[ -d "$uploads_dir" ]]; then
        # Create tar archive of uploads
        tar -czf "$backup_file" -C "$(dirname "$uploads_dir")" "$(basename "$uploads_dir")" 2>/dev/null
        
        if [[ -f "$backup_file" ]]; then
            local file_size=$(du -h "$backup_file" | cut -f1)
            log_success "Files backup completed: $backup_file ($file_size)"
            
            # Create checksum
            md5sum "$backup_file" > "${backup_file}.md5"
            
            # Sync to cloud
            sync_to_cloud "$FILES_BACKUP_DIR" "files"
            
            # Cleanup old backups
            cleanup_old_backups "$FILES_BACKUP_DIR" "$FILES_RETENTION_DAYS"
        else
            log_error "Failed to create files archive"
        fi
    else
        log_warn "Uploads directory not found: $uploads_dir"
    fi
}

sync_files_to_s3() {
    log_info "Syncing uploaded files to S3..."
    
    local uploads_dir="$PROJECT_ROOT/uploads"
    
    if [[ -d "$uploads_dir" ]] && [[ "$BACKUP_STORAGE_PROVIDER" == "s3" ]]; then
        aws s3 sync "$uploads_dir/" "s3://$S3_BUCKET/uploads/" \
            --region "$S3_REGION" \
            --delete \
            --exclude "*.tmp" \
            --exclude ".DS_Store" || log_warn "S3 sync for uploads failed"
        
        log_success "Files synced to S3"
    fi
}

# ---------------------------------------------------------------------------
# Configuration Backup Functions
# ---------------------------------------------------------------------------

backup_configuration() {
    log_info "Backing up configuration files..."
    
    local config_backup_dir="$CONFIG_BACKUP_DIR/config_${TIMESTAMP}"
    mkdir -p "$config_backup_dir"
    
    # Copy important configuration files
    for file in \
        docker-compose.production.yml \
        .env.production \
        nginx.conf \
        next.config.ts \
        prisma/schema.prisma; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            cp "$PROJECT_ROOT/$file" "$config_backup_dir/" 2>/dev/null || true
        fi
    done
    
    # Create archive
    local backup_file="$CONFIG_BACKUP_DIR/configuration_${TIMESTAMP}.tar.gz"
    tar -czf "$backup_file" -C "$CONFIG_BACKUP_DIR" "config_${TIMESTAMP}" 2>/dev/null
    
    if [[ -f "$backup_file" ]]; then
        rm -rf "$config_backup_dir"
        local file_size=$(du -h "$backup_file" | cut -f1)
        log_success "Configuration backup: $backup_file ($file_size)"
        
        # Sync to cloud
        sync_to_cloud "$CONFIG_BACKUP_DIR" "config"
    fi
}

# ---------------------------------------------------------------------------
# Full Backup Function
# ---------------------------------------------------------------------------

run_full_backup() {
    log_info "========================================="
    log_info "Starting FULL BACKUP at $(date)"
    log_info "========================================="
    
    local start_time=$(date +%s)
    local errors=0
    
    create_backup_dirs
    
    # Run all backups
    backup_postgresql || ((errors++))
    backup_redis || ((errors++))
    backup_uploaded_files || ((errors++))
    backup_configuration || ((errors++))
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "========================================="
    log_info "FULL BACKUP COMPLETED in ${duration}s"
    log_info "Errors encountered: $errors"
    log_info "========================================="
    
    # Send notification
    if [[ $errors -eq 0 ]]; then
        send_notification "success" "Full backup completed successfully in ${duration}s"
    else
        send_notification "failure" "Full backup completed with $errors errors in ${duration}s"
    fi
    
    return $errors
}

# ---------------------------------------------------------------------------
# Verification & Restore Functions
# ---------------------------------------------------------------------------

verify_backup() {
    local backup_file=$1
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Verifying backup: $backup_file"
    
    # Check file integrity based on type
    case "$backup_file" in
        *.sql.gz)
            gunzip -t "$backup_file" 2>/dev/null && log_success "SQL backup is valid" || log_error "SQL backup is corrupted"
            ;;
        *.dump.gz)
            gunzip -t "$backup_file" 2>/dev/null && log_success "Custom dump is valid" || log_error "Custom dump is corrupted"
            ;;
        *.tar.gz)
            tar -tzf "$backup_file" > /dev/null 2>&1 && log_success "Archive is valid" || log_error "Archive is corrupted"
            ;;
        *)
            log_warn "Unknown backup type, skipping verification"
            ;;
    esac
    
    # Check MD5 if available
    if [[ -f "${backup_file}.md5" ]]; then
        cd "$(dirname "$backup_file")"
        md5sum -c "$(basename "${backup_file}.md5")" && log_success "MD5 checksum verified" || log_error "MD5 checksum mismatch"
    fi
}

list_backups() {
    log_info "Available backups:"
    echo ""
    
    echo "=== PostgreSQL Backups ==="
    ls -lh "$DB_BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    
    echo "=== Redis Backups ==="
    ls -lh "$REDIS_BACKUP_DIR"/*.rdb.gz 2>/dev/null || echo "No backups found"
    echo ""
    
    echo "=== File Backups ==="
    ls -lh "$FILES_BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
    echo ""
    
    echo "=== Config Backups ==="
    ls -lh "$CONFIG_BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
}

restore_database() {
    local backup_file=$1
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warn "WARNING: This will overwrite the current database!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    log_info "Restoring database from: $backup_file"
    
    gunzip -c "$backup_file" | $COMPOSE_CMD exec -T db psql \
        -U "${POSTGRES_USER:-algeriatrade}" \
        -d "${POSTGRES_DB:-algeriatrade}" 2>/dev/null
    
    log_success "Database restore completed"
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --full              Run full backup (database + redis + files + config)"
    echo "  --database          Backup PostgreSQL only"
    echo "  --redis             Backup Redis only"
    echo "  --files             Backup uploaded files only"
    echo "  --config            Backup configuration files only"
    echo "  --list              List all available backups"
    echo "  --verify <file>     Verify a backup file's integrity"
    echo "  --restore <file>    Restore database from backup"
    echo "  --cleanup           Clean up old backups based on retention policy"
    echo "  --cloud-sync        Sync all local backups to cloud storage"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  LOCAL_BACKUP_DIR    Local backup directory (default: ./backups)"
    echo "  DB_RETENTION_DAYS   Database backup retention (default: 30)"
    echo "  REDIS_RETENTION_DAYS Redis backup retention (default: 7)"
    echo "  BACKUP_STORAGE_PROVIDER Storage provider: local|s3|gcs"
    echo "  S3_BUCKET           S3 bucket name for cloud backups"
    echo "  SLACK_WEBHOOK_URL   Slack webhook for notifications"
    echo ""
    echo "Examples:"
    echo "  $0 --full                          # Run full backup"
    echo "  $0 --database                      # Backup database only"
    echo "  $0 --list                          # List all backups"
    echo "  $0 --verify ./backups/db/file.sql.gz  # Verify backup"
}

# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

main() {
    local action="${1:---help}"
    
    case "$action" in
        --full)
            run_full_backup
            ;;
            
        --database|--postgres|--pg)
            create_backup_dirs
            backup_postgresql
            ;;
            
        --redis)
            create_backup_dirs
            backup_redis
            ;;
            
        --files|--uploads)
            create_backup_dirs
            backup_uploaded_files
            ;;
            
        --config|--configuration)
            create_backup_dirs
            backup_configuration
            ;;
            
        --list|--ls)
            list_backups
            ;;
            
        --verify)
            verify_backup "${2:?Please specify a backup file}"
            ;;
            
        --restore)
            restore_database "${2:?Please specify a backup file}"
            ;;
            
        --cleanup)
            cleanup_old_backups "$DB_BACKUP_DIR" "$DB_RETENTION_DAYS"
            cleanup_old_backups "$REDIS_BACKUP_DIR" "$REDIS_RETENTION_DAYS"
            cleanup_old_backups "$FILES_BACKUP_DIR" "$FILES_RETENTION_DAYS"
            cleanup_old_backups "$CONFIG_BACKUP_DIR" "$FILES_RETENTION_DAYS"
            log_success "Cleanup completed"
            ;;
            
        --cloud-sync)
            sync_to_cloud "$DB_BACKUP_DIR" "database"
            sync_to_cloud "$REDIS_BACKUP_DIR" "redis"
            sync_to_cloud "$FILES_BACKUP_DIR" "files"
            sync_to_cloud "$CONFIG_BACKUP_DIR" "config"
            log_success "Cloud sync completed"
            ;;
            
        -h|--help)
            print_usage
            ;;
            
        *)
            log_error "Unknown option: $action"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function with provided arguments
main "$@"
