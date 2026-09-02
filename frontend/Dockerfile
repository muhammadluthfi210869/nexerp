# Stage 1: Build
# node:20-slim (Debian/glibc) — bukan Alpine/musl. Turbopack + lightningcss
# butuh binary native glibc; di Alpine/musl build Next 16 sering gagal.
FROM node:20-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PROTOTYPE_MODE
ENV NEXT_PUBLIC_PROTOTYPE_MODE=$NEXT_PUBLIC_PROTOTYPE_MODE

# Copy package files first for caching
COPY package*.json ./
RUN npm install

# Lighteningcss native binary workaround
RUN npm install lightningcss-linux-x64-gnu --no-save 2>/dev/null || true

# Bring in Prisma schema + config for `prisma generate`. Restored main-branch
# pages import enums (ActivityType, WorkflowStatus, ProductCategory,
# LostReason) directly from @prisma/client, so generated client must have
# these. Prisma looks up the schema via prisma.config.ts which references
# ./prisma/schema. We expect the workflow to have copied backend/prisma to
# ./prisma already (see build-unified-staging.yml pre-step).
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
# Set a placeholder DATABASE_URL — `prisma generate` does NOT need a real DB
# connection; it only reads schema files. The placeholder satisfies the
# config's `process.env["DATABASE_URL"]` lookup.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" npx prisma generate

# Copy frontend source
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
