#!/bin/bash
# =============================================================================
# AlgeriaTrade.dz - Netlify Deployment Script
# =============================================================================
# Usage: ./deploy-netlify.sh [environment]
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
SITE_NAME="algeriatrade-dz"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🚀 AlgeriaTrade.dz - Netlify Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo "=========================================="

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    cp .env.example .env.production
    echo -e "${RED}⚠️  Please edit .env.production with your production values before deploying!${NC}"
    exit 1
fi

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

# Install dependencies for serverless functions
echo -e "${YELLOW}  • Installing function dependencies...${NC}"
cd netlify/functions && npm install --production 2>/dev/null || true
cd ../..

# Build the Next.js application
echo -e "${YELLOW}  • Building application...${NC}"
if bun run build 2>&1; then
    echo -e "${GREEN}  ✅ Build successful${NC}"
else
    echo -e "${RED}  ❌ Build failed.${NC}"
    exit 1
fi

# Login to Netlify (if not already logged in)
if ! netlify status &> /dev/null; then
    echo -e "${YELLOW}🔐 Not logged in to Netlify. Initiating login...${NC}"
    netlify login
fi

# Deploy to Netlify
echo -e "\n${BLUE}🚀 Deploying to Netlify (${ENVIRONMENT})...${NC}"

case $ENVIRONMENT in
    production)
        netlify deploy --prod --dir=.next --site="$SITE_NAME"
        ;;
    preview)
        netlify deploy --dir=.next --site="$SITE_NAME"
        ;;
    dev)
        netlify dev --port=3000 &
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
echo -e "\n${BLUE}✅ Deployment completed!${NC}"

# Get site info
echo -e "\n${BLUE}📊 Site Information:${NC}"
netlify sites:list 2>/dev/null || true

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN}✅ Netlify deployment completed successfully!${NC}"
echo -e "${GREEN}=============================================${NC}"
