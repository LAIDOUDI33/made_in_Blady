#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz - Vercel Deployment Script
# =============================================================================
# Usage: ./deploy-vercel.sh [environment]
#   environment: production | preview | dev (default: production)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="algeriatrade-dz"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".deploy-backups/${TIMESTAMP}"

echo -e "${BLUE}🚀 AlgeriaTrade.dz - Vercel Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    cp .env.example .env.production
    echo -e "${RED}⚠️  Please edit .env.production with your production values before deploying!${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}📦 Backup directory created: ${BACKUP_DIR}${NC}"

# Run pre-deployment checks
echo -e "\n${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check TypeScript compilation
echo -e "${YELLOW}  • Checking TypeScript...${NC}"
if npx tsc --noEmit --skipLibCheck 2>&1; then
    echo -e "${GREEN}  ✅ TypeScript check passed${NC}"
else
    echo -e "${RED}  ❌ TypeScript errors found. Please fix before deploying.${NC}"
    exit 1
fi

# Check build
echo -e "${YELLOW}  • Testing build...${NC}"
if bun run build 2>&1 | tee "$BACKUP_DIR/build.log"; then
    echo -e "${GREEN}  ✅ Build successful${NC}"
else
    echo -e "${RED}  ❌ Build failed. Check build.log for details.${NC}"
    exit 1
fi

# Deploy to Vercel
echo -e "\n${BLUE}🚀 Deploying to Vercel (${ENVIRONMENT})...${NC}"

case $ENVIRONMENT in
    production)
        vercel --prod --yes --env pull-request=0
        ;;
    preview)
        vercel --yes
        ;;
    dev)
        vercel dev &
        DEV_PID=$!
        echo -e "${GREEN}🔄 Development server running (PID: ${DEV_PID})${NC}"
        echo "Press Ctrl+C to stop the development server"
        wait $DEV_PID
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: ${ENVIRONMENT}${NC}"
        echo "Usage: $0 [production|preview|dev]"
        exit 1
        ;;
esac

# Post-deployment verification
echo -e "\n${BLUE}✅ Running post-deployment checks...${NC}"
sleep 5

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls $PROJECT_NAME 2>/dev/null | head -2 | tail -1 | awk '{print $NF}')
if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${BLUE}📱 URL: https://${DEPLOYMENT_URL}${NC}"
    
    # Open in browser (optional)
    if command -v xdg-open &> /dev/null; then
        read -p "Open in browser? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            xdg-open "https://${DEPLOYMENT_URL}" &>/dev/null &
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Deployment completed but couldn't retrieve URL${NC}"
    echo "Check your Vercel dashboard for the deployment URL"
fi

# Cleanup
echo -e "\n${BLUE}🧹 Cleanup...${NC}"
rm -rf .next/cache 2>/dev/null || true

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}=============================================${NC}"
