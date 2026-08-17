# Compact V2 environment

Phase 1 creates an isolated deployment target for the future polished UI.

- Domain: `compact.nexerp.id`
- Origin: Biznet (`103.93.134.215`)
- Container: `compact-frontend`
- Network: `production-light_default` (network only; no backend/database dependency)
- Data mode: frontend mock data, same role set as V1
- Source branch: `codex/ui-ux-v2-prototype`

The compact container is intentionally separate from `prototype-frontend` and from the V1 source backup. Until Phase 2 starts, it renders the same baseline UI so routing, SSL, auth, and responsive smoke tests can be compared without introducing design changes.

## Server deployment sequence

1. Upload `frontend/` and this compose file to `/home/dreamlab/compact-prototype/`.
2. Run `docker compose -f docker-compose.compact.yml up -d --build`.
3. Install the port-80 snippet, issue the ACME certificate, then install the port-443 snippet.
4. Test nginx and reload the existing `production-light-nginx-1` container.

Never reuse the `prototype-frontend` container name or replace the V1 nginx block.
