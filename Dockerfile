# ---- Stage 1: Dependencies ----
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
# Donmaları önlemek için network timeout ve retry ayarları eklenmiş yükleme
RUN npm install --no-audit --no-fund --fetch-timeout=1000000

# ---- Stage 2: Build ----
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
RUN npx next build

# ---- Stage 3: Production ----
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install Prisma CLI globally to ensure v6 is ALWAYS available and won't be downloaded at runtime
RUN npm install -g prisma@6.11.1

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --create-home nextjs && \
    mkdir -p /home/nextjs/.npm && \
    chown -R nextjs:nodejs /home/nextjs
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

# Copy standalone output and necessary static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Start the app: Push schema updates then start server
# Using the globally installed prisma CLI
CMD ["sh", "-c", "prisma db push --accept-data-loss && node server.js"]
