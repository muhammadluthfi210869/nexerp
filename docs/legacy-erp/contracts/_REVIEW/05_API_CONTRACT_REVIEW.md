# Review: `05_API_CONTRACT.yaml`

> **Audit date**: 2026-09-16
> **File**: 6,496 lines, ~224KB
> **Status declared**: OpenAPI 3.0.3 spec
> **Verdict**: 🟢 **Comprehensive** — well-structured OpenAPI, beberapa gaps di coverage

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 6,496 | wc -l |
| Total API paths | **97** | regex match |
| HTTP operations | **297** (132 GET + 91 POST + 39 PATCH + 35 DELETE) | regex |
| OpenAPI tags | **16** declared | tags section |
| Servers | 3 (production, staging, local) | servers section |
| Security schemes | bearerAuth | security section |

---

## ✅ Strengths

### Business Analyst view
- **Status codes** lengkap (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 503).
- **Error envelope** standard: `{ error: { code, message, field?, details?, trace_id } }`.
- **Success envelope**: `{ data, meta: { page, limit, total, has_more, next_cursor } }` — cursor pagination ready.
- **Idempotency-Key** header support (24h TTL) per LOCKED principle #11.

### Software Architect view
- **OpenAPI 3.0.3** standard — bisa di-generate client SDK (NestJS SDK + NextJS types).
- **Bearer JWT + refresh cookie** — matches DEC-003.
- **Money = integer Rupiah** — IDR has no subunit, simpler than decimal.
- **ISO-8601 +07:00 (WIB)** — timezone-aware, no ambiguity.

### QA view
- **Standard error codes** — bisa di-mock dan assert.
- **Idempotency** — bisa di-test duplicate requests.
- **Pagination cursor** — test deep pagination.

---

## 🔴 Critical Findings

**None** untuk dokumen ini.

---

## 🟠 Major Findings

### MAJ-1: API Path Coverage vs Entity Count
- **API paths**: 97
- **Schema entities**: 89
- **Ratio**: ~1.1 paths per entity

Untuk ERP sekompleks ini, typical ratio 3-5 endpoints per entity (list, create, read, update, delete + actions). 97 paths untuk 89 entities sangat under-spec'd.

**Possible reasons**:
- Banyak entities share endpoints (e.g., `/sales/orders` covers SalesOrder, SalesOrderDetail, SalesOrderApproval).
- Phase 2 entities belum ada endpoints.

**Fix**:
1. Tabelkan mapping entity → API paths.
2. Identify entities tanpa endpoint (potential gap).
3. Identify entities dengan multi-action (cart, approval, batch — typical NEX pattern).

### MAJ-2: Tag names parsing menemukan 62 unique tags tapi hanya 16 declared
Regex capture mendapat 62 unique "name: X," patterns. 16 adalah OpenAPI tags (`auth, users, roles, master, sales, purchase, production, warehouse, finance, reports, checklists, rnd, communication, audit, dashboards, files`). 46 sisanya adalah **parameter names** (`role_id, is_active, q, module, category_id, ...`) yang ikut ter-capture sebagai tag.

**Implication**: Regex parser mistake, bukan bug di API spec. Tapi worth noting bahwa OpenAPI spec mungkin punya schema references yang look like tag definitions.

### MAJ-3: Authoritative source reference outdated
Line ~30: `Entity catalog: schema.prisma (**89 entities**, this spec covers ~78)`
Comment bilang "~78" — apakah API contract benar cover 78 entities? Kalau hanya 78 dari 89, mana yang missing?

**Fix**: 
1. Audit API paths vs entity list, identify 11 missing.
2. Either add endpoints atau update comment.

---

## 🟡 Minor Findings

### MIN-1: `security: [{ bearerAuth: [] }]` global — apakah ada endpoint public (login, refresh, health)?
Verify ada `security: []` override untuk login/refresh endpoints.

### MIN-2: Pagination default — apa `page` mode atau `cursor` mode?
Envelope punya `next_cursor`, tapi apakah `page/limit` optional atau deprecated? Mixed pagination confusing.

### MIN-3: Rate limiting — apakah ada `429` rate limit info per endpoint?
Standard practice: include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.

### MIN-4: Webhook/callback — tidak ada eksplisit
Apakah ada webhook endpoint untuk external integrations? Atau hanya outbound events via `08_INTEGRATION_EVENT_CONTRACT.yaml`?

### MIN-5: File upload — apakah ada `/files/presign` endpoint? Last path adalah `/files/presign`. Verify schema untuk file upload flow.

### MIN-6: Bulk operations — apakah ada batch endpoint?
Cart pattern (DEC-015) butuh atomic batch commit. Apakah ada endpoint untuk commit multi-line cart?

---

## 🔵 Nit / Polish

### NIT-1: Path naming inconsistency — apakah pakai `/sales/orders` (plural) atau `/sales/order` (singular)? Verify consistency.

### NIT-2: Beberapa path mungkin punya trailing slash — apakah normalized?

### NIT-3: OpenAPI examples per field — apakah ada example values untuk fields tertentu?

### NIT-4: Schema components — reusable via `$ref` atau inline? Best practice: reusable.

---

## 📋 Rekomendasi per Section

| Section | Issue | Priority |
|---------|-------|----------|
| paths | Coverage analysis vs entities | P1 |
| tags | Parameter name regex bug | P3 |
| Comment line 30 | "covers ~78" verify | P1 |
| security | Public endpoint override | P2 |
| Rate limit | Headers standard | P2 |
| Webhook | Document or remove | P2 |
| Bulk operations | Cart pattern endpoint | P2 |
| Components | Reusability audit | P3 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-1, X-12
- See `01_DOMAIN_MODEL_REVIEW.md`, `07_RBAC_MATRIX_REVIEW.md`, `08_INTEGRATION_EVENT_CONTRACT_REVIEW.md`
