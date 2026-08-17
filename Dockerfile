# =============================================================================
# Dockerfile - AlgeriaTrade.dz Production Build
# =============================================================================
# Multi-stage build for Next.js with production optimizations:
# - Layer caching optimization for faster builds
# - Non-root user for security
# - Health check endpoint
# - Proper signal handling
# - Minimal image size
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Image (shared across stages)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install system dependencies required for native modules
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    curl \
    tini

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies Installation (optimized layer caching)
# -----------------------------------------------------------------------------
FROM base AS deps

# Enable corepack for bun package manager
RUN corepack enable && corepack prepare bun@latest --activate

# Copy dependency files first (better layer caching)
# These change less frequently than source code
COPY package.json bun.lockb ./

# Install dependencies with frozen lockfile for reproducible builds
# --frozen-lockfile fails if lockfile is out of sync (CI safety)
RUN bun install --frozen-lockfile --production=false

# -----------------------------------------------------------------------------
# Stage 3: Source Code Build
# -----------------------------------------------------------------------------
FROM base AS builder

# Enable corepack for bun
RUN corepack enable && corepack prepare bun@latest --activate

# Copy dependencies from deps stage (already installed)
COPY --from=deps /app/node_modules ./node_modules

# Copy remaining source code
COPY . .

# Build environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    BUN_INSTALL_VERBOSE=0 \
    # Optimize Next.js build for production
    NEXT_DISABLE_GRPC=1

# Build the application in standalone mode
# Standalone mode creates a self-contained bundle
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 4: Production Runtime (minimal image)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install minimal runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    tzdata \
    tini \
    && rm -rf /var/cache/apk/* \
    /tmp/* \
    /var/tmp/*

# Set timezone to Algeria/Algiers
ENV TZ=Africa/Algiers

# Production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    # Disable Next.js telemetry and unnecessary features
    NEXT_DISABLE_GRPC=1

# Create non-root user and group for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy public assets (images, fonts, icons, etc.)
COPY --from=builder /app/public ./public

# Copy standalone build output (self-contained)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create necessary directories for uploads with proper permissions
RUN mkdir -p /app/public/uploads/products \
             /app/public/uploads/companies \
             /app/public/uploads/documents \
             /app/public/uploads/videos \
             /app/data \
             /app/logs \
    && chown -R nextjs:nodejs /app/public/uploads /app/data /app/logs

# Switch to non-root user for security
USER nextjs

# Expose the application port
EXPOSE 3000

# Health check for Docker/Kubernetes orchestration
# Uses curl to hit the health endpoint
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=15s \
            --retries=3 \
            CMD curl -f http://localhost:3000/api/health || exit 1

# Use tinit as PID 1 for proper signal handling
# This ensures graceful shutdown (SIGTERM, SIGINT)
ENTRYPOINT ["tini", "--"]

# Start the Next.js server
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 5: Development Environment (optional, for local dev)
# -----------------------------------------------------------------------------
FROM base AS development

# Enable corepack for bun
RUN corepack enable && corepack prepare bun@latest --activate

# Copy entire source code for development
COPY . .

# Install all dependencies including devDependencies
RUN bun install

# Expose development port
EXPOSE 3000

# Development environment variables
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

# Start development server with hot-reload
CMD ["bun", "run", "dev"]

# =============================================================================
# BUILD ARGUMENTS (for CI/CD customization)
# =============================================================================
# Usage: docker build --build-arg NODE_VERSION=20 .
ARG NODE_VERSION=20
ARG BUN_VERSION=latest
