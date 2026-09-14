# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WA_PHONE
ENV NEXT_PUBLIC_WA_PHONE=$NEXT_PUBLIC_WA_PHONE
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_TELEMETRY_DISABLED=1

# Layer cache dependencies
COPY package*.json ./
RUN npm install
RUN npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu || true

# Copy source and build Next.js
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

# Leverage Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
