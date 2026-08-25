# R4 Release Candidate Freeze

## Metadata

| Field | Value |
|---|---|
| RELEASE_BRANCH | release/r4-candidate |
| RELEASE_SHA | 163f11249fa3b8651fb2a4e0dc70964f3ec944ad |
| WORKTREE_PATH | C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO |
| DIRTY_TRACKED | 0 |
| DIRTY_UNTRACKED_ARTIFACTS | 382 (logs, debug scripts, _runtime-evidence — not part of release) |
| BUILD_TIMESTAMP | 2026-08-25T01:36:38Z |
| HOST | Windows 11 / Node 22.21.0 / npm 10.9.4 |

## Scope of the freeze

This commit captures the Day-1 remediation closure
(`NEX-DAY1-REMEDIATION-CLOSURE.md`, 2026-08-25):

- Warehouse inbound payload DTO fix
- Shipment workspace added (`/logistics/shipments`)
- Fund Request canonical navigation
- Legalitas orphan pages removed from initial rollout
- R&D Lab Test endpoint fix (`/rnd/lab-test`)
- BusDev follow-up PATCH endpoint
- Production operator pages in sidebar
- QC navigation in sidebar
- Prototype/mock disabled in production mode (`NODE_ENV` guard)
- Finance audit actor identity fix
- Finance settlement consistency hardened
- Document system frozen
- Cutover tooling and plans prepared

Tracked diff: 243 files changed, 28710 insertions(+), 22902 deletions(-)

## Untracked artifacts (excluded from release)

382 untracked items exist in the worktree but are NOT part of the release:
- `.log` / `.err` / `.out` runtime logs from prior batches
- `artifacts/`, `_runtime-evidence/`, `document-evidence/` diagnostic scripts
- `debug-*.mjs` / `check-*.js` / `inspect*.js` debug helpers
- `phase*-*.tar.gz` historical snapshot archives
- `.playwright-cli/` console logs
- `tmp-*.bin`, `tmp-*.json`, `tmp-render*.mjs` scratch render artifacts

These will be re-evaluated under `.gitignore` discipline but do not affect Gate 1
because they are never referenced by the build (Next.js / Nest pick up only `src/`,
`prisma/`, and the configuration files that ARE tracked).

## Next step

Run Gate 1 Backend Production Build, Frontend Production Build, and Day-1
Remediation Playwright against this SHA.
