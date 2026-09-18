# 09 — Non-Functional Contract (NFR)

> **Tipe**: Cross-cutting Contract (Global, applies to every implementation contract)
> **Versi**: 1.0 | **Tanggal**: 2026-09-16 | **Status**: **PROVISIONAL** — certification blockers remain in `../verification/`
> **Owner**: Tech Lead | **Reviewer**: Product Owner (Upii)
> **Sister docs**: `00_MASTER_SPEC.md`, `01_DOMAIN_MODEL.md`, `04_BUSINESS_RULES.md`, `07_RBAC_MATRIX.yaml`, `_SSOT_AUTH.md`, `_SSOT_COMMUNICATION.md`

Dokumen ini adalah pemilik kanonik constraint non-fungsional global untuk NEX ERP sesuai peta otoritas berbasis subjek di `00_MASTER_SPEC.md §9.1`. Konflik pada subjek lain diselesaikan oleh pemilik subjek tersebut, bukan melalui precedence file global.

**Apa yang ada di sini**: tech stack, locale, currency, date format, delete policy, audit, security, performance, observability, compliance.

**Apa yang TIDAK ada di sini**: business rules per entity (→ `04_BUSINESS_RULES.md`), workflow per module (→ `03_WORKFLOW_STATE_MACHINE.yaml`), permission per role (→ `07_RBAC_MATRIX.yaml`).

---

## 1. Tech Stack (LOCKED)

| Layer | Tech | Version | Rationale |
|-------|------|---------|-----------|
| Frontend | Next.js | 15+ (standalone output) | Per existing NEX build (`frontend/next.config.ts`) |
| Backend | NestJS | 10+ | Per existing NEX build (`backend/src/main.ts`) |
| ORM | Prisma | 5+ | Per existing NEX build (`backend/prisma/schema.prisma`) |
| DB | PostgreSQL | 15 | Per existing NEX build + Biznet NEO VPS compatibility |
| Cache / Session store | Redis | 7+ | Sessions (refresh-token blacklist) + rate-limit counters + cart (DEC-015) |
| Queue | BullMQ | 5+ | Async tasks: journal posting, email dispatch, PDF generation |
| File storage | S3-compatible (Supabase Storage) | — | Per `_SSOT_COMMUNICATION.md` for attachments |
| Auth | JWT (Access 15min + Refresh 30d rotation) | — | Per `_SSOT_AUTH.md` §1, DEC-003 |
| Styling | Tailwind CSS | 4+ | Per existing NEX build |
| UI components | NEX DNA via `@/components/dna` only | canonical barrel | shadcn/ui, Radix, lucide-react, and other primitives are implementation details usable directly only inside `frontend/src/components/dna/**` |
| Charts | Recharts | 3+ | Per existing NEX build (currently UNUSED in old ERP build) |
| Notifications | email + in-app | — | Per `_SSOT_COMMUNICATION.md`. No SMS for MVP (DEC-004) |
| Deploy | Docker + GitHub Actions + GHCR + VPS | — | Per `DEPLOY.md` |
| Monitoring | Sentry (backend + frontend) | — | Per §14 |
| Email provider | SMTP (configurable) | — | Per `.env` `SMTP_*` |

**Versions are floors, not ceilings** — newer minor/patch versions allowed if non-breaking. Major upgrades require new DEC entry.

---

## 2. Timezone & Locale

**Default**: `Asia/Jakarta` (WIB, UTC+7).

| Surface | Format | Example |
|---------|--------|---------|
| DB storage | `TIMESTAMP WITH TIME ZONE` (always UTC in storage) | `2026-09-16T07:30:00.000Z` |
| API response | ISO 8601 with timezone offset | `2026-09-16T14:30:00+07:00` |
| UI display (timestamp) | Indonesian format | `16-09-2026 14:30 WIB` |
| UI display (date only, numeric) | `DD-MM-YYYY` | `16-09-2026` |
| UI display (date only, long) | Indonesian locale | `16 September 2026` |
| UI display (date only, with day) | Indonesian locale | `Rabu, 16 September 2026` |
| Time | 24-hour, `HH:mm` | `14:30` |
| First day of week | **Senin** (Monday) | Indonesian convention |
| Weekend | Sabtu + Minggu | Saturday + Sunday |
| Calendar UI | Indonesian holiday calendar (libur nasional) | Include cuti bersama |
| Currency conversion (Phase 2) | Daily rate via external API | IDR ↔ USD |

**Implementation rule**: never use `new Date()` without explicit timezone in backend. Always serialize via `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta' })` for UI. Backend converts UTC → WIB for any "today" comparisons.

**DB rule**: every `DateTime` column is `TIMESTAMPTZ` (NOT `TIMESTAMP` without TZ). Audit trail uses `createdAt: DateTime @default(now())` server-side, never client-provided.

---

## 3. Currency & Money

**Default currency**: IDR (Indonesian Rupiah).

| Layer | Type | Example | Rationale |
|-------|------|---------|-----------|
| DB column | `DECIMAL(18, 2)` | `1500000.00` | Avoid float drift; 18 digits = up to Rp 999,999,999,999,999,999 (≈ Rp 1 quadrilion) |
| API request/response | `integer` (smallest unit = Rupiah) | `1500000` | IDR has no subunit (no sen), so 1 unit = Rp 1 |
| API legacy compat | `string` (for values > Number.MAX_SAFE_INTEGER, rare) | `"1500000"` | Only for very large reconciliation numbers |
| UI display | `Rp 1.500.000` (with `.` thousand sep, `,` decimal sep) | `Rp 1.500.000,00` | Indonesian convention |

**Formatting rules**:
- Thousand separator: `.` (period)
- Decimal separator: `,` (comma)
- Prefix: `Rp ` (with trailing space)
- `.00` decimals: **omitted** if zero (`Rp 1.500.000` not `Rp 1.500.000,00`)
- Negative values: parentheses preferred for accounting contexts: `(Rp 50.000)`. Minus sign acceptable: `-Rp 50.000`
- Zero: shown as `Rp 0` (NOT `-Rp 0`)
- Currency symbol position: prefix only (Indonesian: `Rp 1.500.000`)

**VAT (PPN)**:
- Default rate: **11%** (per UU HPP 2022)
- Configurable per `Tax Setup` (org-level setting)
- Rounding: half-up to nearest Rupiah

**Withholding tax (PPh)**:
- PPh 21: employee income tax (per `NEX_FINANCE_FINAL_SPEC.md`)
- PPh 23: service/vendor withholding
- PPh Final: specific transaction types (e.g., property rental)
- Separate calculation from PPN (see `_SSOT_FINANCE.md`)

**Multi-currency**: NOT in MVP. Feature flag `multiCurrencyEnabled` in `Tax Setup` reserved for Phase 2.

---

## 4. Number & Date Formats

### Number formats

| Context | Format | Example |
|---------|--------|---------|
| Decimal separator (UI) | `,` | `3,14` |
| Thousand separator (UI) | `.` | `1.500.000` |
| Percentage (UI) | `XX,X%` | `98,5%` |
| Percentage (API) | `number` (0-100, not 0-1) | `98.5` |
| Negative numbers (UI) | `(123)` or `-123` | `(Rp 50.000)` |
| Rounding | Half-up | `1.005 → 1.01` |

### Date formats

| Context | Format | Example |
|---------|--------|---------|
| DB storage (datetime) | `TIMESTAMPTZ` (UTC) | `2026-09-16T07:30:00.000Z` |
| DB storage (date only) | `DATE` | `2026-09-16` |
| API (datetime) | ISO 8601 string | `2026-09-16T14:30:00+07:00` |
| API (date only) | ISO 8601 string | `2026-09-16` |
| UI (numeric date) | `DD-MM-YYYY` | `16-09-2026` |
| UI (long date) | Indonesian | `16 September 2026` |
| UI (long with day) | Indonesian | `Rabu, 16 September 2026` |
| UI (month/year) | Indonesian | `September 2026` |
| UI (year only) | `YYYY` | `2026` |
| Time | `HH:mm` (24-hour) | `14:30` |

**Fiscal year**: Calendar year (Jan–Dec). Configurable per `Company Setting` (some industries use Apr–Mar). MVP: calendar year only.

---

## 5. Delete Policy (LOCKED)

**Soft delete** — never hard delete operational data.

| Rule | Detail |
|------|--------|
| Standard | Every entity has `deletedAt: DateTime?` field |
| Active record | `deletedAt IS NULL` (default) |
| Deleted record | `deletedAt IS NOT NULL` |
| Default query | Filter `where: { deletedAt: null }` (auto-applied by Prisma extension) |
| Admin view | "Show Deleted" toggle on list pages (audit-required access) |
| Recovery | Admin can `undelete` within **30 days** (set `deletedAt = null`) |
| After 30 days | Permanent archive → moved to `_archive` schema or cold storage |
| Hard delete | ONLY with explicit DBA intervention + change ticket |

**Exceptions** (these tables NEVER soft-delete):
- `audit_logs` — compliance (UU No. 28/2007, 5-year retention minimum)
- `activity_logs` — never purged
- `notifications` — never deleted (only `readAt` tracked)
- `sessions` — TTL cleanup of expired sessions (Redis `EXPIRE`)

**Implementation**: Prisma middleware enforces `where: { deletedAt: null }` on all `find*` and `update*` operations unless caller explicitly opts out with `{ includeDeleted: true }` (admin-only).

**Cascade rules**: when parent soft-deleted, children are NOT auto soft-deleted. They become "orphaned" — admin can re-assign or hard-delete separately.

---

## 6. Audit Logging (LOCKED)

**Every state change MUST write to audit log BEFORE returning success to user.**

### Table: `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | string | e.g., `SalesOrder`, `Customer` |
| `entity_id` | UUID | The affected entity |
| `action` | enum | `create`, `update`, `delete`, `status_change`, `approve`, `reject`, `payment`, `login`, `logout`, `permission_change` |
| `before_state` | JSONB | Snapshot before change (null for create) |
| `after_state` | JSONB | Snapshot after change (null for delete) |
| `changes` | JSONB | Diff (only changed fields) |
| `actor_id` | UUID | User who performed action |
| `actor_role_id` | UUID | Role at time of action (snapshot) |
| `ip_address` | INET | Source IP |
| `user_agent` | string | Browser/app identifier |
| `correlation_id` | UUID | Request trace ID (same across multi-step operations) |
| `created_at` | TIMESTAMPTZ | Server-side timestamp |

### Retention

| Tier | Duration | Storage | Query Path |
|------|----------|---------|------------|
| Hot | 1 year | Primary PostgreSQL | Default audit endpoints |
| Cold | 5 years | Separate `audit_archive` table or S3 archive | Dedicated `/audit/archive` endpoint (admin only) |
| Permanent | Never purge | Critical events: financial transactions, role changes, auth events, password reset | Always hot |

### What is LOGGED

- Create any entity
- Update any entity (with diff)
- Soft delete + hard delete (with admin override)
- Status transitions (with `before_status` + `after_status`)
- Approvals / rejections
- Payment events
- Auth events (per `_SSOT_AUTH.md` §8)
- Permission/role changes
- Bulk operations (single entry, with array of affected IDs)

### What is NOT logged

- Read operations
- Dashboard fetches
- Search queries
- Filter/sort/paginate
- UI navigation events

### Legacy parity

Legacy audit log columns (per `_crawl/auth/activity-log.html` line 1174-1180):
```
# | Waktu | Pengguna | Modul | Aksi | Deskripsi | IP Address
```

NEX mapping:
- Waktu → `created_at`
- Pengguna → `actor_id` (joined with `users.full_name` for display)
- Modul → `entity_type`
- Deskripsi → `changes` (diff JSON, human-readable in UI)
- Aksi → `action` enum
- IP Address → `ip_address`

---

## 7. Authentication & Session

Per `_SSOT_AUTH.md` (LOCKED).

| Rule | Value |
|------|-------|
| Auth strategy | JWT Access Token + Refresh Token rotation |
| Access token expiry | **15 minutes** |
| Access token storage | Client memory (zustand/context) + cookie `token` (HttpOnly, Secure, SameSite=Strict) — fallback for `<img>` attachment |
| Refresh token expiry | **30 days** |
| Refresh token storage | HttpOnly cookie `refresh` (separate from access) |
| Refresh rotation | Every refresh issues new pair + blacklists old (1-time use) |
| Cookie `Secure` flag | Production only (HTTP allowed in dev) |
| Cookie `SameSite` | `Strict` |
| Cookie `HttpOnly` | Yes (both `token` and `refresh`) |
| CSRF | Required on all POST/PUT/PATCH/DELETE (double-submit cookie or custom header) |
| MFA | Optional, admin-enrollable (TOTP via Google Authenticator / Authy) |
| Password policy | Min 10 chars, 1 upper + 1 lower + 1 digit + 1 symbol, 90-day expiry, history 5 (no reuse) |
| Password hashing | bcrypt cost 12 |
| Failed login lockout | 5 attempts → 15 min lockout |
| First login force reset | Yes (new users + migrated users) |
| Admin force reset | User must change on next login |
| Session idle timeout | 30 minutes (configurable per role) |
| Concurrent sessions | Allowed (admin can view + revoke per session via `/auth/sessions`) |
| Cross-device logout | `POST /auth/logout-all` (own devices) + `POST /admin/users/:id/logout-all` (admin) |

**reCAPTCHA**:
- Fresh key pair generated for `nexerp.id` domain (DEC-021, DEC-026)
- Site key stored in `.env` (`RECAPTCHA_SITE_KEY`) — safe to be public
- Secret key stored server-side only (`RECAPTCHA_SECRET_KEY`)
- Applied on login + forgot-password + public signup (Phase 2)

---

## 8. Authorization (RBAC)

Per `_SSOT_AUTH.md` §4 and `07_RBAC_MATRIX.yaml`.

| Rule | Detail |
|------|--------|
| Role count | 16+ roles (per legacy `kil.gserp.id`) + future NEX additions |
| Permission types | `read`, `create`, `update`, `delete`, `approve`, `export`, `import` |
| Per-role matrix | Defined in `07_RBAC_MATRIX.yaml` (machine-readable) |
| Field-level perms | Supported (e.g., BusDev can only edit own records) |
| Data scope | Supported (per warehouse, per division, per owner) |
| Permission check | Backend (NestJS Guards) — mandatory + Frontend (UI hide/show) — cosmetic only |
| Permission cache | Redis, 5-min TTL, invalidated on role change |
| Default deny | Yes — if no permission, default `403 FORBIDDEN` |

**Legacy role preservation**: kebab-case permission slugs preserved verbatim (DEC-024). 55 sub-module + 22 dashboard widget = 77 unique permissions (DEC-026).

**Role hierarchy** (per `_SSOT_AUTH.md` §4.1):
- Super Admin → all permissions
- Admin → all except role management
- Per-division (HR, SCM, Warehouse, BusDev, R&D, Production, Finance, Marketing, Legality) Admin/Staff/Manager tiers
- Cross-cutting: Executive (read-only), Auditor (read-only + audit log access)

---

## 9. API Constraints

### Base URL

```
Production:  https://nexerp.id/api/v1/
Staging:     https://staging.nexerp.id/api/v1/
Dev:         http://localhost:4000/api/v1/
```

### Format & Versioning

- **REST + JSON** (no XML, no SOAP)
- **Versioning**: URL path (`/v1/`, `/v2/`) — breaking changes require new version
- **Content-Type**: `application/json; charset=utf-8`
- **Character encoding**: UTF-8

### Request Conventions

| Aspect | Convention | Example |
|--------|------------|---------|
| HTTP methods | GET (read), POST (create), PUT/PATCH (update), DELETE (delete) | `GET /sales-orders` |
| Plural nouns | Resource names in plural | `/sales-orders`, `/customers` |
| Sub-resources | Nested path for owned resources | `/sales-orders/:id/lines` |
| Filter | `filter[field]=value` | `filter[status]=active` |
| Operators | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `like`, `between` | `filter[createdAt][gte]=2026-09-01` |
| Search | `q=keyword` (full-text) | `q=soap` |
| Sort | `sort=field:asc,field2:desc` | `sort=createdAt:desc,name:asc` |
| Pagination | Cursor (preferred) + page (fallback) | `?cursor=abc&limit=20` or `?page=1&limit=20` |
| Max `limit` | 100 (per page) | |
| Field selection | `fields=a,b,c` (sparse fieldsets) | |
| Include relations | `include=lines,customer` | |

### Response Envelope (Success)

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "has_more": true,
    "next_cursor": "abc123"
  }
}
```

### Response Envelope (Error)

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid email format",
    "field": "email",
    "details": {
      "expected": "valid email address",
      "received": "not-an-email"
    },
    "trace_id": "01J8Z3Y4E5X7K8"
  }
}
```

### HTTP Codes (canonical set)

| Code | Use |
|------|-----|
| 200 | OK (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE success) |
| 400 | Bad Request (malformed JSON, missing required) |
| 401 | Unauthorized (no/invalid/expired token) |
| 403 | Forbidden (authenticated but lacks permission) |
| 404 | Not Found (resource doesn't exist or soft-deleted) |
| 409 | Conflict (duplicate email, unique constraint) |
| 422 | Unprocessable Entity (business rule violation) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (maintenance, DB down) |

### Rate Limiting

| Scope | Limit |
|-------|-------|
| Per authenticated user | **100 requests/minute** (configurable per role) |
| Per IP (unauthenticated) | **30 requests/minute** |
| Per login endpoint | 5 attempts / 15 min / IP |
| Per password reset | 3 attempts / hour / email |

### Idempotency Keys

Supported on `POST`, `PUT`, `DELETE`. Client sends `Idempotency-Key: <UUID>` header. Server caches response for **24 hours**. Replay with same key returns cached response.

### Pagination Detail

- Default: `limit=20`, max `limit=100`
- Cursor: opaque server-generated string (base64-encoded `{createdAt,id}`)
- Page-based fallback for backwards compat: `?page=2&limit=50`
- `meta.has_more=true` indicates more pages

---

## 10. File Upload

| Rule | Value |
|------|-------|
| Max file size | **10 MB** per file (configurable per type) |
| Allowed types | `jpg`, `jpeg`, `png`, `gif`, `webp`, `pdf`, `xlsx`, `xls`, `csv`, `docx` |
| Rejected types | `exe`, `bat`, `sh`, `php`, `js`, `html`, `htm`, `svg` (XSS risk) |
| Storage backend | S3-compatible (Supabase Storage) |
| Access pattern | Presigned URLs (15 min expiry for downloads) |
| Path convention | `{org_id}/{entity_type}/{entity_id}/{uuid}-{filename}` |
| Virus scan | Required for `pdf`, `xlsx`, `xls`, `docx` (Phase 2) — integrate ClamAV or cloud scanner |
| CDN | Static assets served via CDN with 1-year cache for images |
| Upload method | Direct-to-S3 with presigned PUT URL (avoid backend bottleneck) |
| Audit | Every upload logs to `audit_logs` |

**Implementation sketch**:
```
POST /api/v1/files/presign { filename, contentType, entityType, entityId }
  → Server validates user permission + entity access
  → Returns { uploadUrl, fileId, publicUrl }

Client → PUT <uploadUrl> (direct to S3)
Client → POST /api/v1/files/:id/confirm { entityType, entityId }
  → Server marks file ready, writes audit log
```

---

## 11. Browser Support

| Browser | Minimum | Notes |
|---------|---------|-------|
| Chrome | 100+ | Primary target |
| Edge | 100+ | Chromium-based |
| Firefox | 100+ | |
| Safari | 15+ | macOS + iOS |
| Mobile Safari | iOS 15+ | |
| Chrome Android | Latest 2 | |

**NOT supported**: IE 11, old Edge (non-Chromium), Opera Mini.

| Aspect | Spec |
|--------|------|
| JS version | ES2022 (async/await, optional chaining `?.`, nullish coalescing `??`, top-level await) |
| CSS | Tailwind CSS 4+ (per existing build) |
| Viewport | Min 360px wide (responsive web only — no native app MVP) |
| Touch targets | Min 44×44 px (Apple HIG / WCAG) |
| Accessibility | WCAG 2.1 AA target |

---

## 11A. Visual DNA UI Composition (LOCKED)

### Canonical references

- Visual specification: **`/visual-dna`**
- Golden implementation/reference: **`/visual-dna/golden-reference`**
- Canonical component source: `frontend/src/components/dna/**`
- Only public application import surface: `@/components/dna`
- Detailed certification rules: `verification/_UI_DNA_COMPLIANCE_STANDARD.md`

Existing `/dna-visual`, `/dna-visual/golden-reference`, `/master/dna-visual`, or `/master/dna-visual/golden-reference` paths are compatibility aliases only. They must redirect to the canonical routes, must not render divergent implementations, and require a controlled removal condition.

### Mandatory composition rule

Every canonical or approved-extension application UI MUST compose its visual and interactive primitives from exports of `@/components/dna`. Application pages and domain components MUST NOT directly import:

- `@/components/ui/**`;
- `@radix-ui/**`, shadcn implementation modules, or another UI kit;
- a DNA implementation subpath such as `@/components/dna/DnaButton`;
- icon or visualization primitives to create a competing design primitive;
- duplicated local button, input, select, table, modal, dialog, drawer, tab, badge, card, pagination, tooltip, toast, form control, feedback state, or page shell.

Raw semantic containers and text elements (`main`, `section`, `div`, `article`, `header`, `footer`, `nav`, `p`, `span`, headings, lists) are allowed only for document structure and content. Raw interactive controls (`button`, `input`, `select`, `textarea`, interactive table patterns, dialog/modal controls) are forbidden outside `frontend/src/components/dna/**`. Domain-specific components are allowed only when they compose DNA exports and do not recreate a DNA primitive.

### No hardcoded visual values

Outside DNA implementation and its governed reference fixtures, application UI MUST NOT contain:

- literal HEX/RGB/HSL colors or raw brand colors;
- arbitrary Tailwind values such as `text-[...]`, `bg-[#...]`, `rounded-[...]`, `shadow-[...]`, or spacing/size literals used as visual tokens;
- inline `style={{...}}` visual styling;
- locally invented spacing, radius, typography, shadow, z-index, status color, breakpoint, or animation constants;
- copied markup/CSS from the golden reference instead of importing the corresponding DNA component.

Operational pages may use the approved structural layout allowlist defined in `verification/_UI_DNA_COMPLIANCE_STANDARD.md`. Data-driven geometry required by charts/canvas may use a reviewed exception, but controls, containers, typography, colors, legends, empty/error/loading states, and accessibility behavior remain DNA-owned.

### Golden-reference integrity

`/visual-dna/golden-reference` MUST render the real public exports from `@/components/dna`. It is forbidden for the golden reference to imitate components using separate raw HTML/Tailwind markup. A component is not certified merely because it visually resembles the reference; its operational consumers must import the certified DNA export.

### Enforcement and exceptions

DNA compliance is a blocking CI and release gate. Static AST/import scans, hardcoded-value scans, component inventory/barrel validation, route-to-screen coverage, visual regression, accessibility, responsive/browser tests, and exception-registry validation MUST all pass.

Exceptions are allowed only when no DNA capability can technically represent the requirement. The exception must be registered, narrow, owned, tested, time-bounded, and include a plan to extend DNA. No exception may permit a duplicate primitive, hardcoded brand token, accessibility regression, or bypass of the canonical import boundary.

Any missing primitive is implemented and certified in `frontend/src/components/dna/**` first, exported from `@/components/dna`, demonstrated by both canonical reference routes, and only then consumed by a business screen.

---

## 12. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | 3G connection, cold cache |
| Time to Interactive (TTI) | < 3.5s | 3G connection |
| Largest Contentful Paint (LCP) | < 2.5s | Core Web Vitals |
| Cumulative Layout Shift (CLS) | < 0.1 | Core Web Vitals |
| First Input Delay (FID) | < 100ms | Core Web Vitals |
| API response (p95) | < 200ms | List endpoints |
| API response (p95) | < 500ms | Reports / aggregations |
| DB query (p95) | < 100ms | OLTP (CRUD) queries |
| DB query (p95) | < 1s | Reports / aggregations |
| Concurrent users (Phase 1) | 100 simultaneous | Load test |
| Concurrent users (Phase 2) | 500+ simultaneous | Load test |
| Frontend bundle (initial) | < 500 KB | gzipped |
| Frontend bundle (total) | < 2 MB | lazy-loaded chunks |

**Measurement tools**: Lighthouse (frontend), k6 (API load test), Sentry (real user monitoring).

**Targets are floors, not goals** — page that misses FCP is a P1 bug.

---

## 13. Security

### Transport & Headers

| Control | Value |
|---------|-------|
| HTTPS only | Production (HTTP allowed only in dev mode with banner) |
| HSTS | `max-age=31536000; includeSubDomains; preload` (1 year) |
| CSP | Strict — `default-src 'self'`, no `unsafe-inline` |
| CORS allowlist | `https://nexerp.id` (production), `https://staging.nexerp.id`, `http://localhost:3000` (dev) |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |

### Rate Limit & DDoS

- 100 req/min per authenticated user (per §9)
- 30 req/min per IP (unauthenticated)
- Cloudflare or equivalent in front of VPS for DDoS (Phase 2)

### Secrets

- **NEVER in code** — all secrets from `.env` (dev) or secrets manager (prod: GitHub Secrets / Doppler)
- `.env` in `.gitignore` always
- `.env.example` checked in (placeholders only)
- Secrets rotated quarterly (DB passwords, JWT signing keys)

### Encryption

| Layer | Method |
|-------|--------|
| In transit | TLS 1.3 (no TLS 1.0/1.1) |
| At rest (DB) | PostgreSQL TDE (Transparent Data Encryption) |
| At rest (backups) | AES-256 |
| Column-level PII (Phase 2) | NIK, address, phone encrypted at column level |
| JWT signing | HS256 with 256-bit secret (RS256 for Phase 2 multi-service) |
| Password | bcrypt cost 12 |
| Refresh tokens | Random 256-bit, stored hashed (SHA-256) |

### Backup & DR

| Tier | Frequency | Retention |
|------|-----------|-----------|
| Daily incremental | Daily `pg_dump` (logical) | 30 days |
| Weekly full | Sunday full backup | 12 weeks |
| Monthly archive | First of month | 5 years (financial compliance) |
| RPO (Recovery Point Objective) | 24 hours | (acceptable loss) |
| RTO (Recovery Time Objective) | 4 hours | (acceptable downtime) |

Backup storage: separate physical host, encrypted at rest.

---

## 14. Logging & Observability

### Application Logs

| Aspect | Detail |
|--------|--------|
| Format | Structured JSON |
| Levels | `debug`, `info`, `warn`, `error`, `fatal` |
| Production level | `info` (debug gated by `LOG_LEVEL=debug`) |
| Sink | Sentry + local stdout (for `docker logs`) |
| Required fields | `timestamp`, `level`, `message`, `trace_id`, `actor_id`, `request_path`, `request_method`, `response_status`, `duration_ms` |
| PII scrubbing | Auto-redact: `email`, `phone`, `nik`, `password`, `token`, `cookie`, `authorization` header |

### Error Tracking (Sentry)

- Backend: NestJS `SentryModule` (auto-capture exceptions)
- Frontend: `@sentry/nextjs` (browser + server)
- Release tagging: per `git SHA` (auto via CI/CD)
- Source maps: uploaded to Sentry (NOT public)
- Sample rate: 100% errors, 10% transactions (adjustable)

### Performance Monitoring

- Frontend: Sentry Performance (web vitals + route timings)
- Backend: Sentry Performance (API timings)
- DB: PostgreSQL slow query log + `pg_stat_statements`
- Queue: BullMQ dashboard (per-worker stats)

### Audit Trail

- See §6 — every state change to `audit_logs`

### Log Retention

| Tier | Duration |
|------|----------|
| Hot (queryable) | 90 days |
| Cold (S3 archive) | 1 year |
| Compliance (financial) | 5 years (per UU 28/2007) |

---

## 15. Internationalization (i18n)

| Aspect | Value |
|--------|-------|
| MVP locale | Indonesian only (`id-ID`) |
| Phase 2 | English (`en-US`) |
| Default locale | `id-ID` |
| Translation files | `frontend/src/locales/id.json`, `frontend/src/locales/en.json` |
| Translation function | `t('key')` (react-i18next or next-int) |
| Hard-coded strings | **NEVER** — every user-facing string goes through translation |
| Date/number/currency | Locale-aware via `Intl.DateTimeFormat`, `Intl.NumberFormat` |
| RTL support | Not in MVP (Indonesian + English only) |
| Currency display | Per §3 (always IDR for MVP) |

**Implementation rule**: any new UI string MUST be added to both `id.json` and `en.json` (even if `en` is not yet shipped). Keys use kebab-case nested namespaces: `sales.invoice.title`.

---

## 16. Testing Requirements

| Type | Coverage | Tool |
|------|----------|------|
| Unit tests | **70% minimum** for business logic (`04_BUSINESS_RULES.md`, `03_WORKFLOW_STATE_MACHINE.yaml`) | Jest (backend), Vitest (frontend) |
| Integration tests | Every API endpoint in `05_API_CONTRACT.yaml` — happy path + 1 error case | Supertest (backend) |
| E2E tests | Per `_SSOT_COMMUNICATION.md` document transfer flow + per 03 critical state transition | Playwright |
| Performance tests | Critical APIs (auth, list endpoints) must meet §12 targets | k6 |
| Security tests | OWASP Top 10 baseline for auth + API | OWASP ZAP, manual pentest |
| DNA compliance | 100% canonical and approved-extension screens; zero unregistered import/native-interactive/hardcoded-token violations | AST/import scanner + DNA token scanner + Playwright |

**Coverage gate**: PR cannot merge if unit test coverage drops below 70% for `src/services/**` or `src/business-rules/**`.

**Test naming**: `*.spec.ts` (unit), `*.e2e.ts` (integration), `*.test.ts` (Playwright).

---

## 17. CI/CD

| Stage | Rule |
|-------|------|
| Branching | Trunk-based with feature branches (max 2 days lifetime) |
| Branch naming | `feat/<scope>-<short-desc>`, `fix/<scope>-<short-desc>`, `chore/<scope>` |
| PR requirements | Lint passes + type-check passes + tests pass + 1 approval (AI CLI allowed for solo dev) |
| UI PR requirements | DNA import-boundary, native-interactive, hardcoded-token, barrel/reference integrity, visual, and accessibility checks are blocking |
| Merge strategy | Squash merge + auto-delete branch |
| Deploy trigger | Automatic on `main` merge → GHCR image → VPS via `deploy.sh` |
| Rollback | `rollback.sh <image-tag>` (per-image-tag rollback) |
| DB migrations | `prisma migrate deploy` only; `prisma db push` and `--accept-data-loss` forbidden in production/CI/init |
| Secrets | GitHub Secrets for CI; Doppler/Vault for production runtime |
| Pre-commit | Husky + lint-staged (ESLint + Prettier) |

**Branch protection on `main`**: require PR, require status checks (lint, type-check, tests), no direct push.

### 17.1 Database Migration & Evolution Policy (LOCKED)

Per Phase P04 Canonical Database and Migration Contract:
- **Migration Authority**: The canonical database schema is governed strictly via Prisma migrations located in `backend/prisma/migrations/`. Schema changes must be recorded as monotonic, deterministic migrations deployed via `prisma migrate deploy`.
- **Forbidden Operations**: `prisma db push`, `--accept-data-loss`, `prisma migrate resolve` to hide failures, and uncontrolled raw DDL synchronization are strictly forbidden in production, staging, CI, container boot scripts, and certification suites.
- **Upgrade Baseline**: The canonical upgrade baseline is the complete migration state materialized from the frozen P03 phase-base commit (`cf8b725d9fec4c808937c50217a3bc45050d271a`). Candidate migrations apply strictly on top of this immutable baseline.
- **Migration Immutability**: All migration files present at the phase-base commit are immutable. Any database repair or structural change must be introduced via a new forward migration, never by modifying existing migration SQL.
- **Expand/Migrate/Contract Policy**: Schema evolution follows the expand -> migrate/backfill -> contract pattern:
  1. *Expand*: Add new tables, nullable columns, or columns with safe defaults. Destructive operations (`DROP TABLE`, `DROP COLUMN`, type narrowing, removing enum values, non-null without default) are strictly rejected.
  2. *Migrate/Backfill*: Deterministic backfills populate new fields without data loss or row corruption. Backfill operations must be idempotent and reconcilable.
  3. *Contract*: Retirement of obsolete columns/tables occurs only after N-1 application instances are decommissioned in a subsequent deployment window.
- **Rolling Deployment Compatibility**: Dual-read/write compatibility between version N-1 and version N is guaranteed across a minimum of one rolling deployment window. Every schema modification must support concurrent queries from both N-1 and N application runtimes.


---

## 18. Compliance & Regulation

### Indonesian ERP Compliance

| Regulation | Scope |
|------------|-------|
| PPN 11% | Configurable per `Tax Setup` (org-level) |
| PPh 21 / 23 / Final | Separate calculations per `NEX_FINANCE_FINAL_SPEC.md` |
| BPOM (cosmetics) | Document expiry tracking, registration timeline |
| Halal certification | Phase 2 (per `NEX_ERP_MASTER_SPECIFICATION.md` MOD-09) |
| UU No. 28/2007 | 5-year audit retention for financial transactions |
| UU PDP (No. 27/2022) | Personal data protection: consent, access, deletion on request |

### Data Residency

- **Indonesia only** — primary DB + backups on Indonesian VPS (Biznet NEO per master spec)
- No cross-border transfer of financial data without explicit user consent
- PII data residency: same region

### UU PDP Compliance (basic)

| Right | Implementation |
|-------|----------------|
| Right to access | User can request data export (per user role) |
| Right to deletion | Soft delete, then permanent after 30 days (Phase 2: scheduled job) |
| Right to correction | Profile edit (limited fields per role) |
| Consent | First-login consent dialog (track consent timestamp in audit_logs) |
| Breach notification | Process (not yet implemented — Phase 2) |

---

## 19. Error Codes (Standard Set)

Every error response MUST use one of these codes. Custom codes allowed with `CUSTOM_*` prefix and registration in `05_API_CONTRACT.yaml`.

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_FAILED` | 400 | Input validation failed (field-level errors) |
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `TOKEN_EXPIRED` | 401 | JWT expired, refresh needed |
| `TOKEN_INVALID` | 401 | JWT malformed/invalid |
| `MFA_REQUIRED` | 401 | MFA code needed |
| `SESSION_REVOKED` | 401 | Session forcibly revoked |
| `FORBIDDEN` | 403 | Authenticated but lacks permission |
| `NOT_FOUND` | 404 | Resource not found (or soft-deleted) |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported on this endpoint |
| `CONFLICT` | 409 | Resource conflict (e.g. duplicate email) |
| `UNPROCESSABLE_ENTITY` | 422 | Business rule violation |
| `INVALID_STATE_TRANSITION` | 422 | Workflow state machine violation (per `03_WORKFLOW_STATE_MACHINE.yaml`) |
| `PASSWORD_POLICY_VIOLATION` | 422 | Password doesn't meet policy |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary outage (DB down, deploy in progress) |
| `MAINTENANCE_MODE` | 503 | Scheduled maintenance |

**Frontend handling**: switch on `error.code` (not HTTP status), localize message via `t('errors.{code}')`.

---

## 20. References

This NFR contract governs and is referenced by every other implementation contract:

| Doc | Section | Relationship |
|-----|---------|--------------|
| `00_MASTER_SPEC.md` | overall scope | NFR defines global constraints applied here |
| `01_DOMAIN_MODEL.md` | entity constraints | All entities inherit soft-delete + audit + RBAC |
| `04_BUSINESS_RULES.md` | validations | All validations follow §9 API format |
| `07_RBAC_MATRIX.yaml` | permission boundaries | Inherits §8 RBAC structure |
| `_SSOT_AUTH.md` | auth details | LOCKED, governs §7 here |
| `_SSOT_COMMUNICATION.md` | notification channels | Inherits §14 logging |
| `03_WORKFLOW_STATE_MACHINE.yaml` | state transitions | Audit logs every transition (§6) |
| `05_API_CONTRACT.yaml` | endpoints | Conforms to §9 + §19 |
| `NEX_FINANCE_FINAL_SPEC.md` | finance | Inherits §3 currency + §18 compliance |
| `KPI_REFERENCE.md` | KPI definitions | Targets aligned with §12 performance |
| `_PROCESS_DECISIONS_LOG.md` | decisions | New NFR-affecting decisions logged here |

**Authority:** `00_MASTER_SPEC.md §9.1` is the only global authority map. This document owns system-wide technical constraints only. Evidence conflicts that cannot be resolved without choosing business behavior must be recorded as `DECISION_REQUIRED`.

---

## Appendix A — Implementation Examples

### Date/Time Helpers (backend)

```typescript
// backend/src/common/utils/date.util.ts
import { formatInTimeZone } from 'date-fns-tz';

export const WIB = 'Asia/Jakarta';

export function nowUtc(): Date {
  return new Date(); // always UTC in DB
}

export function toWibDisplay(utc: Date): string {
  return formatInTimeZone(utc, WIB, 'dd-MM-yyyy HH:mm zzz');
}

export function toIsoApi(utc: Date): string {
  return formatInTimeZone(utc, WIB, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
```

### Currency Formatter (frontend)

```typescript
// frontend/src/lib/format.ts
const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  return IDR.format(amount); // "Rp 1.500.000"
}

export function formatRupiahDecimal(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(amount); // "Rp 1.500.000,00"
}
```

### Soft-Delete Prisma Middleware

```typescript
// backend/src/prisma/middleware/soft-delete.middleware.ts
prisma.$use(async (params, next) => {
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  if (params.action === 'findMany') {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }
  return next(params);
});
```

### Audit Log Service

```typescript
// backend/src/audit/audit.service.ts
async log(entry: {
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'approve' | 'reject';
  before?: any;
  after?: any;
  actorId: string;
  actorRoleId: string;
  ip: string;
  userAgent: string;
  correlationId: string;
}): Promise<void> {
  const changes = diff(entry.before ?? {}, entry.after ?? {});
  await this.prisma.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      beforeState: entry.before,
      afterState: entry.after,
      changes,
      actorId: entry.actorId,
      actorRoleId: entry.actorRoleId,
      ipAddress: entry.ip,
      userAgent: entry.userAgent,
      correlationId: entry.correlationId,
    },
  });
}
```

---

## Appendix B — Compliance Checklist (per release)

Before each release, verify:

- [ ] All entities have `deletedAt` field + Prisma middleware active
- [ ] All state changes write to `audit_logs` BEFORE returning success
- [ ] All monetary fields use `DECIMAL(18,2)` in DB, integer in API
- [ ] All timestamps in DB are `TIMESTAMPTZ`
- [ ] All API responses use envelope format (§9)
- [ ] All errors use canonical codes (§19)
- [ ] All file uploads validated for type + size
- [ ] All inputs validated server-side (never trust client)
- [ ] HTTPS-only in production (HSTS header)
- [ ] CORS allowlist configured
- [ ] Rate limiting enabled
- [ ] Secrets loaded from env (never in code)
- [ ] Unit test coverage ≥ 70% for business logic
- [ ] Integration tests for all API endpoints
- [ ] Lighthouse score ≥ 90 for performance + accessibility
- [ ] Every application screen imports UI primitives only from `@/components/dna`
- [ ] No direct DNA subpath, `@/components/ui`, Radix/shadcn, raw interactive control, or unregistered hardcoded visual value exists outside DNA implementation
- [ ] `/visual-dna` and `/visual-dna/golden-reference` resolve, use real DNA exports, and pass visual/accessibility regression
- [ ] DNA screen coverage and exception registry validate at 100%; every exception has owner, rationale, expiry, test, and DNA-extension plan
- [ ] Sentry configured + DSN in env

---

**Dokumen ini LOCKED per 2026-09-16. Perubahan memerlukan DEC entry baru di `_PROCESS_DECISIONS_LOG.md` dan update ke dokumen ini dengan versioning.**
