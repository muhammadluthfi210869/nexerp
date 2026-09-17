# Cleanup Log — 2026-09-16

## Tujuan
Membersihkan file duplikat dan outdated di `docs/legacy-erp/` agar struktur direktori jelas dan SSOT (Single Source of Truth) tidak ambigu.

## File Dihapus (14 total)

### `docs/legacy-erp/raw/` — 13 file (duplikat dari parent + 1 outdated)

| File | Reason |
|------|--------|
| `raw/_RND Tracking AGUSTUS 2026 - Daily Tracking.csv` | Byte-identical dengan parent (8925 bytes) |
| `raw/_RND Tracking AGUSTUS 2026 - Project Monitoring.csv` | Byte-identical dengan parent (6122 bytes) |
| `raw/AMI - ACTIVITY WORK - JULI (1).csv` | Byte-identical dengan parent (12515 bytes) |
| `raw/Client_Sample_Busdev.csv` | Byte-identical dengan parent (12515 bytes) |
| `raw/kil_erp_full_inventory.csv` | Byte-identical dengan parent (89345 bytes) — v0 baseline |
| `raw/kil_erp_full_inventory_v1.csv` | Byte-identical dengan parent (112769 bytes) — interim v1 |
| `raw/kil_erp_full_inventory_v2.csv` | Byte-identical dengan parent (123880 bytes) — v2 full spec |
| `raw/KPI_REFERENCE.md` | Byte-identical dengan parent (23488 bytes) |
| `raw/LEGACY_ERP_AUDIT.md` | Byte-identical dengan parent (8698 bytes) |
| `raw/LEGACY_ERP_SPEC.md` | Byte-identical dengan parent (33951 bytes) |
| `raw/NEX_FINANCE_FINAL_SPEC.md` | Byte-identical dengan parent (59115 bytes) |
| `raw/REQUIREMENT.md` | Byte-identical dengan parent (10567 bytes) |
| `raw/NEX-Finance-Module-Full-Spec (1).md` | Old version (51466 bytes) — superseded by `NEX_FINANCE_FINAL_SPEC.md` |

### `docs/legacy-erp/` (parent) — 1 file

| File | Reason |
|------|--------|
| `kil_erp_full_inventory_v1.csv` | Interim refinement antara v0 dan v2 — superseded by v2 (per NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md) |

## File Dipertahankan

### Parent (`docs/legacy-erp/`)
- `kil_erp_full_inventory.csv` (v0 — 89KB, baseline operasional riil)
- `kil_erp_full_inventory_v2.csv` (v2 — 124KB, full spec including 31 expansion)
- `KPI_REFERENCE.md`, `LEGACY_ERP_AUDIT.md`, `LEGACY_ERP_SPEC.md`
- `NEX_ERP_MASTER_SPECIFICATION.md`, `NEX_ERP_SCREEN_AND_API_CATALOG.json`, `NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md`, `NEX_FINANCE_FINAL_SPEC.md`
- `API_CONTRACT.yaml`, `REQUIREMENT.md`
- `MASTER_DATA/*.csv` (data master asli dari legacy)
- `backend/*.md` (project management docs)
- `_AUDIT_ANALYSIS_2026-09-09.md` (historical audit)
- `_crawl/` (raw crawl data baru)
- `_SSOT_FINAL.md` (NEW — SSOT utama)
- `_CRAWL_STATUS.md` (NEW — crawl progress)
- `_cleanup_log.md` (NEW — this file)

### `raw/` (25 file tersisa — UNIQUE analytical docs)
- `05_master_business_process_blueprint.md`
- `06_implementation_log_financial_gates.md`
- `07_full_stack_integrity_plan.md`
- `2026-09-08-agent-orchestration-design.md`
- `DATA_DASHBOARD.md`
- `database.md`, `databasev2.md`
- `design-packing.md`
- `Daily_tracking_RND.csv`, `Project_Monitoring_RND.csv` (variants)
- `ERP_BUSINESS_FLOW_GAP.md`
- `ERP_ENTERPRISE_AUDIT_LEDGER.md`
- `ERP_FUNCTIONAL_PARITY_MATRIX.md` ← KEEP classification
- `ERP_INPUT_OUTPUT_LINEAGE.md` ← KEEP
- `ERP_NEW_ADVANCEMENT_MAP.md` ← KEEP
- `ERP_NEW_SYSTEM_INVENTORY.md`
- `ERP_OLD_BUSINESS_FLOW.md`
- `HR.md`
- `input-ouput.md`
- `legalitas.md`
- `production.md`
- `quality_control.md`
- `r&d.md`
- `VPS_DEPLOYMENT.md`
- `warehouse.md`

## Statistik

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Files in `raw/` | 38 | 25 | -13 (-34%) |
| Files in parent (`legacy-erp/`) | ~22 (root) | ~21 (root) | -1 |
| Total files deleted | — | **14** | — |
| Disk space saved | — | ~430 KB | — |

## Verifikasi

```bash
# raw/ sekarang harus berisi 25 file unik
ls raw/ | wc -l
# Output: 25

# v1 harus sudah hilang dari parent
ls kil_erp_full_inventory_v1.csv 2>&1
# Output: No such file or directory
```

## Tanggal

2026-09-16 — oleh automated cleanup (Claude) berdasarkan identifikasi duplikat byte-identical + file outdated.

Lihat `_SSOT_FINAL.md` untuk hasil akhir audit.