# ============================================
# DOCKERFILE PRODUCTION - Maisons à Rénover
# Build multi-stage optimisé pour Next.js 16
# ============================================

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat

# Copier les fichiers de dépendances (npm uniquement)
COPY package.json package-lock.json* ./

# Installer les dépendances avec npm
RUN npm ci --legacy-peer-deps

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les dépendances depuis l'étape précédente
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
# Ces valeurs seront remplacées au runtime par les vraies valeurs
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de l'application
RUN npm run build

# ============================================
# STAGE 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Installer les dépendances système minimales (wget pour healthcheck)
RUN apk add --no-cache libc6-compat wget

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copier les fichiers statiques publics
COPY --from=builder /app/public ./public

# Copier le build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Changer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Commande de démarrage
CMD ["node", "server.js"]
