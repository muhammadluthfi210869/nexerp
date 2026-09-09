# Master Defect Register — Nex Matrix ERP

> **Companion document to plan/NEX_ERP_AUDIT_CLI_ROADMAP.md**  
> **Status:** ACTIVE  
> **Last Updated:** 2026-09-09  

---

## 📈 Defect Summary Matrix

| Severity | Total Open | In Progress | Resolved | Logged in Exceptions |
|---|---|---|---|---|
| **P0 (Blocker)** | 0 | 0 | 0 | 0 |
| **P1 (Critical)** | 0 | 0 | 0 | 0 |
| **P2 (Major)** | 0 | 0 | 0 | 0 |
| **P3 (Minor)** | 0 | 0 | 0 | 0 |

---

## 📋 Defect Log

| Defect ID | Date | Sev | Module | Location (file:line) | Description & Root Cause | Status | Fix Commit | Sign-off Auditor |
|---|---|---|---|---|---|---|---|---|
| *Sample: DEF-P2-001* | *2026-09-09* | *P2* | *Finance* | *backend/src/modules/finance/...* | *Deskripsi temuan contoh* | *RESOLVED* | *abc1234* | *Auditor-CLI* |

---

## 🛡️ Defect Resolution Rules
* **P0 (Blocker):** Data corruption, money mismatch, auth/RBAC bypass, build failure. **BLOCKS RELEASE IMMEDIATELY**. Must be fixed same day.
* **P1 (Critical):** Core workflow failure (e.g. 11-step golden flow broken at step 4). Must be resolved within 3 days.
* **P2 (Major):** Minor logic flaw, visual overflow, missing loading/error state. Can proceed only if approved in plan/audit-reports/EXCEPTIONS.md.
* **P3 (Minor):** Typo, outdated comments, dead CSS/classes. Backlog.
