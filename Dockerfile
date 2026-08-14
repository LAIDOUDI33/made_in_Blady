# =============================================================================
# Dockerfile - AlgeriaTrade.dz
# =============================================================================
# Multi-stage build pour Next.js avec support standalone
# Optimisé pour la production et le marché algérien
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Installer les dépendances système requises pour bun
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    curl

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies installation
# -----------------------------------------------------------------------------
FROM base AS deps

# Activer corepack (gestionnaire de packages inclus dans Node.js)
RUN corepack enable && corepack prepare bun@latest --activate

# Copier les fichiers de gestion des dépendances
COPY package.json bun.lockb ./

# Installer les dépendances en mode production
RUN bun install --frozen-lockfile --production=false

# -----------------------------------------------------------------------------
# Stage 3: Build
# -----------------------------------------------------------------------------
FROM base AS builder

# Activer bun
RUN corepack enable && corepack prepare bun@latest --activate

# Copier les dépendances depuis le stage précédent
COPY --from=deps /app/node_modules ./node_modules

# Copier les fichiers source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUN_INSTALL_VERBOSE=0

# Build l'application Next.js en mode standalone
# Le mode standalone crée un package auto-suffisant
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 4: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Installer les utilitaires nécessaires
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Configurer le fuseau horaire Algérie/Alger
ENV TZ=Africa/Algiers

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copier les fichiers publics (images, fonts, etc.)
COPY --from=builder /app/public ./public

# Copier le build standalone (auto-suffisant)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Créer les répertoires nécessaires pour les uploads
RUN mkdir -p /app/public/uploads/products \
             /app/public/uploads/companies \
             /app/public/uploads/documents \
             /app/data \
    && chown -R nextjs:nodejs /app/public/uploads /app/data

# Switcher vers l'utilisateur non-root
USER nextjs

# Exposer le port HTTP
EXPOSE 3000

# Health check pour Docker/Kubernetes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Démarrer l'application
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 5: Development (optionnel)
# -----------------------------------------------------------------------------
FROM base AS development

# Activer bun
RUN corepack enable && corepack prepare bun@latest --activate

# Copier tout le code source
COPY . .

# Installer toutes les dépendances (y compris devDependencies)
RUN bun install

# Exposer le port de développement
EXPOSE 3000

# Variables d'environnement de développement
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Démarrer en mode développement avec hot-reload
CMD ["bun", "run", "dev"]
