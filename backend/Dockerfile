# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source and prisma schema
COPY . .
RUN npx prisma generate

# Build the application
RUN npm run build

# Compile seed files
RUN npx tsc prisma/seed-master.ts --outDir dist/prisma --esModuleInterop --skipLibCheck --module commonjs 2>/dev/null || true
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck --module commonjs 2>/dev/null || true
RUN for f in prisma/seed-*.ts; do npx tsc "$f" --outDir dist/prisma --esModuleInterop --skipLibCheck --module commonjs 2>/dev/null || true; done

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy built assets and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY init-db.sh ./
RUN sed -i 's/\r$//' init-db.sh && chmod +x init-db.sh

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "./init-db.sh"]
