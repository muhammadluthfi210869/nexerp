#!/bin/bash
set -u
# Remove previous instance
docker rm -f r4-shadow-backend 2>/dev/null || true
# Start the shadow backend with NEW DATABASE_URL pointing to the canonical shadow
docker run -d --name r4-shadow-backend \
  --network production-light_default \
  -p 4001:3001 \
  -e DATABASE_URL='postgresql://erp_user:erp_password_secure@pg-r4-shadow:5432/erp_r4_biznet_shadow?schema=public' \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e JWT_SECRET='docker-local-jwt-secret-change-in-production-1234567890' \
  -e JWT_EXPIRES_IN='60m' \
  -e AES_SECRET_KEY='aureon_erp_v4_ultra_secret_key_32' \
  -e CORS_ORIGIN='http://localhost:4000' \
  -e LOG_LEVEL='info' \
  -e ERP_BRIDGE_SECRET='change-me-to-a-32-byte-random-hex' \
  production-light-backend
echo "Started. Status:"
docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | grep r4-shadow-backend || echo "(not yet visible)"
