# 📚 INDEX Dokumentasi NexERP

> **Dunia 1-branch (sejak konsolidasi 2026-09):** satu branch production `main`,
> satu domain `https://nexerp.id`, deploy via GHCR. Workflow dua-branch
> (`production-light` + BridgePattern) sudah **DIARSIPKAN** — baca
> [PRODUCTION_LIGHT.md](../PRODUCTION_LIGHT.md) hanya sebagai sejarah.

## 🔧 Operasi & Deploy
| Dokumen | Isi |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Topologi 1 branch + diagram stack deploy GHCR→VPS |
| [DEPLOY.md](../DEPLOY.md) | SOP deploy/rollback harian (`scripts/deploy.sh <sha>`) |
| [RUNBOOK.md](../RUNBOOK.md) | Incident response P0/P1/P2 |
| [RUNBOOK-DEPLOY-NEXERP-V2.md](RUNBOOK-DEPLOY-NEXERP-V2.md) | SOP emas anti-ghost-rollback + snapshot pra-deploy |
| [LEAD-CAPTURE-SYSTEM.md](LEAD-CAPTURE-SYSTEM.md) | Alur WA → dedup → AI extract → Kommo |
| [qa-gate/](qa-gate/) | Laporan QA gate per rilis (format wajib sebelum klaim "selesai") |

## 🧭 Navigasi Kerja ERP
| Folder | Isi |
|---|---|
| [plan/](plan/) | Perencanaan phase & backlog |
| [design/](design/) | Spec desain / Binary Audit Vision |
| [marketing/](marketing/) | Spec divisi marketing (digital, toribio, management-task) |
| [communication_protocol/](communication_protocol/) | Konvensi API/event antar modul |
| [security/](security/) | Threat model, rotasi kunci, catatan JWT/AES |
| [legacy-erp/](legacy-erp/) | Konteks ERP lama (referensi migrasi) |
| [reference/](reference/) | Catatan referensi eksternal |
| [DNA-RULES-CONTRACT.md](DNA-RULES-CONTRACT.md) | Kontrak aturan desain kode |
| [SPEC-GAP-MAP.md](SPEC-GAP-MAP.md) | Peta gap spec ↔ implementasi |
| `_AUDIT_*` (2026-09-09) | Snapshot audit 19 area — dasar keputusan refactor |
| [REFACTOR-MANAGEMENT-TASK-SCHEMA.md](REFACTOR-MANAGEMENT-TASK-SCHEMA.md) | Rencana skema management-task |

## 🚫 Arsip (historis, JANGAN diikuti sebagai workflow)
- [PRODUCTION_LIGHT.md](../PRODUCTION_LIGHT.md) — alasan pemangkasan 2026-07 (cabang sudah dihapus)
- [MIGRATION-BIZNET.md](../MIGRATION-BIZNET.md) — migrasi Hetzner→Biznet 2026-08
- `docs/qa-gate/2026-09-14-*` — laporan insiden wholesale-merge & canonical bridge era production-light
