#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz - Docker Production Deployment Script
# =============================================================================
# Usage: ./deploy-docker.sh [command]
#   Commands:
#     up        - Start production stack (docker-compose up -d)
#     down      - Stop production stack
#     restart   - Restart all services
#     logs      - View logs from all services
#     status    - Check status of all services
#     setup      - Initial setup (create .env, generate secrets)
#     backup     - Create database backup
#     restore    - Restore from backup
#     update     - Pull latest images and recreate containers
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="algeriatrade"

# Helper functions
print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║          AlgeriaTrade.dz - Docker Deployment          ║"
    echo "║              Production Environment                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker environment ready${NC}"
}

generate_secrets() {
    echo -e "${BLUE}🔐 Generating secure secrets...${NC}"
    
    # Generate random passwords and keys
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    NEXTAUTH_SECRET=$(openssl rand -base64 48)
    
    # Create .env.production if it doesn't exist
    if [ ! -f ".env.production" ]; then
        cat > .env.production << EOF
# =============================================================================
# Auto-generated production environment variables
# Generated: $(date)
# =============================================================================

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://algeriatrade.dz
NEXT_PUBLIC_APP_NAME=AlgeriaTrade

# Database
POSTGRES_USER=algeriatrade
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=algeriatrade
DATABASE_URL=postgresql://algeriatrade:${POSTGRES_PASSWORD}@postgres:5432/algeriatrade

# Auth
NEXTAUTH_URL=https://algeriatrade.dz
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# Socket.IO
SOCKET_IO_PORT=3003

# Logging
LOG_LEVEL=info
EOF
        echo -e "${GREEN}✅ Created .env.production with generated secrets${NC}"
        echo -e "${YELLOW}⚠️  Save these passwords securely!${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.production already exists. Skipping secret generation.${NC}"
    fi
}

setup_ssl() {
    echo -e "\n${BLUE}🔒 SSL Certificate Setup${NC}"
    echo "----------------------------------------"
    
    if [ ! -d "certs" ]; then
        mkdir -p certs
    fi
    
    # Check if certificates exist
    if [ ! -f "certs/fullchain.pem" ] || [ ! -f "certs/privkey.pem" ]; then
        echo -e "${YELLOW}No SSL certificates found. Options:${NC}"
        echo "1. Let's Encrypt (automatic, requires domain)"
        echo "2. Self-signed (for development/testing)"
        echo "3. Skip (use existing certificates)"
        
        read -p "Choose option (1/2/3): " ssl_choice
        
        case $ssl_choice in
            1)
                echo -e "${BLUE}Installing certbot for Let's Encrypt...${NC}"
                if command -v certbot &> /dev/null || command -v certbot-auto &> /dev/null; then
                    read -p "Enter your domain (e.g., algeriatrade.dz): " DOMAIN
                    sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
                    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem certs/
                    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem certs/
                    echo -e "${GREEN}✅ SSL certificates installed${NC}"
                else
                    echo -e "${RED}❌ Certbot not found. Please install certbot or choose another option.${NC}"
                fi
                ;;
            2)
                echo -e "${YELLOW}Generating self-signed certificate...${NC}"
                openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                    -keyout certs/privkey.pem \
                    -out certs/fullchain.pem \
                    -subj "/C=DZ/O=AlgeriaTrade/CN=algeriatrade.dz"
                echo -e "${GREEN}✅ Self-signed certificate generated (valid for 365 days)${NC}"
                echo -e "${YELLOW}⚠️  Browsers will show security warnings for self-signed certs${NC}"
                ;;
            3)
                echo -e "${YELLOW}Skipping SSL setup. Make sure to place certificates in ./certs/${NC}"
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
    else
        echo -e "${GREEN}✅ SSL certificates already exist${NC}"
    fi
}

init_database() {
    echo -e "\n${blue}💾 Initializing Database...${NC}"
    
    # Run Prisma migrations
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T app npx prisma migrate deploy || true
    
    # Seed database with initial data
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T app npx prisma db seed || true
    
    echo -e "${GREEN}✅ Database initialized${NC}"
}

# Main commands
case "${1:-up}" in
    up)
        print_banner
        
        echo -e "${BLUE}🚀 Starting Production Stack...${NC}"
        echo "----------------------------------------"
        
        check_docker
        
        # Check for .env.production
        if [ ! -f ".env.production" ]; then
            echo -e "${YELLOW}⚠️  No .env.production found. Running initial setup...${NC}"
            generate_secrets
            setup_ssl
        fi
        
        echo -e "\n${YELLOW}Pulling latest images...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME pull --quiet 2>/dev/null || true
        
        echo -e "${YELLOW}Starting services...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
        
        echo -e "\n${GREEN}Waiting for services to be healthy...${NC}"
        sleep 10
        
        # Initialize database on first run
        init_database
        
        echo -e "\n${GREEN}=============================================${NC}"
        echo -e "${GREEN}✅ Production stack is running!${NC}"
        echo -e "${GREEN}=============================================${NC}"
        
        echo -e "\n${BLUE}📊 Service Status:${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
        
        echo -e "\n${CYAN}📱 Access Points:${NC}"
        echo "  • App: https://localhost (via nginx)"
        echo "  • API: https://localhost/api"
        echo "  • pgAdmin: http://localhost:5050 (if enabled)"
        echo "  • Redis Commander: http://localhost:8081 (if enabled)"
        
        echo -e "\n${BLUE}Useful Commands:${NC}"
        echo "  • View logs: $0 logs"
        echo "  • Stop stack: $0 down"
        echo "  • Restart: $0 restart"
        echo "  • Backup: $0 backup"
        ;;
        
    down)
        print_banner
        echo -e "${BLUE}⏹️  Stopping Production Stack...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;
        
    restart)
        print_banner
        echo -e "${BLUE}🔄 Restarting Services...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
        
    logs)
        echo -e "${BLUE}📋 Viewing Logs (Ctrl+C to exit)...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f --tail=100 ${2:-}
        ;;
        
    status)
        print_banner
        echo -e "${BLUE}📊 Service Status:${NC}"
        echo "----------------------------------------"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
        
        echo -e "\n${BLUE}💾 Disk Usage:${NC}"
        docker system df
        
        echo -e "\n${BLUE}📈 Resource Usage:${NC}"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
        ;;
        
    setup)
        print_banner
        check_docker
        generate_secrets
        setup_ssl
        
        echo -e "\n${GREEN}✅ Setup complete! Run '$0 up' to start the stack.${NC}"
        ;;
        
    backup)
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_DIR="backups/${TIMESTAMP}"
        
        echo -e "${BLUE}💾 Creating Backup: ${TIMESTAMP}${NC}"
        mkdir -p "$BACKUP_DIR"
        
        # Backup PostgreSQL
        echo -e "${YELLOW}  Backing up PostgreSQL...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T postgres pg_dumpall -U algeriatrade > "$BACKUP_DIR/postgres_dump.sql" 2>/dev/null || \
            echo -e "${YELLOW}  ⚠️  PostgreSQL backup failed (container might not be running)${NC}"
        
        # Backup Redis
        echo -e "${YELLOW}  Backing up Redis...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T redis redis-cli BGSAVE > /dev/null 2>&1 || true
        docker cp algeriatrade-redis-prod:/data/dump.rdb "$BACKUP_DIR/redis_dump.rdb" 2>/dev/null || \
            echo -e "${YELLOW}  ⚠️  Redis backup failed${NC}"
        
        # Backup uploads
        echo -e "${YELLOW}  Backing up uploads...${NC}"
        docker cp algeriatrade-app-prod:/app/public/uploads "$BACKUP_DIR/uploads" 2>/dev/null || \
            echo -e "${YELLOW}  ⚠️  Uploads backup failed${NC}"
        
        # Compress backup
        tar -czf "${BACKUP_DIR}.tar.gz" -C backups "$TIMESTAMP"
        rm -rf "$BACKUP_DIR"
        
        echo -e "${GREEN}✅ Backup created: ${BACKUP_DIR}.tar.gz${NC}"
        echo -e "${YELLOW}Size: $(du -h ${BACKUP_DIR}.tar.gz | cut -f1)${NC}"
        ;;
        
    restore)
        BACKUP_FILE="${2:-$(ls -t backups/*.tar.gz 2>/dev/null | head -1)}"
        
        if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
            echo -e "${RED}❌ No backup file found. Usage: $0 restore [backup-file.tar.gz]${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🔄 Restoring from: ${BACKUP_FILE}${NC}"
        read -p "This will overwrite current data. Continue? (y/N): " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            # Extract backup
            TEMP_DIR=$(mktemp -d)
            tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
            
            # Restore PostgreSQL
            SQL_FILE=$(find "$TEMP_DIR" -name "postgres_dump.sql" | head -1)
            if [ -n "$SQL_FILE" ]; then
                echo -e "${YELLOW}  Restoring PostgreSQL...${NC}"
                cat "$SQL_FILE" | docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T postgres psql -U algeriatrade 2>/dev/null || \
                    echo -e "${YELLOW}  ⚠️  PostgreSQL restore failed${NC}"
            fi
            
            # Restore Redis
            RDB_FILE=$(find "$TEMP_DIR" -name "redis_dump.rdb" | head -1)
            if [ -n "$RDB_FILE" ]; then
                echo -e "${YELLOW}  Restoring Redis...${NC}"
                docker cp "$RDB_FILE" algeriatrade-redis-prod:/data/dump.rdb 2>/dev/null || \
                    echo -e "${YELLOW}  ⚠️  Redis restore failed${NC}"
                docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart redis
            fi
            
            rm -rf "$TEMP_DIR"
            echo -e "${GREEN}✅ Restore completed!${NC}"
        else
            echo -e "${YELLOW}Restore cancelled.${NC}"
        fi
        ;;
        
    update)
        print_banner
        echo -e "${BLUE}🔄 Updating Production Stack...${NC}"
        
        # Pull new images
        echo -e "${YELLOW}Pulling updated images...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME pull
        
        # Recreate containers
        echo -e "${YELLOW}Recreating containers...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --force-recreate
        
        # Clean up unused images
        echo -e "${YELLOWCleaning up old images...${NC}"
        docker image prune -f
        
        echo -e "${GREEN}✅ Update completed!${NC}"
        ;;
        
    *)
        echo "AlgeriaTrade.dz - Docker Deployment Helper"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  up         Start production stack (default)"
        echo "  down       Stop production stack"
        echo "  restart    Restart all services"
        echo "  logs       View logs (optional: service name)"
        echo "  status     Show service status and resource usage"
        echo "  setup      Initial setup (secrets, SSL)"
        echo "  backup     Create database backup"
        echo "  restore    Restore from backup (optional: backup file)"
        echo "  update     Update images and recreate containers"
        echo ""
        echo "Examples:"
        echo "  $0 up                  Start production stack"
        echo "  $0 logs app           View app logs only"
        echo "  $0 backup              Create timestamped backup"
        echo "  $0 restore backup.tar.gz  Restore specific backup"
        ;;
esac
