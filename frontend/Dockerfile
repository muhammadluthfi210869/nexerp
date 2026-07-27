# Stage 1: Build
FROM node:20-bookworm AS builder

WORKDIR /app

# Add Build Arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install && npm install lightningcss-linux-x64-gnu

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-bookworm AS runner

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
