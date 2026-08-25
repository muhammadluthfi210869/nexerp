# Gate 1 — Frontend Production Build

**RELEASE_SHA:** `163f11249fa3b8651fb2a4e0dc70964f3ec944ad`
**BUILD_TIMESTAMP:** 2026-08-25T01:36:38Z
**HOST:** Windows 11 / Node 22.21.0 / npm 10.9.4

## Command

```bash
cd frontend && npm run build
```

## Results

| Step | Result | Evidence |
|---|---|---|
| `next build` | PASS | BUILD_ID `5pTaANJJFfIIPnUMffVlm`, 166 routes emitted, 811 MB `.next/` artifact |
| Route compilation | PASS | `○` static + `ƒ` dynamic routes all listed in build output |
| Middleware | PASS | `ƒ Proxy (Middleware)` compiled |
| No build-breaking errors | PASS | exit code 0 |

## Route Coverage

All major Day-1 remediation endpoints visible in route table:
- `/warehouse/inbound` ✓ (Warehouse Receiving fix)
- `/logistics/shipments` ✓ (Shipment workspace added)
- `/finance/fund-requests` ✓ (Fund Request navigation)
- `/legality/apj-release` and `/legality/ckpb-audit` ✓ (orphan pages handled via redirects)
- `/rnd/lab-test` ✓ (Lab Test endpoint fix)
- `/scm/receiving`, `/scm/purchase-requests`, `/scm/kebutuhan-barang` ✓
- `/production/*` and `/qc/*` operator pages ✓
- `/rnd/formula/[id]` ✓
- `/system/change-requests` ✓

## Diagnostics

TS6133 (unused import) warnings from the linter are NOT build-breaking.
`next build` does not emit any TypeScript error, route failure, missing-import
failure, or invalid-environment-reference failure.

## Verdict

**FRONTEND PRODUCTION BUILD = PASS**

No TypeScript build-breaking errors. No missing route build failures.
No server/client import failures. No invalid environment references.
