# Review: `schema.prisma`

> **Audit date**: 2026-09-16
> **File**: 2,258 lines, ~91KB
> **Status declared**: (LOCKED per docs reference)
> **Verdict**: 🟠 **Drift dari docs** — schema lebih besar dari klaim dokumen lain

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 2,258 | wc -l |
| Total models | **89** | grep `^model ` ✓ ground truth |
| Doc claim | "70 models" (01_DOMAIN_MODEL), "78 entity catalog" (02_DATA_OWNERSHIP), "89 entities, ~78 covered" (05_API_CONTRACT) | 3 different numbers |
| Naming convention | PascalCase ✓ | consistent |
| Multi-tenant field | `organizationId`? | need to verify |

---

## ✅ Strengths

### Business Analyst view
- **89 models** covering all ERP domains — comprehensive.
- **Field-level type** explicit (Decimal, DateTime, String, dll).
- **Relation** well-defined (one-to-many, many-to-many).
- **Audit fields** implicit via Prisma (`createdAt`, `updatedAt`).

### Software Architect view
- **Prisma 4+** syntax.
- **UUID primary keys** per LOCKED principle #17.
- **Soft-delete** via `deletedAt: DateTime?` per principle #8.
- **`@map`, `@db` annotations** possible untuk cross-DB portability.

### QA view
- **89 models** = 89 entity test fixtures.
- **Type-safe** schema → TypeScript types generated automatically.
- **Migration tracking** via Prisma migrate.

---

## 🔴 Critical Findings

### CRIT-1: Schema count drift from documentation
- **schema.prisma**: **89 models** (verified)
- **01_DOMAIN_MODEL.md §1.1**: "70 Prisma models"
- **02_DATA_OWNERSHIP.yaml** comment: "78 entity catalog"
- **05_API_CONTRACT.yaml**: "89 entities, this spec covers ~78"

**Dampak**: 
- Documentation references stale.
- New developer akan bingung.

**Fix**: Update docs ke 89 models (sync).

---

## 🟠 Major Findings

### MAJ-1: Apakah setiap model punya `organizationId` (multi-tenant)?
LOCKED principle #10: "Multi-tenant ready — every entity has `organizationId` (UUID). Tenant isolation enforced at Prisma middleware."

**Verify**: `grep "organizationId" schema.prisma`

### MAJ-2: Apakah setiap model punya `deletedAt` (soft-delete)?
LOCKED principle #8: "Soft-delete only — never hard delete; every entity has `deletedAt: DateTime?`."

**Verify**: `grep "deletedAt" schema.prisma`

### MAJ-3: Apakah setiap model punya audit fields?
LOCKED principle #7: "Audit-first writes — every state change writes to audit log BEFORE ack to user."

Apakah schema punya `createdBy`, `updatedBy`, atau ada `AuditLog` entity ter-relate?

### MAJ-4: Apakah ada `legacyId` field untuk migration traceability?
LOCKED principle #17 (DEC-025): "Legacy IDs preserved in `legacyId` columns for traceability."

**Verify**: 89 models — berapa yang punya `legacyId`?

---

## 🟡 Minor Findings

### MIN-1: Index declarations — apakah explicit?
Prisma `@index`, `@@index` directives untuk performance critical queries?

### MIN-2: Composite unique constraints
Mis. `SalesInvoice(salesOrderId, code)` — explicit atau implicit?

### MIN-3: Cascade behavior
Apakah `onDelete: Cascade` atau `Restrict` per relation?

### MIN-4: Enum definitions
Apakah pakai Prisma enum atau String union?

### MIN-5: Decimal precision
`Decimal(18, 2)` per NFR §3 — verify semua money field pakai ini, bukan `Float`.

---

## 🔵 Nit / Polish

### NIT-1: Comment style — apakah ada header comment per model explaining purpose?

### NIT-2: Model ordering — apakah logical (dependency-first) atau alphabetical?

### NIT-3: Field ordering — required first atau alphabetical?

---

## 📋 Rekomendasi

| Item | Issue | Priority |
|------|-------|----------|
| Total | Sync docs to 89 | P0 |
| organizationId | Verify all models | P0 |
| deletedAt | Verify all models | P0 |
| Audit fields | Verify pattern | P1 |
| legacyId | Verify migration mapping | P1 |
| Index | Audit critical queries | P2 |
| Cascade | Document behavior | P2 |
| Enum | Standardize | P2 |
| Decimal | Verify money fields | P2 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-1
- See `01_DOMAIN_MODEL_REVIEW.md`, `02_DATA_OWNERSHIP_REVIEW.md`, `05_API_CONTRACT_REVIEW.md`
