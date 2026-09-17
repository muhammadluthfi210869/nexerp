# SSOT — Authentication & Authorization Spec

> Sub-dokumen dari `_SSOT_FINAL.md` (Single Source of Truth utama).
> Versi: 1.0 | Tanggal: 2026-09-16 | Status: **LOCKED** (siap implement)

---

## 1. Ringkasan Keputusan

| Item | Keputusan | Rationale |
|------|-----------|-----------|
| **Auth strategy** | **JWT (Access Token) + Refresh Token rotation**, long-lived session | User minta "long lived" — production factory staff butuh session yang gak mudah logout |
| **Storage** | Access token di memory + cookie `token` (HttpOnly, Secure, SameSite=Strict). Refresh token di HttpOnly cookie terpisah | Existing `backend/src/modules/auth/jwt.strategy.ts` udah pakai pattern ini |
| **Migration source** | Tarik semua data auth dari legacy `/user-manage`, `/role-manage`, `/account`, `/activity-log` di Phase 6 (migration prep) | Bukti ada permintaan user di 2026-09-16 |
| **MFA** | **Optional, admin-enrollable** (TOTP Google Authenticator / Authy). Default OFF | Bisa di-enable per-user oleh admin |
| **Password policy** | **Legacy UI**: 8-20 char, must include upper/lower/digit + 1 of `@#$%&`. **NEX**: min 10 char, broader charset, expire 90 hari, history 5 (no reuse) | User feedback: stronger than legacy; legacy too permissive |

---

## 2. Authentication Flow

### 2.1. Login

```
[Client] → POST /api/v1/auth/login { email, password }
        → Server validate
        → If OK: generate (access_token, refresh_token)
        → Set-Cookie: token=access_token (HttpOnly, 15min), refresh=refresh_token (HttpOnly, 30 days, Secure)
        → Return { user_profile, role, permissions }

[Client] → For each request: Bearer <access_token> OR cookie token
[Server → Server] Validate JWT signature, expiry, blacklist
```

### 2.2. Token Lifecycle

| Token | Expiry | Refresh | Storage |
|-------|--------|---------|---------|
| **Access token** | 15 minutes | Auto-refresh via refresh token | Client memory (zustand/context) + cookie fallback for `<img>` |
| **Refresh token** | 30 days | Rotation: setiap refresh → issue new + blacklist old | HttpOnly cookie `refresh` |

**Rotation rule**: setiap kali access token mau expired (15 min), client silently POST `/api/v1/auth/refresh` dengan refresh token. Server validates + issues new pair + blacklists old refresh token (1-time use).

### 2.3. Logout

```
POST /api/v1/auth/logout
  → Server blacklists both tokens in Redis
  → Clear HttpOnly cookies
  → Return 204

If access token still valid → already blacklisted in Redis, all subsequent requests 401
If refresh token still valid → already blacklisted, cannot issue new
```

### 2.4. Password Reset

```
1. User klik "Lupa Password" di /login
2. POST /api/v1/auth/forgot-password { email }
   → Server kirim email dengan token (1-hour expiry, one-time use)
   → Return 200 (always — even if email not found, no enumeration)
3. User klik link di email → /reset-password?token=XXX
4. POST /api/v1/auth/reset-password { token, new_password, new_password_confirm }
   → Server validate token, hash new password (bcrypt cost 12), update DB
   → Invalidate ALL refresh tokens for this user (force re-login on all devices)
   → Audit log entry
```

---

## 3. Password Policy

### 3.1. NEX Password Policy (LOCKED)

| Rule | Value |
|------|-------|
| Minimum length | **10 characters** (legacy was 8, we go stricter) |
| Composition | Min 1 upper, 1 lower, 1 digit, 1 symbol (any printable symbol) |
| Expiry | 90 days (warning at 7 days before) |
| History | Last 5 passwords cannot be reused |
| Hashing | **bcrypt (cost factor 12)** |
| Failed attempt lockout | 5 attempts → lock 15 min, then reset |
| First login for new user | Must change password immediately (force) |
| Reset by admin | User must change on next login |

### 3.2. Legacy Password Policy (from `/user-manage/create` JS validator)

```javascript
/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%&])(.{8,20}$)/
```

- Min 8, max 20 chars
- Must include upper + lower + digit + 1 of `@#$%&`
- **Limited charset** for symbols (only 6 chars)

**Migration note**: NEX policy is stricter. Migrated users can keep their legacy passwords IF they meet NEX policy (10+ chars). Otherwise, force reset on first login.

**Configurable per role**: HR Admin can set stricter policy per division.

---

## 4. Role-Based Access Control (RBAC)

### 4.1. Role Inheritance (from legacy + enhancement)

Legacy (`/role-manage`) has 16 fixed roles. NEX will **expand** to support:

```
Role Tree:
├── Super Admin (all)
├── Admin (all except role management)
├── Per-Division Roles:
│   ├── HR Admin / HR Staff
│   ├── Purchasing (SCM) Admin / Staff
│   ├── Warehouse Admin / Staff
│   ├── BusDev Admin / Staff / Manager
│   ├── RnD Admin / Chemist / Manager
│   ├── Production Admin / Operator (per stage: Mixing/Filling/Packaging)
│   ├── Finance Admin / Staff / Manager
│   ├── Digital Marketing Admin / Staff
│   └── Legalitas Admin / Staff
└── Cross-cutting:
    ├── Executive (read-only all)
    └── Auditor (read-only all + audit log access)
```

### 4.2. Permission Granularity

Each role has permission matrix:

```typescript
interface RolePermission {
  module: string;           // e.g., 'sales', 'purchase', 'production'
  actions: Permission[];     // ['read', 'create', 'update', 'delete', 'approve']
  filters?: Record<string, any>; // e.g., { division_id: 'self' } for staff scoping
  field_level?: string[];    // optional field-level restrictions
}

type Permission = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'import';
```

**Example**:
- Production Operator (Mixing): `{ module: 'production', actions: ['read', 'update'], filters: { stage: 'mixing' } }`
- BusDev Staff: `{ module: 'sales', actions: ['read', 'create', 'update'], filters: { owner_id: 'self' } }`

### 4.3. Role Migration from Legacy

Plan: extract all 16 roles + permissions from `/role-manage` in Phase 6. Map to new RBAC system. Field-level menu tree (`/{module}_{menuId}`) → new permissions.

---

## 5. User Data Migration (Phase 6)

### 5.1. Migration Data Inventory (from `_crawl/auth/_auth_extract.json` 2026-09-16)

| Item | Count | Notes |
|------|-------|-------|
| **Users** | **45** | All status `Aktif`, all have email + code (NIP) |
| **Roles** | **16** | All status `Aktif` |
| **Unique permissions** | **77** | 55 sub-modules + 22 dashboard widgets |
| **Activity log entries (legacy)** | 4,989 | No server-side date filter, "never purge" retention |
| **Photos** | 1 custom, 44 default (`default.png`) | Migrate from `/uploads/common/YYYYMM/` |

### 5.2. Legacy Roles (16)

| ID | Name | Modul | Users |
|----|------|-------|-------|
| 1 | Administrator | 123 | 4 |
| 2 | HRD | 8 | 1 |
| 3 | Staff Back Office | 5 | 1 |
| 4 | Purchasing | 18 | 1 |
| 5 | Warehouse | 18 | 3 |
| 6 | Head Business Development | 20 | 1 |
| 7 | Business Development | 25 | 13 |
| 8 | Head Research and Development | 15 | 1 |
| 9 | Research and Development | 11 | 6 |
| 10 | **Production Mixing & Filling** | 17 | **0 (ORPHAN)** |
| 11 | Production Packaging | 15 | 2 |
| 12 | Apoteker Penanggung Jawab | 8 | 1 |
| 13 | Finance | 30 | 5 |
| 14 | Digital Marketing | 8 | 1 |
| 15 | BusDev + HRD | 20 | 1 |
| 16 | BusDev + Purchasing | 32 | 1 |

**⚠️ Role 10 = ORPHAN** (0 users, will be deleted before migration — see DEC-023)

### 5.3. Legacy Permission Slugs (77 total)

Preserve kebab-case slugs as canonical keys in NEX:

**55 sub-modules** (CRUD kebab-case):
```
role-manage, user-manage, coa-manage, coa-auto-manage, warehouse-manage,
warehouse-access-manage, goods-category-manage, goods-manage, supplier-category-manage,
supplier-manage, customer-category-manage, customer-manage, customer-my-manage,
sales-category, sales-target, purchase, purchase-invoice, purchase-return,
purchase-down-payment, purchase-payment, purchase-in, sales-return-in, goods-transfer,
delivery-out, purchase-return-out, sales-sample, sales-sample-payment, sales, sales-return,
sales-down-payment, sales-invoice, sales-payment, formulation-adjustment, formulation-manage,
formulation, request-cogs, batch-record, schedule-mixing, schedule-filling,
schedule-packaging, production-mixing, production-filling, production-packaging,
general-journal, other-payment, other-deposit, report-stock, report-mutation-goods,
report-stock-valuation, report-guest-book, report-follow-up-customer, report-general-ledger,
report-profit-loss, report-trial-balance, report-balance-sheet
```

**22 dashboard widgets** (prefix "D."):
```
D. Jadwal Produksi, D. Realisasi Produksi, D. Penjualan Sample, D. Penjualan Barang,
D. Pelanggan, D. Sample, D. Eksekutif, D. Notifikasi, D. Digital Marketing, D. BusDev,
D. RnD, D. Purchasing, D. Legalitas, D. Produksi, D. Gudang, D. HR, D. Keuangan,
D. Buku Tamu, D. Client Sample, D. Client Produksi, D. Client RO, D. Lost
```

### 5.4. Migration Mapping

| Legacy field | New field | Notes |
|--------------|-----------|-------|
| `user.id` (1-46) | `User.id` (UUID in NEX) | IDs remap to UUID — keep old ID in `User.legacyId` for migration traceability |
| `user.code` (NIP) | `User.employeeCode` | For display in lists |
| `user.name` | `User.fullName` | |
| `user.email` | `User.email` (UNIQUE) | Login identifier |
| `user.phone` | `User.phone` | |
| `user.password` (md5/plain/???) | **REHASH** with bcrypt(12) | Force password reset on first login |
| `user.photo` | `User.avatarUrl` | Migrate file from `/uploads/common/YYYYMM/` |
| `user.role_id` | `User.roleId` (FK to new Role) | Legacy role IDs 1-16 preserved as `legacyRoleId` |
| `user.status` (Aktif) | `User.isActive` (true) | |
| `user.tgl_bergabung` | `User.joinedAt` | Date format conversion |
| `role.id` (1-16) | `Role.id` (UUID in NEX) | Keep old ID in `Role.legacyId` |
| `role.name` | `Role.name` | |
| `role.modules[]` (sub-module + dashboard) | `Role.permissions[]` (Permission entity) | Slugs preserved as canonical keys |

**Critical**: All migrated users **must change password on first login** since legacy uses unknown hashing (likely md5 or bcrypt — needs verification via legacy DB sample, see DEC-022).

### 5.5. Cleanup Before Migration

- **Role 10** (Production Mixing & Filling) → **DELETE before migration** (orphan, 0 users) — DEC-023
- All 45 users → migrate
- 15 roles (excluding #10) → migrate with original IDs as `legacyRoleId`

---

## 11. Legacy Security Issues (Found During Extraction)

### 11.1. reCAPTCHA Site Key Publicly Exposed

**Severity**: HIGH
**Location**: `GET /setting` returns HTML containing:
```
reCAPTCHA Site Key: 6LdkxfMpAAAAADsmqCk-NXoVFymJ9RN5VesPdWvt
```

**Issue**: Even though this is the "site key" (public, intended for client-side), exposing it via authenticated admin endpoint is unnecessary. If real secret key (`6Lc...` server-side variant) is also there → **CRITICAL** (immediate rotation needed).

**Action for NEX**: Generate fresh reCAPTCHA key pair for NEX domain (`nexerp.id`). Do NOT reuse legacy keys (DEC-026).

### 11.2. Activity Log Has No Date Filter

**Severity**: MEDIUM
**Issue**: `/activity-log` returns 4,989 rows in single HTML render. No server-side pagination by date. Pagination is JS-only. Performance + storage risk if log grows.

**Action for NEX**: Implement proper date-range filter on `/activity-log` + retention policy (90 days hot, archive beyond that).

### 11.3. No `last_login` Exposed

**Severity**: LOW
**Issue**: User detail page does NOT expose `last_login` timestamp. Login events tracked in activity log but not surfaced in user management UI.

**Action for NEX**: Add `last_login_at` field to User entity, surface in user-management list.

### 11.4. Role 10 Orphan

**Severity**: LOW (data hygiene)
**Issue**: Role "Production Mixing & Filling" (id=10) has 0 users assigned.
**Action**: Delete before migration (DEC-023).

---

## 6. Session Management

### 6.1. Active Sessions

User can view all their active sessions (per device):

```
GET /api/v1/auth/sessions
→ Returns: [{ device, ip, location, last_active, refresh_token_id }]

DELETE /api/v1/auth/sessions/:id
→ Logout specific device (keep others)
```

### 6.2. Cross-Device Logout (forensic / security incident)

```
POST /api/v1/auth/logout-all
→ Invalidate ALL refresh tokens for current user
→ Force re-login on all devices
```

Admin can force logout all users:

```
POST /api/v1/admin/users/:id/logout-all
→ Admin-level force logout (audit logged)
```

---

## 7. Multi-Factor Authentication (Optional)

### 7.1. TOTP Enrollment

```
1. User: Settings → Enable MFA
2. Server generate TOTP secret, return QR code (otpauth://totp/...)
3. User scans in Google Authenticator / Authy
4. User confirms with current TOTP code
5. Server stores secret encrypted (AES-256-GCM)
6. Recovery codes generated (10 codes, one-time use)
```

### 7.2. Login with MFA

```
1. POST /api/v1/auth/login { email, password }
2. If MFA enabled → return { mfa_required: true, mfa_token: <short-lived-jwt-15-min> }
3. POST /api/v1/auth/mfa/verify { mfa_token, totp_code }
4. If OK → return full session (access + refresh)
```

### 7.3. Admin Enforcement

Admin can force MFA for sensitive roles:
```
POST /api/v1/admin/roles/:id/mfa-required { required: true }
```

---

## 8. Audit Logging (Auth-specific)

All auth events logged to `audit_log` table:

| Event | Fields |
|-------|--------|
| login_success | user_id, ip, user_agent, timestamp |
| login_failed | email (NOT user_id), ip, reason, timestamp |
| logout | user_id, refresh_token_id |
| password_changed | user_id, forced (bool), timestamp |
| password_reset_requested | email, ip |
| mfa_enabled/disabled | user_id, admin_id (if forced) |
| token_refreshed | user_id, refresh_token_id (old), timestamp |
| session_revoked | user_id, revoked_by, reason |
| role_changed | user_id, old_role, new_role, admin_id |

Retention: 1 year minimum (configurable per regulation).

---

## 9. Open Questions (require user decision)

1. ✅ **Legacy password hash algorithm** — DONE 2026-09-16. Cannot determine from DOM. Candidates: bcrypt ($2y$...), md5, sha1. **Need DB sampling** during migration prep. (DEC-022)
2. **Session timeout for inactive users** — Default 30 min idle, configurable? (Default: 30 min) — OD-1 still pending
3. **Password policy for legacy-imported users** — Force reset on first login, or 90-day from import date? — OD-2 still pending
4. **Reuse legacy permission slugs verbatim in NEX** — preserve kebab-case or rename? (Default: preserve — DEC-024)
5. **Legacy role ID preservation** — keep IDs 1-16 in `legacyRoleId` field, or fresh UUID? (Default: keep in legacyId + fresh UUID) — DEC-025

---

## 10. References

- Existing build: `backend/src/modules/auth/jwt.strategy.ts` (current JWT implementation in NEX)
- Existing build: `backend/src/modules/auth/` (auth module structure)
- Legacy data source: `_crawl/auth/_auth_extract.json` (consolidated schema), `_crawl/auth/users_extracted.json`, `_crawl/auth/role_modules_extracted.json` (16 roles with permission tree)
- Crawl date: 2026-09-16
- Legacy crawl coverage: 45 users × 16 roles × 77 permissions

---

**Dokumen ini adalah referensi implementasi auth. Ubah dokumen ini dulu sebelum mengubah file auth backend.**