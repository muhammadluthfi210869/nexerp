# Stage 1: Build
# node:20-slim (Debian/glibc) — matches frontend Dockerfile for consistency.
# Alpine/musl causes native binary issues (bcrypt, etc.).
#
# Build context: REPO ROOT. Workflow invokes:
#   docker build --no-cache -f backend/Dockerfile .
# so we can copy backend/prisma/* and backend source directly.

FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma adapter-pg and bcrypt native build
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Backend deps
COPY backend/package.json backend/package-lock.json* ./

RUN npm install --no-audit --no-fund

# Prisma schema (prisma.config.ts → schema: "prisma/schema")
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts

# Generate Prisma client — MUST before nest build so @prisma/client
# has enum types and delegates ready.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" npx prisma generate

# Backend source
COPY backend/. .

# Compile NestJS to dist/
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Built artifacts + runtime config
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/init-db.sh ./init-db.sh
COPY --from=builder /app/scripts ./scripts
RUN sed -i 's/\r$//' init-db.sh && chmod +x init-db.sh

# Production deps only (skip devDeps for smaller image)
RUN npm ci --omit=dev && npm cache clean --force
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" npx prisma generate

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "./init-db.sh"]
