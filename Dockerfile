# =============================================================================
# Dockerfile - AlgeriaTrade.dz B2B Marketplace Production Build
# =============================================================================
# Multi-stage build optimized for production deployment:
# - Stage 1 (base): Shared system dependencies
# - Stage 2 (deps): Dependency installation with layer caching
# - Stage 3 (builder): Application build with Next.js standalone output
# - Stage 4 (runner): Minimal production runtime
# - Stage 5 (development): Optional development environment
#
# Security Features:
# - Non-root user execution (nextjs:1001)
# - Read-only root filesystem capability
# - Health check endpoint for orchestration
# - Minimal attack surface (Alpine-based)
#
# Usage:
#   Production:  docker build -t algeriatrade:prod --target runner .
#   Development: docker build -t algeriatrade:dev --target development .
#   Custom:      docker build --build-arg NODE_VERSION=20 .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Image (shared across stages)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install system dependencies required for native modules and production
# - libc6-compat: Compatibility layer for glibc-based packages
# - openssl: TLS/SSL support for HTTPS requests
# - ca-certificates: Certificate authority certificates
# - curl: Health checks and API calls
# - tini: Proper PID 1 signal handling (zombie process reaping)
# - git: Required by some npm packages during install
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    curl \
    tini \
    git

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies Installation (optimized for layer caching)
# -----------------------------------------------------------------------------
FROM base AS deps

# Enable corepack for bun package manager (faster than npm)
RUN corepack enable && corepack prepare bun@latest --activate

# Copy dependency files first (better layer caching)
# These change less frequently than source code, so Docker caches this layer
COPY package.json bun.lockb ./

# Install dependencies with frozen lockfile for reproducible builds
# --frozen-lockfile fails if lockfile is out of sync (CI safety)
# Install all dependencies including devDependencies for the build stage
RUN bun install --frozen-lockfile --production=false

# -----------------------------------------------------------------------------
# Stage 3: Source Code Build (Next.js standalone output)
# -----------------------------------------------------------------------------
FROM base AS builder

# Enable corepack for bun
RUN corepack enable && corepack prepare bun@latest --activate

# Copy dependencies from deps stage (already installed, leverages cache)
COPY --from=deps /app/node_modules ./node_modules

# Copy remaining source code
COPY . .

# Build environment variables
# Disable telemetry for faster builds and privacy
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    BUN_INSTALL_VERBOSE=0 \
    # Optimize Next.js build for production
    NEXT_DISABLE_GRPC=1

# Generate Prisma client before building
RUN npx prisma generate

# Build the application in standalone mode
# Standalone mode creates a self-contained bundle that doesn't need node_modules
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 4: Production Runtime (minimal, secure image)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install minimal runtime dependencies only
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    tzdata \
    tini \
    # Clean up APK cache to reduce image size
    && rm -rf /var/cache/apk/* \
    /tmp/* \
    /var/tmp/*

# Set timezone to Algeria/Algiers for proper date/time handling
ENV TZ=Africa/Algiers

# Production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    # Disable unnecessary features in production
    NEXT_DISABLE_GRPC=1

# Create non-root user and group for security (defense in depth)
# Running as root is a security risk - if compromised, attacker has full access
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy public assets (images, fonts, icons, PWA files, etc.)
COPY --from=builder /app/public ./public

# Copy standalone build output (self-contained Next.js bundle)
# The standalone output includes a minimal node_modules with only production deps
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client for database operations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create necessary directories for uploads with proper permissions
# These directories store user-uploaded content
RUN mkdir -p /app/public/uploads/products \
             /app/public/uploads/companies \
             /app/public/uploads/documents \
             /app/public/uploads/videos \
             /app/public/uploads/temp \
             /app/data \
             /app/logs \
    # Set ownership to non-root user
    && chown -R nextjs:nodejs /app/public/uploads /app/data /app/logs

# Switch to non-root user for security (critical for production)
USER nextjs

# Expose the application port (internal to Docker network)
EXPOSE 3000

# Health check for Docker/Kubernetes orchestration
# Uses curl to hit the health endpoint every 30 seconds
# Start period of 15s allows app to initialize before checks begin
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=15s \
            --retries=3 \
            CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini as PID 1 for proper signal handling
# This ensures graceful shutdown on SIGTERM/SIGINT (important for database connections)
ENTRYPOINT ["tini", "--"]

# Start the Next.js server using the standalone server.js
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 5: Development Environment (optional, for local development)
# -----------------------------------------------------------------------------
FROM base AS development

# Enable corepack for bun
RUN corepack enable && corepack prepare bun@latest --activate

# Copy entire source code for development (enables hot-reload)
COPY . .

# Install all dependencies including devDependencies
RUN bun install

# Expose development port
EXPOSE 3000

# Development environment variables
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

# Start development server with hot-reload enabled
CMD ["bun", "run", "dev"]

# =============================================================================
# BUILD ARGUMENTS (for CI/CD customization)
# =============================================================================
# These allow customization at build time without modifying the Dockerfile
#
# Usage examples:
#   docker build --build-arg NODE_VERSION=20 .
#   docker build --build-arg BUN_VERSION=1.0.30 .
#
ARG NODE_VERSION=20
ARG BUN_VERSION=latest

# =============================================================================
# LABELS (for container metadata and orchestration)
# =============================================================================
LABEL maintainer="AlgeriaTrade.dz DevOps <devops@algeriatrade.dz>" \
      org.opencontainers.image.title="AlgeriaTrade.dz B2B Marketplace" \
      org.opencontainers.image.description="Production-ready B2B marketplace platform for Algeria" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="AlgeriaTrade.dz" \
      org.opencontainers.image.licenses="Proprietary"
