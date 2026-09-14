# Stage 1: Build
FROM node:20-bookworm AS builder

WORKDIR /app

# Add Build Arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WA_PHONE
ENV NEXT_PUBLIC_WA_PHONE=$NEXT_PUBLIC_WA_PHONE
# Proxy uses JWT_SECRET to verify session tokens at edge. MUST match backend.
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

COPY package*.json ./
RUN npm install && npm install lightningcss-linux-x64-gnu

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-bookworm AS runner

WORKDIR /app

ENV NODE_ENV=production
# Next.js 16 still reads process.env.JWT_SECRET at runtime for proxy.ts.
# Mirrored from builder stage so standalone output can resolve it.
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

# Automatically leverage standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
