# NexERP — Roadmap 2026-08-24

> 6-fase strategic plan to unify 3 environments (whole ERP / demo subdomain
> / production light) while protecting production data and marketing task.

## Status

| Fase | Nama | Status | Branch | Commit |
|---|---|---|---|---|
| 0 | Stabilization (management task restore) | ✅ DONE | `codex/ui-ux-v2-prototype` | `ea79500` |
| 1 | Push + branching docs | ✅ DONE | `codex/ui-ux-v2-prototype` | docs + push |
| 2A | QR sales generator | ✅ DONE | `feature/lead-capture-qr` | `8ed8381` |
| 2B | Real-time lead events | ✅ DONE | `feature/lead-capture-qr` | `8ed8381` |
| 2C | Sales live dashboard | ✅ DONE | `feature/lead-capture-qr` | `8ed8381` |
| 3 | Module scaffold branches | ✅ DONE | `feature/{rnd,hr,finance,scm}` | one per branch |
| 4 | Integration to production-light | ⏳ TODO | TBD | TBD |
| 5 | Decommission demo subdomain | ✅ DONE | `feature/decommission-demo-subdomain` | `a602464` |
| 6 | Unified deployment | ⏳ TODO | TBD | TBD |

## Fase 0 — Stabilization

Restored management task files from production-light into
`codex/ui-ux-v2-prototype` so that:
- Local dev can login as `revita@nexerp.id`, `luthfi@nexerp.id`,
  `aurel@nexerp.id`, `rahmat@nexerp.id` with `password123`.
- Merging this branch back to production-light is safe (files identical).

## Fase 1 — Push + Branching Strategy

- Pushed commit `ea79500` to `origin/codex/ui-ux-v2-prototype`.
- Created `docs/BRANCHING-STRATEGY.md` documenting the workflow.

## Fase 2 — Lead Capture Live (QR + Real-time)

- Backend: `QrService`, `QrController`, `LeadEventsGateway` (Socket.IO).
- Database: new `qr_codes` table with FK to `users` (ON DELETE SET NULL).
- Migration: `20260824090000_qr_codes_table`.
- Frontend: `/sales/live` dashboard with live counters + recent leads.

## Fase 3 — Module Branches

Scaffolded branches with placeholder docs:
- `feature/rnd` → RND daily-tracking, projects, KPIs
- `feature/hr` → Employee, attendance, payroll, KPI
- `feature/finance` → COA, journal, payments, periods
- `feature/scm` → Suppliers, POs, requisitions, warehouse inbound

Each branch starts from `production-light` (NOT `codex/ui-ux-v2-prototype`)
to preserve marketing task parity.

## Fase 4 — Integration (planned)

Cherry-pick safe commits from each feature branch into `production-light`
for production deployment. Steps:

1. Create `production-light-v2-integration` branch (temporary).
2. Cherry-pick commits one at a time.
3. Verify marketing task files match `ea79500` (no diff).
4. Test E2E in staging.
5. Merge to `production-light`.
6. Deploy to Hetzner.

When: marketing confirms ready for V2 features (~1-2 weeks).

## Fase 5 — Decommission Demo Subdomain

Removed hostname-based prototype mode detection from:
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/lib/api.ts`

`demo.nexerp.id` no longer triggers prototype mode. Set
`NEXT_PUBLIC_PROTOTYPE_MODE=true` env var to enable demo mode explicitly.

DNS cleanup (point `demo.nexerp.id` → production) is a separate ops step.

## Fase 6 — Unified Deployment (planned)

Options:
- **A**: Single deployment, role-based feature gating.
- **B**: Multi-deployment, shared DB, unified codebase.

Recommended: **A** (simpler ops).

When: after Fase 4 stable in production for 1+ month.

---

## Branch Map (current)

```
main
├── production-light (LIVE on Hetzner, marketing daily use)
├── codex/ui-ux-v2-prototype (V2 prototype + management task parity)
├── fix/management-task-remediation (historical SLA fixes)
├── feature/lead-capture-qr (Fase 2 — QR + realtime)
├── feature/decommission-demo-subdomain (Fase 5 — cleanup)
├── feature/rnd (Fase 3 — scaffold)
├── feature/hr (Fase 3 — scaffold)
├── feature/finance (Fase 3 — scaffold)
└── feature/scm (Fase 3 — scaffold)
```

## Safety Contract

1. Marketing task files (frontend ManagementTaskBoard, [member]/page.tsx,
   page.tsx, backend seed.ts) MUST stay identical to commit `ea79500` when
   merging to production-light. Verify with `git diff` before merge.
2. Database changes need migration + rollback plan.
3. No removal of existing users from seed.
4. No removal of existing endpoints (additive only).
5. Production server (Hetzner) runs `production-light` only.

See `docs/BRANCHING-STRATEGY.md` for full workflow.