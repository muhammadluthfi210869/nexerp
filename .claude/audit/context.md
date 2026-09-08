---
generated: 2026-09-08
phase: A0-bootstrap
auditor_version: 1.0
---

# Audit Context — Condensed Decision Tree

## Sources of Truth (priority order)
1. User instruction terbaru
2. `docs/legacy-erp/REQUIREMENT.md` (78 poin Upii)
3. `docs/legacy-erp/NEX_FINANCE_FINAL_SPEC.md`
4. Department-approved specs
5. `docs/legacy-erp/LEGACY_ERP_SPEC.md`
6. `plan/NEX_ERP_REFACTOR_ROADMAP.md`
7. `plan/NEX_ERP_AUDIT_CLI_ROADMAP.md`
8. (Lowest) Existing codebase — bisa salah

## Scope Locks (dari REFACTOR_ROADMAP Section 0.1)
- ✅ EDIT: Operational pages (semua divisi kecuali Digital Marketing)
- 🔒 LOCKED: Dashboard pages (semua divisi)
- 🚫 EXCLUDED: Module Digital Marketing
- ✅ EDIT: Project Control + KPI Management pages
- ✅ EDIT: DNA components (`@/components/dna/*`)
- ✅ EDIT: Backend code (incremental remediation)
- ✅ EDIT: Master data + COA + posting rules

## Decision Tree untuk Kontradiksi
- Dashboard vs Operational style conflict → Dashboard LOCKED wins
- DNA import vs raw `@/components/ui/*` → DNA-only wins (ADR-007)
- CSV vs REQUIREMENT conflict → CSV wins (per Section 6.3)
- New requirement not in roadmap → flag ke user, jangan auto-implement

## Severity Quick Reference
- P0: Data loss, security, blocker → BLOCK release
- P1: Degraded functionality → BLOCK (with exception)
- P2: Cosmetic → CONDITIONAL PASS, log exception
- P3: Nit → PASS, backlog

## Key Sections Reference
- Hallucination Rules: REFACTOR_ROADMAP Section 12
- Ship Criteria: REFACTOR_ROADMAP Section 13
- Phase Gates: REFACTOR_ROADMAP Section 14
- Requirement Traceability: REFACTOR_ROADMAP Section 15
- Production Readiness: REFACTOR_ROADMAP Section 16
- Kontradiksi Resolution: REFACTOR_ROADMAP Section 17

## Key CSVs (single source of truth untuk inventory)
- `docs/legacy-erp/kil_erp_full_inventory_v2.csv` — master inventory
- `docs/legacy-erp/Client_Sample_Busdev.csv` — BusDev Client Sample (28 kolom)
- `docs/legacy-erp/Daily_tracking_RND.csv` — R&D Daily Tracking (14 kolom)
- `docs/legacy-erp/Project_Monitoring_RND.csv` — R&D Project Monitoring (11 kolom)
