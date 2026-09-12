# npm Audit Snapshot — 2026-09-12

**Tool**: `npm audit --production --json` (npm v10)
**Scope**: `backend/package.json` + `frontend/package.json` (runtime deps, `--omit=dev`)
**Date**: 2026-09-12
**Auditor**: Wave 1 / Agent A4

## Headline

| Workspace | Critical | High | Moderate | Low | Total |
|-----------|---------:|-----:|---------:|----:|------:|
| backend   | 0        | 27   | 0        | 0   | **27** |
| frontend  | 0        | 10   | 5        | 3   | **18** |
| **Total** | **0**    | **37** | **5**  | **3** | **45** |

Compared to `docs/security/SECURITY-AUDIT-2026-09-11.md` snapshot (75 total):
- Backend: 42 → 27 (-15; `--production` flag excludes dev-only `@xhmikosr/decompress` via `@swc/cli`)
- Frontend: 33 → 18 (-15; `next 16.3.4` bump fixed 9 Next advisories; sub-advisories remain)
- Net improvement: **-30 vulns**, **0 critical remaining**.

## Backend — Top packages (deduped count per package)

All 27 backend vulns are HIGH severity. Most are transitive, but several nestjs family packages are direct.

| Package                          | Vuln count | Direct? |
|----------------------------------|-----------:|:-------:|
| @nestjs/core                     | 1          | yes     |
| @nestjs/event-emitter            | 1          | yes     |
| @nestjs/platform-express         | 1          | yes     |
| @nestjs/platform-socket.io       | 1          | yes     |
| @nestjs/schedule                 | 1          | yes     |
| @nestjs/serve-static             | 1          | yes     |
| @nestjs/swagger                  | 1          | yes     |
| @nestjs/websockets               | 1          | yes     |
| prisma                           | 1          | yes     |
| html-pdf-node                    | 1          | yes     |
| cheerio, css-select, nth-check   | 1 each     | no      |
| extract-zip, extract-css         | 1 each     | no      |
| multer, ws, mysql2, node-fetch, tar-fs, puppeteer, inline-css, list-stylesheets, style-data, deepmerge-ts, lodash.pick, @prisma/config | 1 each | no |

**Common theme**: 8 `@nestjs/*` packages share an advisory family — fix requires major upgrade (Nest 11 → 12).

## Frontend — Top packages

| Severity   | Package             | Direct? | Has fix? |
|------------|---------------------|:-------:|:--------:|
| HIGH       | axios               | yes     | yes (1.17.x) |
| HIGH       | postcss             | yes     | partial   |
| HIGH (transitive) | brace-expansion, browserslist, fast-uri, form-data, hono, ip-address, js-yaml, nanoid | no | yes (overrides) |
| MODERATE   | next                | yes     | yes       |
| MODERATE   | shadcn              | yes     | yes       |
| MODERATE (transitive) | @babel/core, @hono/node-server, body-parser | no | yes (overrides) |
| LOW (transitive) | baseline-browser-mapping | no | yes |

## Accepted / Residual Risks (full list)

See [`docs/security/ACCEPTED-RISKS.md`](./ACCEPTED-RISKS.md) for documented residual items.

Notable:
- **`@xhmikosr/decompress`** — flagged in previous audit; current `--production` excludes (dev-only via `@swc/cli`). Kept on watchlist.
- **`postcss` sourceMappingURL** — advisory is direct but no clean fix at current major; needs manual upgrade path.
- **NestJS 11 family** — fix available requires major upgrade; defer to Wave 2 migration lane.

## Action Plan — Top 5 high/critical

1. **`axios` (frontend, HIGH, direct, fix available)** — bump to `^1.17.0` in `frontend/package.json`. No API changes for our usage. Low risk.
2. **`next` (frontend, MODERATE, direct, fix available)** — follow up on the 16.3.4 bump from 2026-09-11. Verify sub-advisories have closed.
3. **`postcss` (frontend, HIGH, direct)** — sourceMappingURL info disclosure. Fix requires postcss upgrade; consider coordinated migration with Tailwind v4. Defer to Wave 2 frontend lane.
4. **`@nestjs/*` 8 packages (backend, HIGH, direct, fix requires major)** — Nest 11 → Nest 12 migration. Coordinate with framework lane in Wave 2; multi-day effort.
5. **`prisma` (backend, HIGH, direct, fix available)** — bump within 6.x line. Verify no schema/client breaking changes. Low-medium risk.

### Items deferred (no simple fix)

- `mysql2`, `puppeteer`, `extract-zip`, `tar-fs`, `multer`, `ws`, `node-fetch`, `cheerio`, `nth-check`, `lodash.pick`, `deepmerge-ts` — transitive in legacy/pdf/socket paths. Track via `npm audit` on each dependency tree rotation.

## Reproduction

```bash
cd backend  && npm audit --production --json > ../evidence/security/2026-09-12/security-audit-backend.json
cd frontend && npm audit --production --json > ../evidence/security/2026-09-12/security-audit-frontend.json
```

Raw JSON files are gitignored under `evidence/security/` (already in `.gitignore`).

## Follow-ups for Wave 2

- Open ticket for NestJS 11→12 migration (8 direct HIGH vulns resolved).
- Open ticket for `postcss` upgrade / Tailwind v4 compatibility review.
- Re-run audit after each dependency bump; gate green = 0 critical, ≤5 HIGH total.