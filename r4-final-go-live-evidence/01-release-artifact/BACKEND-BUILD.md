# Gate 1 — Backend Production Build

**RELEASE_SHA:** `163f11249fa3b8651fb2a4e0dc70964f3ec944ad`
**BUILD_TIMESTAMP:** 2026-08-25T01:36:38Z
**HOST:** Windows 11 / Node 22.21.0 / npm 10.9.4

## Command

```bash
cd backend && rm -rf dist && npm run build
```

## Results

| Step | Result | Evidence |
|---|---|---|
| `prisma generate` | PASS | `✔ Generated Prisma Client (v7.8.0) to .\node_modules\@prisma\client in 1.35s` |
| `check:env` (env validator) | PASS | `[OK] JWT_SECRET`, `[OK] AES_SECRET_KEY`, `[OK] DATABASE_URL`, `[OK] CORS_ORIGIN` → `[OK] Environment validation passed.` |
| `nest build` (SWC) | PASS | `Successfully compiled: 296 files with swc (650.2ms)` |

Exit code: 0

## Artifacts

```
dist/main.js        # bootstrap
dist/app.*.js       # 296 compiled modules
dist/app.module.js  # root module
dist/prisma/        # generated client (v7.8.0)
Total dist size:    6.8 MB
```

## TS6133 unused-variable warnings (NOT build-breaking)

Diagnostics flagged TS6133 unused imports/variables in 10 source files. These are
informational warnings emitted by `tsc` / IDE scanners; SWC and `nest build`
do not treat them as errors. They do not affect runtime, do not affect
deployment, and do not change module behavior. To be addressed in a separate
dead-code hygiene pass after R4 — out of scope for this gate.

Affected files (informational only):
- `backend/src/modules/scm/services/purchase-orders.service.ts`
- `backend/src/modules/document-automation/services/document-automation.service.ts`
- `backend/src/modules/bussdev/bussdev.controller.ts`
- `backend/src/modules/bussdev/bussdev.service.ts`
- `backend/audit-counts.js`
- `frontend/src/app/(dashboard)/warehouse/inbound/page.tsx`
- `frontend/src/app/(dashboard)/logistics/shipments/page.tsx`
- `frontend/src/app/(dashboard)/rnd/lab-test/page.tsx`
- `frontend/src/components/layout/Sidebar.tsx`

## Verdict

**BACKEND PRODUCTION BUILD = PASS**

No TypeScript build-breaking errors. No missing modules. No environment
validation failures. No Prisma client generation failures.
