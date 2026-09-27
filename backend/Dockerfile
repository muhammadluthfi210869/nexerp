# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source and prisma schema
COPY . .
RUN npx prisma generate

# Build the application
RUN npm run build

# Compile seed file — output ke dist/prisma/seed.js
RUN npx tsc prisma/seed.ts --outDir dist --esModuleInterop --skipLibCheck --module commonjs 2>&1

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Chromium for the PDF engine (html-pdf-node -> puppeteer renders the documents). Without it
# the renderer cannot start. Puppeteer still got installed and resolved fine, which is why the
# gap only showed up at request time. Both env names are set: puppeteer 10.x reads
# PUPPETEER_EXECUTABLE_PATH, and CHROME_EXECUTABLE_PATH matches Dockerfile.self-qr's convention.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Must precede the `npm ci --omit=dev` below, or the install pulls its own (unusable) Chromium.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy built assets and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts ./scripts
COPY init-db.sh ./
RUN sed -i 's/\r$//' init-db.sh && chmod +x init-db.sh

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

USER node

EXPOSE 3001

CMD ["sh", "./init-db.sh"]
