# NEX ERP — New Chat Quickstart (2026-09-11)

> **Purpose**: Practical guide for new AI chat picking up from previous session. Read AFTER `HANDOFF_AUDIT_SUMMARY.md` and `PHASE_4_PLAN.md`.

## 0. First 5 minutes

```bash
# 1. Confirm working directory
cd "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO"

# 2. Check git state
git status
git log --oneline -10
git branch --show-current   # should be phase-3

# 3. Read 3 SSOT docs in order
# - HANDOFF_AUDIT_SUMMARY.md (project state, decisions, paths)
# - PHASE_4_PLAN.md (work plan, 5 workstreams)
# - 00_AUTHORITY_HIERARCHY.md (governance, conflict resolution)
# - NEW_CHAT_QUICKSTART.md (this file)

# 4. Verify dev environment
cd backend && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
cd ../frontend && npx tsc --noEmit 2>&1 | grep "error TS" | grep -vE "\.next/" | wc -l
```

## 1. What's where (file map)

### Backend (NestJS)
```
backend/src/
├── main.ts                                    # bootstrap
├── app.module.ts                              # root module
├── prisma/prisma.service.ts                   # Prisma client
├── modules/                                   # 18+ modules
│   ├── finance/        (CRUD for taxes, currencies, periods, journal)
│   ├── scm/            (purchase orders, vendors, materials)
│   ├── commercial/     (sales orders, invoices, AR)
│   ├── warehouse/      (inbound, transfers, batches, FEFO)
│   ├── hr/             (tickets, attendance, payroll, recruitment)
│   ├── rnd/            (samples, formulas, lab tests)
│   ├── production/     (mixing, filling, packaging, batch records)
│   ├── legality/       (audits, BPOM, permits)
│   ├── bussdev/        (returns, pipeline)
│   ├── master/         (customers, vendors, materials, goods)
│   ├── system/         (state-transition, id-generator, code-engine)
│   ├── marketing/      (excluded per ADR)
│   ├── activity-stream/  (event emitter for cross-module signals)
│   └── notification/     (in-app notification sender)
├── prisma/schema/         (split into multiple .prisma files)
└── scripts/              (utilities)
```

### Frontend (Next.js 16.3.4)
```
frontend/src/
├── app/(dashboard)/                # all operational pages (12+ hybrid functions)
│   ├── finance/{taxes,currencies,periods,invoices,transactions,fund-requests,...}
│   ├── master/{materials,suppliers,customers,goods,hr-attendance,hr-payroll,hr-recruitment,...}
│   ├── warehouse/{inbound,workstation,transfers,components/}
│   ├── production/{mixing,filling,packaging,production-floor-dashboard,...}
│   ├── quality/{coa,inspections,stability,lab-test}
│   ├── bussdev/returns
│   └── ... (12 hybrid functions per ADR-002)
├── components/
│   ├── dna/                        # 47+ DNA primitives (Card, Button, Modal, Table, etc.)
│   ├── ui/                         # shadcn (kept for 8 dashboard Direksi only)
│   └── layout/                     # Sidebar, DashboardShell, etc.
├── hooks/                          # useAuth, useConfirm, useApi, etc.
├── lib/                            # api client, query keys, gates.ts
└── types/                          # TypeScript types
```

### Docs (SSOT)
```
docs/
├── ssot/
│   ├── 00_AUTHORITY_HIERARCHY.md     (AUTHORITY-1, governance)
│   ├── HANDOFF_AUDIT_SUMMARY.md      (project state, decisions)
│   ├── PHASE_4_PLAN.md              (work plan, 5 workstreams)
│   └── NEW_CHAT_QUICKSTART.md       (this file)
├── legacy-erp/
│   ├── NEX_ERP_MASTER_SPECIFICATION.md       (AUTHORITY-2)
│   ├── NEX_ERP_SCREEN_AND_API_CATALOG.json   (AUTHORITY-3)
│   ├── API_CONTRACT.yaml                     (AUTHORITY-4)
│   ├── _AUDIT_ANALYSIS_2026-09-09.md        (NOT authority)
│   └── NEX_ERP_OPERATIONAL_ADDENDUM.md       (AUTHORITY-5)
├── plan/
│   ├── _MASTER_TRACKER.md           (master status)
│   ├── ERP_FINALIZATION_MASTER_PLAN.md (Phase 3-6 spec)
│   ├── PHASE_2_5_LINT_STRATEGY.md
│   ├── ZERO_ERROR_ROADMAP.md
│   ├── HYPER_ALIGNMENT_PLAN.md
│   └── ...
├── security/
│   └── SECURITY-AUDIT-2026-09-11.md
└── phase-3/
    └── SHADCN-AUDIT.md
```

## 2. Common commands (copy-paste ready)

### Dev servers
```bash
# Start both (in 2 separate terminals or as background tasks)
cd backend && npm run start:dev          # http://localhost:3002
cd frontend && npm run dev               # http://localhost:3003
```

### tsc + lint
```bash
# Backend
cd backend && npx tsc --noEmit 2>&1 | head -20

# Frontend (exclude .next cache errors)
cd frontend && npx tsc --noEmit 2>&1 | grep "error TS" | grep -vE "\.next/" | head -20

# Lint
cd frontend && npm run lint 2>&1 | tail -20
```

### Backend tests
```bash
# With heap fix (per memory jest-oom-fix)
cd backend && NODE_OPTIONS=--max-old-space-size=8192 npx jest --runInBand 2>&1 | tail -30

# Vitest frontend
cd frontend && npm test 2>&1 | tail -30
```

### Git
```bash
git status
git log --oneline -10
git diff --stat
git add <files>
git commit -m "<conventional commit message>"
```

## 3. Build & Test Workflow (recommended per commit)

1. **Make code changes** in one focused workstream
2. **Type check**: `cd frontend && npx tsc --noEmit` and `cd backend && npx tsc --noEmit`
3. **Lint check**: `cd frontend && npm run lint`
4. **Smoke test**: Start dev server, navigate to changed page, verify no console errors
5. **Atomic commit**: 1 workstream = 1 commit
6. **Push when ready**: `git push origin phase-3`

## 4. Common Gotchas (per previous session memory)

### Next.js 16 specifics (per AGENTS.md: NOT the Next.js you know)
- Server components by default — use `"use client"` at top for client-side
- File-based routing: `app/(dashboard)/[path]/page.tsx`
- Middleware → Proxy convention (deprecated `middleware.ts` → use `proxy.ts`)
- Turbopack default in dev (some legacy patterns incompatible)
- Path parameters: use `params: Promise<{...}>` (not sync object)

### Authority hierarchy (CRITICAL)
- Authority-1: LOCKED decisions (D-001 GLOBAL code, D-002 4-state stok) — OVERRIDE master until master is revised
- Authority-2: Master spec — defines WHAT
- Authority-3: Screen catalog — defines WHICH screens
- Authority-4: API contract — defines HOW (transport only, no business semantics)
- Authority-5: Operational addendum — fills gaps, never contradicts
- Authority-6: Legacy/archive evidence — read-only reference

When 2 docs conflict, higher tier wins. When same tier, STOP + register SPEC_GAP. NEVER INFER.

### DnaFieldCompat shim
- Pages import `{ Button, Input, ... }` from `@/components/dna` — shim aliases to DnaButton, DnaInput, etc.
- 100% DNA at runtime, shadcn-style API at call site
- If shim breaks, fix `DnaFieldCompat.tsx` — DO NOT change consumer code

### Component patterns
- All DNA primitives at `frontend/src/components/dna/`
- New primitives must be added to `index.ts` barrel
- Use `DnaDataTableCard`, `DnaKpiGrid`, `DnaStatCard`, `DnaButton`, etc. — NEVER raw shadcn

### Backend patterns
- All controllers extend via `PrismaService` + `AuthGuard` + `RolesGuard`
- Roles: `SUPER_ADMIN`, `DIRECTOR`, `FINANCE`, `WAREHOUSE`, `SALES`, `RND`, `PRODUCTION`, `HR`, `COMPLIANCE`, `COMMERCIAL`, `MARKETING`, `DIGIMAR`, `BUSDEV`, `LEGAL`, `AUDIT`
- Use `@Roles(...)` decorator for RBAC
- DTOs use class-validator
- Return `NotFoundException` (404), `BadRequestException` (400), `ForbiddenException` (403) for errors

### Known issues
- 145 TS warnings (mostly unused imports) — non-blocking
- 75 security vulns (2 critical → 1 fixed: next 16.3.4; 1 residual: `@xhmikosr/decompress` transitive devDep)
- 8 dashboard Direksi files still using shadcn (locked per ADR)
- Marketing route conflict (already fixed via slug unification)

## 5. Decision Points (when to ask user)

| When | Ask | Why |
|---|---|---|
| KPI formula per divisi | "What's the 1-angka formula?" | Business decision, not technical |
| New Prisma model | "Approve schema migration?" | Affects DB, production data |
| KPI threshold (good/bad) | "What's the threshold?" | Business decision |
| File storage backend | "S3 or local?" | Cost vs scalability |
| Marketing scope (excluded per ADR) | "Re-scope?" | Big decision, breaks ADR |
| Phase 4 workstream priority | "Which first?" | Time budget |

## 6. First Task Recommendation

If user doesn't specify which WS first, start with **WS-D (Activity Tracking)** because:
- It's the critical path (foundation for KPI, Comms, Decision Support)
- It's smallest scope (~2-3 days)
- It unblocks 3 other workstreams

Concrete first task:
1. Create `backend/src/modules/activity-log/` with:
   - `activity-log.module.ts`
   - `activity-log.service.ts` (single `log(activity: LogInput)` API)
   - `activity-log.controller.ts` (`GET /activity-log/me?from=&to=`)
   - `dto/log-activity.dto.ts`
2. Add Prisma model `ActivityLog` to `backend/prisma/schema/` (append-only, no UPDATE/DELETE)
3. Create NestJS interceptor to auto-log all `POST/PUT/PATCH/DELETE` on existing controllers
4. Frontend `useActivityLog()` hook: auto-log page views
5. Run `prisma migrate dev` for new model
6. Verify: tsc + smoke test

Then WS-A (State Machine UI) can run in parallel.

## 7. If Something Goes Wrong

| Symptom | Fix |
|---|---|
| `tsc` shows 145+ errors | These are mostly unused imports (★). NOT blocking. |
| Dev server won't start (port 3003 in use) | `powershell -Command "Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue \| Select-Object OwningProcess"`, then `Stop-Process -Id <pid> -Force` |
| Route conflict ("different slug names") | Check `frontend/src/app/(dashboard)/marketing/reports/[brand]/[channel]/` — slug names must match folder names |
| shim import fails | Check `frontend/src/components/dna/DnaFieldCompat.tsx` |
| Backend test OOM | `NODE_OPTIONS=--max-old-space-size=8192` |
| Next.js cache issues | Delete `frontend/.next/` and restart |
| Document edits cause conflicts | Read `00_AUTHORITY_HIERARCHY.md` for conflict resolution |

## 8. Quick Links

- Authority Hierarchy: `docs/ssot/00_AUTHORITY_HIERARCHY.md`
- Handoff Audit: `docs/ssot/HANDOFF_AUDIT_SUMMARY.md`
- Phase 4 Plan: `docs/ssot/PHASE_4_PLAN.md`
- Master Plan: `docs/plan/_MASTER_TRACKER.md` + `docs/plan/ERP_FINALIZATION_MASTER_PLAN.md`
- Security: `docs/security/SECURITY-AUDIT-2026-09-11.md`
- Backend: http://localhost:3002/api/docs (Swagger)
- Frontend: http://localhost:3003

## 9. Memory Reference (cross-session)

Memory location: `C:\Users\Luthfi\.claude-minimax\projects\C--GAWE-Web-Dev-Porto-Aureon-ERP-FROM-ZERO\memory\`

Key files:
- `MEMORY.md` — index
- `phase-3-complete-2026-09-11.md` — Phase 3 status
- `ssot-stabilization-2026-09-11.md` — SSOT stabilization work
- `ssot-operational-addendum-2026-09-11.md` — Addendum work
- `session-2026-09-11-batches-1-5-complete.md` — Initial Phase 3 batches

If new chat needs deeper context, read these.

---

*Quickstart v1.0, 2026-09-11. By previous chat session.*
