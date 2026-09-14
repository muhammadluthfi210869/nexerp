# Documentation Index

> **Last updated**: 2026-09-14

This is the navigation hub for NexERP documentation. For day-to-day work, start with [ARCHITECTURE.md](../ARCHITECTURE.md) for the big picture, then drill into specific docs below.

## Top-Level

| Doc | Purpose |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Branch topology + deploy stack diagram. **Read first.** |
| [DEPLOY.md](../DEPLOY.md) | Single-env compose workflow. How to deploy from local to VPS. |
| [RUNBOOK.md](../RUNBOOK.md) | Incident response: P0/P1/P2 procedures, secret rotation, DB restore. |
| [PRODUCTION_LIGHT.md](../PRODUCTION_LIGHT.md) | Why production-light is intentionally pruned (5 modules vs phase-3's 38). |
| [CLAUDE.md](../CLAUDE.md) | Project guide for AI assistants (QA Gate mandate + anti-looping rules). |

## Workflow

| Doc | Purpose |
|---|---|
| [BridgePattern.md](BridgePattern.md) | **phase-3 → production-light surgical cherry-pick workflow. READ before any cross-branch work.** |
| [qa-gate/](qa-gate/) | Per-feature QA gate reports. Read latest before claiming deploy "ready to ship". |

## Module Specs

| Doc | Purpose |
|---|---|
| [marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md](marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md) | SSOT v1.2.0 binding contract for management-task module. |
| [marketing/PHASE-6-DEPLOY-RUNBOOK.md](marketing/PHASE-6-DEPLOY-RUNBOOK.md) | Phase 6 (marketing finalization) deploy runbook. |
| [marketing/PHASE-4-GO-LIVE-RUNBOOK.md](marketing/PHASE-4-GO-LIVE-RUNBOOK.md) | Phase 4 mgmt-task go-live. |
| [marketing/OMNICRM-DEPLOY.md](marketing/OMNICRM-DEPLOY.md) | OmniCRM module deploy notes. |
| [marketing/DIGITAL_MARKETING_GAP_ANALYSIS.md](marketing/DIGITAL_MARKETING_GAP_ANALYSIS.md) | Digital marketing gap analysis (excluded from production-light per refactor scope). |

## Governance

| Doc | Purpose |
|---|---|
| [governance/](governance/) | Cherry-picked SSOT essentials from phase-3's `docs/ssot/`. |
| [legacy-erp/_archive/VPS_DEPLOYMENT.md](legacy-erp/_archive/VPS_DEPLOYMENT.md) | Legacy VPS guide (nginx + SSL tips). Still relevant for cert/SSL issues. |
| [reference/DREAMLAB-ERP-INVENTORY.md](reference/DREAMLAB-ERP-INVENTORY.md) | Dreamlab ERP inventory reference (read-only). |

## Scripts (code-level)

| Script | Purpose |
|---|---|
| `scripts/bridge-to-production-light.sh` | **The centerpiece.** Cherry-picks atomic commit from phase-3 with full validation guards. |
| `scripts/safe-merge.sh` | Wrapper for `git merge` that BLOCKS wholesale phase-3 merge + enforces size threshold. |
| `scripts/rollback.sh` | Sub-10s image-tag-based rollback. |
| `scripts/db-snapshot.sh` | Standalone `pg_dumpall` to `backups/snapshot-YYYYMMDD-HHMMSS.sql.gz`. |
| `scripts/deploy.sh` | Server-side deploy (run on VPS after `git pull`). |
| `scripts/deploy-biznet.sh` | Biznet-only deploy without `--build` (image-transfer model). |
| `scripts/verify-deploy.sh` | Pre-deploy sanity check. |
| `scripts/test-deploy.sh` | CI integration test. |
| `scripts/__tests__/` | Regression test harness — `bash scripts/__tests__/run-all.sh`. |

## How docs are organized

```
/
├── ARCHITECTURE.md        # ← read this first
├── DEPLOY.md
├── RUNBOOK.md
├── PRODUCTION_LIGHT.md
├── CLAUDE.md
├── docs/
│   ├── INDEX.md           # ← you are here
│   ├── BridgePattern.md
│   ├── governance/
│   ├── marketing/
│   ├── qa-gate/
│   ├── reference/
│   └── legacy-erp/_archive/
└── scripts/
    ├── bridge-to-production-light.sh
    ├── safe-merge.sh
    ├── rollback.sh
    ├── db-snapshot.sh
    └── __tests__/
└── .github/workflows/ci.yml
```
