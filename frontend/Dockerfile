# Stage 1: Build
# node:20-slim (Debian/glibc) — bukan Alpine/musl. Turbopack + lightningcss
# butuh binary native glibc; di Alpine/musl build Next 16 sering gagal.
FROM node:20-slim AS builder

WORKDIR /app

# Add Build Arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PROTOTYPE_MODE
ENV NEXT_PUBLIC_PROTOTYPE_MODE=$NEXT_PUBLIC_PROTOTYPE_MODE

COPY package*.json ./
RUN npm install

# package-lock.json dibuat di Windows → binary native lightningcss untuk
# Linux tidak tercatat. Install eksplisit supaya Turbopack bisa resolve
# (tanpa ini: Cannot find module '../lightningcss.linux-x64-gnu.node').
RUN npm install lightningcss-linux-x64-gnu --no-save 2>/dev/null || true

COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Automatically leverage standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
