# Security Audit Snapshot — 2026-09-11

**Tool**: `npm audit` (npm v10)
**Scope**: `backend/package.json` + `frontend/package.json` (direct + transitive)
**Date**: 2026-09-11
**Auditor**: Claude Code (automated snapshot, not deep review)

---

## ⚠️ DISCREPANCY WITH ZERO_ERROR_ROADMAP.md

`docs/plan/ZERO_ERROR_ROADMAP.md` (Phase 2: Security Hardening) claims:
> "Close all 19 detected security vulnerabilities."
> "`npm audit` returns 'found 0 vulnerabilities'"

**This claim is FALSE as of 2026-09-11.**

Real `npm audit` output:
- Backend: **42 vulnerabilities** (2 low, 7 moderate, 32 high, **1 critical**)
- Frontend: **33 vulnerabilities** (3 low, 11 moderate, 18 high, **1 critical**)
- **Total: 75 vulnerabilities** (5 low, 18 moderate, 50 high, 2 critical)

The "19 vulns closed" claim may refer to a specific subset (e.g. only direct deps or only one of two lockfiles), but the current full audit shows the codebase is NOT in a 0-vuln state.

**Action**: Update `ZERO_ERROR_ROADMAP.md` to reflect actual state, OR run `npm audit fix` and re-verify.

---

## Real Audit Counts (2026-09-11)

| Workspace | Low | Moderate | High | Critical | Total |
|-----------|----:|---------:|-----:|---------:|------:|
| backend   | 2   | 7        | 32   | 1        | **42** |
| frontend  | 3   | 11       | 18   | 1        | **33** |
| **Total** | 5   | 18       | 50   | 2        | **75** |

## Top Critical/High Vulnerabilities

### CRITICAL
1. **backend**: `@xhmikosr/decompress` — Archive extraction creates files/links outside target dir (path traversal via symlinks)
2. **frontend**: `next` — Middleware/Proxy bypass in App Router (Turbopack + single locale)

### HIGH (sample — see full JSON in `evidence/2026-09-11/security-audit-{backend,frontend}.json`)
- `axios` (FE): ReDoS via Cookie Name Injection
- `form-data` (both): CRLF injection via unescaped multipart field names
- `sharp` (FE): inherited libvips CVEs (CVE-2026-33327/33328/35590/35591)
- `prisma` (FE): generic — see npm advisory
- `@prisma/config` (both): generic — see npm advisory
- `ws` (FE): Memory exhaustion DoS from tiny fragments
- `mysql2` (FE): Auth Plugin Downgrade leaks plaintext credentials
- `undici` (FE): TLS validation bypass via SOCKS5 ProxyAgent
- `js-yaml` (both): Quadratic-complexity DoS in merge key handling
- `brace-expansion` (both): DoS via exponential-time expansion
- `hono` (both): Body Limit bypass on AWS Lambda

---

## Evidence Files

Full audit JSON snapshots:
- `evidence/2026-09-11/security-audit-backend.json` (npm audit --json output, 60KB)
- `evidence/2026-09-11/security-audit-frontend.json` (npm audit --json output, 68KB)

Reproduction:
```bash
cd backend && npm audit --json > ../evidence/2026-09-11/security-audit-backend.json
cd frontend && npm audit --json > ../evidence/2026-09-11/security-audit-frontend.json
```

---

## Recommended Next Steps (NOT in this batch)

1. **Run `npm audit fix`** in both workspaces — auto-fixes many moderate issues. Verify no breakage.
2. **Update Next.js** in frontend (`next` critical bypass) — major version upgrade likely needed.
3. **Replace `@xhmikosr/decompress`** — used by old build tooling, can probably be removed.
4. **Pin sharp** version or migrate away from libvips vulnerabilities.
5. **Review axios version** for cookie ReDoS — update to latest.
6. **Manual review** of 50 high-severity items — most are transitive deps without direct fix.

**Estimated effort**: 2-3 days for safe fixes + 1 day for major version upgrades.

---

## Honest Disclosure

This is an automated `npm audit` snapshot, NOT a manual security review. Real security audit would include:
- Code-level review of authentication/authorization
- SQL injection surface check
- SSRF audit
- Secrets management review
- Penetration testing

`npm audit` only catches publicly-known vulnerabilities in dependencies. Application-level security issues are NOT covered.
