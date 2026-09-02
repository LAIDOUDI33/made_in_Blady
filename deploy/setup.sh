#!/bin/bash
# =============================================================================
# Server Setup Script - AlgeriaTrade.dz B2B Marketplace
# =============================================================================
#
# This script automates the initial server setup for deploying AlgeriaTrade.dz
# It installs all required dependencies, configures the server, and deploys
# the application.
#
# Prerequisites:
# - Fresh Ubuntu 22.04 LTS or 24.04 LTS server (recommended)
# - Root or sudo access
# - At least 2GB RAM, 20GB disk space (recommend 4GB+ RAM for production)
# - SSH access configured
#
# Usage:
#   chmod +x setup.sh
#   sudo ./setup.sh
#   # Or with options:
#   sudo ./setup.sh --env=production    # Production setup
#   sudo ./setup.sh --env=staging      # Staging setup
#   sudo ./setup.sh --skip-docker      # Skip Docker installation
#   sudo ./setup.sh --help             # Show help
#
# What this script does:
# 1. Update system packages
# 2. Install Docker & Docker Compose
# 3. Install Node.js (via nvm) and Bun
# 4. Install Nginx and Certbot (Let's Encrypt)
# 5. Configure firewall (UFW)
# 6. Clone repository and setup environment
# 7. Generate SSL certificates
# 8. Initialize database
# 9. Start services
#
# WARNING: This script makes significant changes to your server.
# Review it carefully before running on a production system.
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT="production"
APP_DIR="/opt/algeriatrade"
REPOSITORY_URL="https://github.com/algeriatrade/platform.git"  # Change this!
BRANCH="main"
SKIP_DOCKER=false
SKIP_FIREWALL=false
INSTALL_MONITORING=false

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --env=*)
            ENVIRONMENT="${arg#*=}"
            shift
            ;;
        --app-dir=*)
            APP_DIR="${arg#*=}"
            shift
            ;;
        --repo=*)
            REPOSITORY_URL="${arg#*=}"
            shift
            ;;
        --branch=*)
            BRANCH="${arg#*=}"
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-firewall)
            SKIP_FIREWALL=true
            shift
            ;;
        --with-monitoring)
            INSTALL_MONITORING=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env=ENV         Environment: production|staging (default: production)"
            echo "  --app-dir=DIR     Application directory (default: /opt/algeriatrade)"
            echo "  --repo=URL        Git repository URL"
            echo "  --branch=BRANCH   Git branch to checkout (default: main)"
            echo "  --skip-docker     Skip Docker installation"
            echo "  --skip-firewall   Skip firewall configuration"
            echo "  --with-monitoring Install monitoring tools (Prometheus, Grafana)"
            echo "  --help, -h        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            exit 1
            ;;
    esac
done

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

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

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

require_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Pre-flight Checks
# -----------------------------------------------------------------------------

preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check root
    require_root
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot detect operating system"
        exit 1
    fi
    
    . /etc/os-release
    log_info "Operating System: $NAME $VERSION"
    
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        log_warning "This script is designed for Ubuntu/Debian. Proceeding anyway..."
    fi
    
    # Check minimum memory
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $TOTAL_MEM -lt 2 ]]; then
        log_warning "System has less than 2GB RAM ($TOTAL_MEM GB). Performance may be affected."
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df -BG / | awk 'NR==2{print $4}' | tr -d 'G')
    if [[ $AVAILABLE_SPACE -lt 20 ]]; then
        log_error "Insufficient disk space. At least 20GB required, ${AVAILABLE_SPACE}GB available."
        exit 1
    fi
    
    log_success "Pre-flight checks passed"
}

# -----------------------------------------------------------------------------
# Step 1: System Update
# -----------------------------------------------------------------------------

update_system() {
    log_info "Updating system packages..."
    
    apt-get update -y
    apt-get upgrade -y -qq
    
    # Install essential packages
    apt-get install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        unzip \
        wget \
        git \
        htop \
        vim \
        ufw \
        fail2ban \
        logrotate \
        rsync
    
    log_success "System updated"
}

# -----------------------------------------------------------------------------
# Step 2: Docker Installation
# -----------------------------------------------------------------------------

install_docker() {
    if [[ "$SKIP_DOCKER" == true ]]; then
        log_info "Skipping Docker installation (--skip-docker)"
        return
    fi
    
    log_info "Installing Docker..."
    
    # Remove old versions if present
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-version && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    # Add current user to docker group (if not root)
    if [[ -n "${SUDO_USER:-}" ]]; then
        usermod -aG docker "$SUDO_USER"
        log_info "Added user $SUDO_USER to docker group"
    fi
    
    # Verify installation
    if docker --version && docker compose version; then
        log_success "Docker installed successfully"
    else
        log_error "Docker installation failed"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Step 3: Node.js and Bun Installation
# -----------------------------------------------------------------------------

install_nodejs_bun() {
    log_info "Installing Node.js and Bun..."
    
    # Install Node.js via NodeSource (LTS version)
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verify Node.js
    node --version
    npm --version
    
    # Install Bun
    curl -fsSL https://bun.sh/install | bash
    
    # Add bun to PATH for current session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Add to .bashrc for future sessions
    if ! grep -q 'bun' "$HOME/.bashrc" 2>/dev/null; then
        echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.bashrc"
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    
    # Verify Bun
    if command -v bun &> /dev/null; then
        bun --version
        log_success "Node.js and Bun installed successfully"
    else
        log_warning "Bun may require shell restart. Run: source ~/.bashrc"
    fi
}

# -----------------------------------------------------------------------------
# Step 4: Nginx and SSL Installation
# -----------------------------------------------------------------------------

install_nginx_ssl() {
    log_info "Installing Nginx and Certbot..."
    
    # Install Nginx
    apt-get install -y nginx
    
    # Enable and start Nginx
    systemctl enable nginx
    systemctl start nginx
    
    # Install Certbot for Let's Encrypt certificates
    apt-get install -y certbot python3-certbot-nginx
    
    # Create directories for certs and ACME challenges
    mkdir -p /etc/nginx/certs
    mkdir -p /var/www/certbot
    
    # Create self-signed certificate for initial setup (will be replaced by Let's Encrypt)
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/privkey.pem \
        -out /etc/nginx/certs/fullchain.pem \
        -subj "/C=DZ/O=AlgeriaTrade/CN=localhost" 2>/dev/null || true
    
    log_success "Nginx and Certbot installed"
}

# -----------------------------------------------------------------------------
# Step 5: Firewall Configuration
# -----------------------------------------------------------------------------

configure_firewall() {
    if [[ "$SKIP_FIREWALL" == true ]]; then
        log_info "Skipping firewall configuration (--skip-firewall)"
        return
    fi
    
    log_info "Configuring UFW firewall..."
    
    # Reset to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (important! Don't lock yourself out)
    ufw allow 22/tcp comment 'SSH'
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Enable firewall
    ufw --force enable
    
    # Configure Fail2Ban for SSH protection
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log_success "Firewall configured"
    ufw status verbose
}

# -----------------------------------------------------------------------------
# Step 6: Application Setup
# -----------------------------------------------------------------------------

setup_application() {
    log_info "Setting up AlgeriaTrade application..."
    
    # Create application directory
    mkdir -p "$APP_DIR"
    mkdir -p "$APP_DIR/certs"
    mkdir -p "$APP_DIR/backups"
    mkdir -p "/var/log/algeriatrade"
    
    # Clone repository (or pull if exists)
    if [[ -d "$APP_DIR/.git" ]]; then
        log_info "Repository exists, pulling latest changes..."
        cd "$APP_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        log_info "Cloning repository..."
        git clone --branch "$BRANCH" "$REPOSITORY_URL" "$APP_DIR"
    fi
    
    cd "$APP_DIR"
    
    # Copy environment file
    ENV_FILE=".env"
    ENV_EXAMPLE="deploy/${ENVIRONMENT}.env.example"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log_info "Created $ENV_FILE from $ENV_EXAMPLE"
            log_warning "Please edit $ENV_FILE with your actual values before starting!"
        else
            log_error "Environment file template not found: $ENV_EXAMPLE"
            log_info "Creating empty .env file..."
            touch "$ENV_FILE"
        fi
    else
        log_info "Environment file already exists: $ENV_FILE"
    fi
    
    log_success "Application setup complete"
}

# -----------------------------------------------------------------------------
# Step 7: SSL Certificate Setup
# -----------------------------------------------------------------------------

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Get domain from environment file
    local DOMAIN="algeriatrade.dz"
    if [[ -f "$APP_DIR/.env" ]]; then
        DOMAIN=$(grep -E "^NEXT_PUBLIC_APP_URL=" "$APP_DIR/.env" | cut -d'=' -f2 | sed 's|https://||')
    fi
    
    log_info "Domain: $DOMAIN"
    
    # Check if we should request real certificates
    read -rp "Do you want to request Let's Encrypt certificates for $DOMAIN? (y/N): " REQUEST_CERT
    
    if [[ "$REQUEST_CERT" =~ ^[Yy]$ ]]; then
        # Ensure nginx is running for ACME challenge
        systemctl start nginx || true
        
        # Request certificate
        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Copy certificates to app directory
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$APP_DIR/certs/"
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$APP_DIR/certs/"
        cp /etc/letsencrypt/live/$DOMAIN/chain.pem "$APP_DIR/certs/" 2>/dev/null || true
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $APP_DIR/docker-compose.yml exec nginx nginx -s reload") | crontab -
        
        log_success "SSL certificates installed and auto-renewal configured"
    else
        log_info "Using self-signed certificate for now"
        log_warning "Remember to set up proper SSL certificates before going to production!"
    fi
}

# -----------------------------------------------------------------------------
# Step 8: Database Initialization
# -----------------------------------------------------------------------------

initialize_database() {
    log_info "Initializing database..."
    
    cd "$APP_DIR"
    
    # Build and start just the database service
    docker compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker compose exec -T postgres pg_isready -U algeriatrade 2>/dev/null; then
            break
        fi
        sleep 2
    done
    
    # Run Prisma migrations
    log_info "Running database migrations..."
    docker compose run --rm app npx prisma migrate deploy 2>/dev/null || {
        log_warning "Migration via Docker failed, trying locally..."
        npm install 2>/dev/null || bun install 2>/dev/null
        npx prisma migrate deploy || bunx prisma migrate deploy
    }
    
    # Seed database (optional)
    read -rp "Do you want to seed the database with sample data? (y/N): " SEED_DB
    if [[ "$SEED_DB" =~ ^[Yy]$ ]]; then
        log_info "Seeding database..."
        npx prisma db seed || bunx prisma db seed || log_warning "Seeding completed with warnings"
    fi
    
    log_success "Database initialized"
}

# -----------------------------------------------------------------------------
# Step 9: Start Services
# -----------------------------------------------------------------------------

start_services() {
    log_info "Starting all services..."
    
    cd "$APP_DIR"
    
    # Start all services
    docker compose up -d
    
    # Wait for health check
    log_info "Waiting for application health check..."
    sleep 30
    
    # Verify services are running
    docker compose ps
    
    # Test health endpoint
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application is healthy!"
    else
        log_warning "Application may not be fully started yet. Check logs with: docker compose logs -f app"
    fi
}

# -----------------------------------------------------------------------------
# Step 10: Optional Monitoring Setup
# -----------------------------------------------------------------------------

setup_monitoring() {
    if [[ "$INSTALL_MONITORING" != true ]]; then
        return
    fi
    
    log_info "Setting up monitoring stack (Prometheus + Grafana)..."
    
    # Create monitoring directory
    mkdir -p "$APP_DIR/monitoring"
    
    # Create Prometheus configuration
    cat > "$APP_DIR/monitoring/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'algeriatrade-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/admin/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
EOF
    
    # Create docker-compose override for monitoring
    cat > "$APP_DIR/monitoring/docker-compose.monitoring.yml" << 'EOF'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: algeriatrade-prometheus
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - algeriatrade-internal
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: algeriatrade-grafana
    ports:
      - "127.0.0.1:3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=changeme
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - algeriatrade-internal
    depends_on:
      - prometheus
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: algeriatrade-node-exporter
    ports:
      - "127.0.0.1:9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:

networks:
  algeriatrade-internal:
    external: true
EOF
    
    log_success "Monitoring configuration created"
    log_info "Start monitoring with: docker compose -f monitoring/docker-compose.monitoring.yml up -d"
}

# -----------------------------------------------------------------------------
# Setup Log Rotation
# -----------------------------------------------------------------------------

setup_logrotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/algeriatrade << EOF
/var/log/algeriatrade/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 root root
    postextend
        docker compose -f $APP_DIR/docker-compose.yml logs > /dev/null 2>&1 || true
    endscript
}
EOF
    
    log_success "Log rotation configured"
}

# -----------------------------------------------------------------------------
# Print Summary
# -----------------------------------------------------------------------------

print_summary() {
    echo ""
    echo "============================================================================="
    echo -e "${GREEN}🎉 AlgeriaTrade.dz Server Setup Complete!${NC}"
    echo "============================================================================="
    echo ""
    echo "Installation Summary:"
    echo "---------------------"
    echo "  Environment:       $ENVIRONMENT"
    echo "  App Directory:     $APP_DIR"
    echo "  Git Branch:        $BRANCH"
    echo ""
    echo "Services Running:"
    echo "-----------------"
    echo "  Next.js App:       http://localhost:3000"
    echo "  PostgreSQL:        localhost:5432"
    echo "  Redis:             localhost:6379"
    echo "  Nginx:             http://localhost:80 (HTTPS: 443)"
    echo ""
    echo "Useful Commands:"
    echo "---------------"
    echo "  View logs:         cd $APP_DIR && docker compose logs -f"
    echo "  Restart app:       cd $APP_DIR && docker compose restart app"
    echo "  Stop all:          cd $APP_DIR && docker compose down"
    echo "  Update:            cd $APP_DIR && git pull && docker compose up -d --build"
    echo "  Database backup:   cd $APP_DIR && docker compose exec postgres pg_dump -U algeriatrade algeriatrade > backup.sql"
    echo ""
    echo "Next Steps:"
    echo "-----------"
    echo "  1. Edit $APP_DIR/.env with your actual credentials"
    echo "  2. Restart services: cd $APP_DIR && docker compose up -d"
    echo "  3. Configure DNS records to point to this server"
    echo "  4. Set up SSL certificates: certbot --nginx -d yourdomain.com"
    echo "  5. Monitor logs: tail -f /var/log/algeriatrade/*.log"
    echo ""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "${RED}⚠️  PRODUCTION REMINDERS:${NC}"
        echo "  • Change all default passwords in .env"
        echo "  • Configure regular backups"
        echo "  • Set up monitoring alerts"
        echo "  • Review security headers"
        echo "  • Test disaster recovery procedure"
        echo ""
    fi
    echo "Documentation: https://docs.algeriatrade.dz/deployment"
    echo "Support: devops@algeriatrade.dz"
    echo "============================================================================="
}

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------

main() {
    echo ""
    echo "============================================================================="
    echo -e "${BLUE}AlgeriaTrade.dz - Server Setup Script${NC}"
    echo "============================================================================="
    echo "Environment: $ENVIRONMENT"
    echo "Target Dir:  $APP_DIR"
    echo "Timestamp:   $(date)"
    echo "============================================================================="
    echo ""
    
    # Confirm before proceeding
    if [[ -z "${CI:-}" ]] && [[ -z "${NONINTERACTIVE:-}" ]]; then
        read -rp "This will modify your server configuration. Continue? (y/N): " CONFIRM
        if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
            log_info "Setup cancelled by user"
            exit 0
        fi
    fi
    
    # Run setup steps
    preflight_checks
    update_system
    install_docker
    install_nodejs_bun
    install_nginx_ssl
    configure_firewall
    setup_application
    setup_ssl
    initialize_database
    start_services
    setup_monitoring
    setup_logrotation
    
    print_summary
}

# Run main function
main "$@"
