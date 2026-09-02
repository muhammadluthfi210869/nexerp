# Stage 1: Build
# node:20-slim (Debian/glibc) — bukan Alpine/musl. Turbopack + lightningcss
# butuh binary native glibc; di Alpine/musl build Next 16 sering gagal.
#
# Build context: REPO ROOT. The workflow invokes this with:
#   docker build --no-cache -f frontend/Dockerfile .
# so we can reference backend/prisma/* directly without pre-build tricks.
FROM node:20-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WA_PHONE
ENV NEXT_PUBLIC_WA_PHONE=$NEXT_PUBLIC_WA_PHONE
ARG NEXT_PUBLIC_PROTOTYPE_MODE
ENV NEXT_PUBLIC_PROTOTYPE_MODE=$NEXT_PUBLIC_PROTOTYPE_MODE

# Copy ONLY the frontend package files for installation
COPY frontend/package.json frontend/package-lock.json* ./

# Install frontend deps — @prisma/client package + others
RUN npm install --no-audit --no-fund

# Lighteningcss native binary workaround (Windows package-lock missing Linux binary)
RUN npm install lightningcss-linux-x64-gnu --no-save 2>/dev/null || true

# Copy ONLY Prisma schema folder (prisma.config.ts -> schema: "prisma/schema").
# Skip backend/prisma/*.ts scripts — they import bcrypt which isn't a
# frontend dep and would break the Next.js type-checker.
COPY backend/prisma/schema ./prisma/schema
COPY backend/prisma.config.ts ./prisma.config.ts

# Generate Prisma client. `prisma generate` reads schema from prisma.config.ts
# (schema: "prisma/schema"). DATABASE_URL placeholder satisfies config.
# This MUST come before `npm run build` because restored main-branch pages
# import enum values directly from @prisma/client.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" npx prisma generate

# Copy frontend source (includes the schema files we already copied)
COPY frontend/. .

# Now build Next.js — @prisma/client is fully populated with enums
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
