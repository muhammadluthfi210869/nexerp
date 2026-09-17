# Review: `01_DOMAIN_MODEL.md`

> **Audit date**: 2026-09-16
> **File**: 1,917 lines, ~73KB
> **Status declared**: LOCKED
> **Verdict**: 🟠 **Count mismatch** — definisi entity solid tapi angka "70 models" sudah outdated

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 1,917 | wc -l |
| Sections (##) | 17 + 2 appendices | grep |
| Claims (claimed) | "**70 Prisma models** in 10 sections" | §1.1 |
| Actual schema.prisma models | **89** | grep |
| TBD markers | 7+ in §15 | grep |
| Code format entries | 13+ entities | manual |

---

## ✅ Strengths

### Business Analyst view
- **Field-level detail** per entity (termasuk type, required, default, example) — cukup untuk business owner validate business rules.
- **Validation Rules per entity** (§16) — explicit constraints.
- **Migration Mapping** (§15) — meski ada TBD, strukturnya jelas: source entity → target entity → ETL steps.
- **Status Machine Summary** (Appendix B) — overview lintas entity.

### Software Architect view
- **ER Diagram** (§13) — visualisasi relationships.
- **Indexes & Performance** (§14) — explicit indexing strategy.
- **Authority order** eksplisit di header.

### QA view
- Setiap entity punya **validation rules** yang bisa jadi test cases.
- **Code format** deterministic per entity — bisa di-test dengan fixture.
- **Status machine** per entity implicit via Appendix B.

---

## 🔴 Critical Findings

### CRIT-1: Entity count drift
- **§1.1**: "**70 Prisma models** defined in `schema.prisma`, grouped into **10 sections**"
- **Actual** schema.prisma: **89 models** (verified `grep -c "^model "`)
- **§2.1 tabel** juga stale dengan angka entity count per module yang undercount

**Impact**: Setiap referensi ke "70 models" salah. Developer baru akan bingung.

**Fix**: Update §1.1 → "**89 Prisma models** grouped into **10 sections**". Cross-check §2.1 tabel entity count juga.

---

## 🟠 Major Findings

### MAJ-1: §15 Migration Mapping — 7+ TBD entries (LOCKED tapi ada placeholder)
§15 entries dengan `(TBD)`:
| Line | Entity | Note |
|------|--------|------|
| 1694 | Customer | "ETL from `/customer-manage`" |
| 1695 | Supplier | "ETL + 4-pillar remapping" |
| 1696 | Goods | "ETL + 8 COA mapping slots" |
| 1697 | SalesOrder | "ETL + add `deliveryGateStatus=HELD`" |
| 1698 | PurchaseOrder | "ETL + date = today (read-only)" |
| 1699 | SalesInvoice | "ETL" |
| (more) | ... | ... |

**Issue**: Dokumen LOCKED tidak boleh punya placeholder. TBD harus diisi sebelum status LOCKED valid.

**Fix**: 
- Option A: Isi semua TBD entries (ekspansi kerja ETL).
- Option B: Downgrade status ke DRAFT/STABLE sampai ETL selesai.
- Option C: Hapus §15 dari dokumen ini, pindah ke `NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md` atau ETL-specific contract.

### MAJ-2: Format Kode Universal inconsistency
Entity code formats di dokumen ini:

| Pattern | Entities |
|---------|----------|
| `{PREFIX}-{YYMM}-{XXXX}` (per-bulan) | SalesSample (BSP), SalesDownPayment (DPJ), SalesInvoice (FJ), SalesPayment (BPJ), PurchaseDownPayment (DPB), GoodsReceipt (GR), PurchaseInvoice (FP), PurchasePayment (BPB), JournalEntry (JU) |
| `{PREFIX}-{DDMMYYYY}-{XXXX}` (global sequence) | SalesOrder (SO), PurchaseOrder (PO), DeliveryOut (DO), FixedAsset (AST) |

**Issue**: 2 pattern berbeda. DEC-020 reference Format Kode Universal tapi tidak specify mana yang dipakai kapan.

**Rekomendasi**: 
- Pakai 1 pattern, atau
- Definisikan kapan YYMM vs YYYYMMDD dipakai (per-month untuk invoice-like, global sequence untuk transaction header?).

### MAJ-3: 10 sections di §1.1 tabel vs actual model grouping
Tabel §1.1 mengelompokkan 70 models ke 10 sections:
- 3. Auth & User (7)
- 4. Master Data (12)
- 5. Sales Pipeline (13)
- 6. Purchase Pipeline (11)
- (dst — belum dicek semua)

Actual schema.prisma grouping by module prefix:
- Org/Auth: 9 (Organization, Role, Permission, RolePermission, User, UserSession, AuditLog, ActivityLog, Division)
- Master: 10 (CustomerCategory, Customer, SupplierCategory, Supplier, GoodsCategory, Goods, Warehouse, WarehouseAccess, Coa, CoaAuto, Formulation, FormulationAdjustment) = 12 actually
- Sales: 14 (Lead, LeadDetail, SalesSample, SalesSampleApproval, SalesSamplePayment, SalesDownPayment, SalesOrder, SalesOrderDetail, SalesOrderApproval, SalesInvoice, SalesInvoiceDetail, SalesPayment, SalesReturn, SalesReturnDetail, SalesReturnApproval, SalesReturnIn, SalesTarget) = 17 actually
- Purchase: 12 (PurchaseRequest, PurchaseRequestDetail, PurchaseRequestApproval, PurchaseOrder, PurchaseOrderDetail, PurchaseOrderApproval, PurchaseDownPayment, GoodsReceipt, GoodsReceiptDetail, PurchaseInvoice, PurchaseInvoiceDetail, PurchasePayment, PurchaseReturn, PurchaseReturnApproval, PurchaseReturnOut) = 15 actually
- Production: 9 (BatchRecord, ScheduleMixing, ScheduleFilling, SchedulePackaging, ProductionMixing, ProductionMixingItem, ProductionFilling, ProductionFillingItem, ProductionPackaging, ProductionPackagingItem, DeliveryOut, DeliveryOutDetail) = 12 actually
- Warehouse: 5 (StockMovement, StockOpname, StockOpnameDetail, StockAdjustment) = 4 actually + above
- Finance: 5 (CashBank, JournalEntry, JournalLine, TaxSetup, FixedAsset, Budget, FundRequest) = 7 actually
- Checklist: 4 (ChecklistCategory, Checklist, ChecklistProgress, ChecklistTracking)
- HR: 3 (Employee, EmployeeContract, EmployeePerformance)
- Communication: 6 (Note, StatusTransition, Tag, Comment, Attachment, Notification)

**Total actual**: ~89 models

**Issue**: Tabel §1.1 entity count per section tidak match actual.

**Fix**: Rebuild tabel dari actual schema.prisma.

### MAJ-4: Appendix B — Status Machine Summary
"Status Machine Summary" — appendiks tanpa detail lengkap. Apakah semua status per entity ada di sini? Cross-reference ke `03_WORKFLOW_STATE_MACHINE.yaml` eksplisit atau implicit?

**Rekomendasi**: Tambah link langsung ke file workflow untuk setiap entity.

### MAJ-5: §17 Open Questions — apakah ini tracked?
§17 "Open Questions" harusnya link ke `BUSINESS_RULES.md Lampiran B` atau `MASTER_SPEC §8.3 PENDING`.

---

## 🟡 Minor Findings

### MIN-1: Tidak ada explicit reference ke RBAC matrix untuk per-entity role permissions
Setiap entity harusnya reference ke `07_RBAC_MATRIX.yaml` untuk writer/reader roles (bukan hanya §2 Owner di tiap entity section).

### MIN-2: §4 Code Format Reference (Appendix A) — apakah konsisten dengan §15 entity code format?
Verifikasi apakah Appendix A match dengan inline entity code format definitions.

### MIN-3: Cross-reference ke `02_DATA_OWNERSHIP.yaml` minim
Dokumen ini ownership-nya implicit (1 writer per module), tapi tidak eksplisit reference ke `02_DATA_OWNERSHIP.yaml` cross_module_writes.

### MIN-4: §13 ER Diagram — text-based, bukan visual mermaid
Apakah ada versi mermaid? Text-based lebih sulit dibaca untuk 89 entities.

### MIN-5: Tidak ada section tentang audit fields per entity
Setiap entity harusnya punya explicit `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt` per LOCKED principle #7 (audit-first) dan #8 (soft-delete). Apakah implicit di Prisma default atau eksplisit per entity?

---

## 🔵 Nit / Polish

### NIT-1: §1 intro "Authority order: `_SSOT_FINAL.md` > `00_MASTER_SPEC.md` > `09_NON_FUNCTIONAL_CONTRACT.md` > this document"
- Conflict dengan MASTER_SPEC §9.4 yang berbeda.
- Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-4.

### NIT-2: Tabel §1.1 styling — beberapa row punya emoji/icon, beberapa tidak. Konsistensi.

### NIT-3: §16 Validation Rules — apakah setiap rule punya DEC reference atau BUS-RULE reference? Cross-check dengan `04_BUSINESS_RULES.md`.

---

## 📋 Rekomendasi per Section

| § | Issue | Priority |
|---|-------|----------|
| 1.1 | Update "70 → 89 models" | P0 |
| 2.1 | Rebuild entity count tabel dari schema | P0 |
| 15 | Resolve TBD markers | P1 |
| 13 | Tambah mermaid ER diagram | P2 |
| 16 | Cross-ref ke BUS-RULE | P2 |
| 17 | Link ke MASTER_SPEC §8.3 | P1 |
| App A | Verify format consistency | P2 |
| App B | Link ke 03_WORKFLOW | P2 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md` for overall verdict
- See `_CROSS_DOC_INCONSISTENCIES.md` X-1 (entity count)
- See `02_DATA_OWNERSHIP_REVIEW.md`, `03_WORKFLOW_STATE_MACHINE_REVIEW.md`, `04_BUSINESS_RULES_REVIEW.md`, `schema.prisma_REVIEW.md`
