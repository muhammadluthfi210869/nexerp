# NEX ERP — Full Production-Readiness Gap Assessment

**Assessment date:** 2026-09-17  
**Target:** full ERP production-ready, polished, end-to-end verified, and ready to enter business UAT  
**Verdict:** **NOT READY FOR UAT**  
**Conservative verified readiness:** **14.0%**  
**Remaining production-readiness gap:** **86.0%**

The 14.0% figure is a release-evidence score, not a claim that only 14% of the features have been coded. The repository contains substantial implementation, but most of it has not yet been reconciled to the canonical contracts or passed mandatory production gates. Feature completeness cannot be stated honestly until aliases, duplicates, implementation-only capabilities, and missing canonical capabilities are classified one by one.

## Executive summary

- The canonical specification is nearly coherent: 18 of 19 deterministic gates pass (94.7%). It remains `NOT CERTIFIED` because four business decisions are open.
- Contract-to-code identity is the largest measurable gap. Exact matches cover 21/92 canonical models (22.8%), 13/377 API operations (3.4%), and 7/179 screen routes (3.9%). These are reconciliation gaps, not automatically missing features.
- The current release baseline is red: backend build passes, frontend production build fails, backend unit tests fail, frontend unit tests fail, frontend lint reports 524 errors and 8,106 warnings, and Docker Compose cannot parse the local `.env`.
- Security is a stop-the-line issue: the production dependency audit reports 27 high vulnerabilities in backend dependencies and the frontend audit reports 19 vulnerabilities including 1 critical and 11 high. Tracked documentation also contains credential material that must be removed and rotated.
- Test assets exist (33 backend unit spec files, 18 backend E2E specs, 83 frontend test files, and 27 root Playwright specs), but existence is not acceptance. The current CI only runs a narrow shell/marketing smoke path and does not enforce the complete SSOT, build, lint, unit, integration, E2E, security, accessibility, or performance gates.

## Measurement method

The baseline combines deterministic static inventory with commands executed on 2026-09-17. Exact identity uses normalized HTTP methods/paths, model names, and UI routes. It deliberately does not guess that differently named objects are equivalent.

| Dimension | Weight | Current score | Weighted contribution | Evidence |
|---|---:|---:|---:|---|
| SSOT certainty | 10% | 94.7% | 9.5 | 18/19 contract gates pass |
| Exact contract-to-code alignment | 15% | 10.0% | 1.5 | Mean of model 22.8%, API 3.4%, screen 3.9% |
| Build and static quality | 10% | 20.0% | 2.0 | Only backend production build passed among the observed build/static gates |
| Automated verification | 15% | 0% | 0 | No required unit/integration/E2E suite has a fully green current verdict |
| Golden-thread business flows | 15% | 0% | 0 | Full environment could not start; no current full-thread pass evidence |
| Security and compliance | 10% | 0% | 0 | Critical/high dependencies and credential/environment findings remain |
| Data, migration, and financial reconciliation | 10% | 0% | 0 | Canonical schema differs materially; no current clean migration/restore/reconciliation evidence |
| UI/UX, accessibility, and browser quality | 10% | 0% | 0 | Build/lint red; no complete visual/a11y/browser certification |
| Operations, observability, and DR | 5% | 20.0% | 1.0 | CI/deploy/backup scripts exist, but local compose is broken and current drills are not certified |
| **Total** | **100%** |  | **14.0%** | Conservative verified readiness |

Scoring is gate-based: a domain receives no release credit until its required evidence is green. This prevents large quantities of unverified code from inflating readiness.

## Reproducible static baseline

Generated evidence: `_IMPLEMENTATION_READINESS_BASELINE.json`, produced by `node scripts/ssot/audit_implementation_readiness.js`.

| Measure | Canonical | Implementation | Exact shared | Exact canonical coverage | Gap requiring classification |
|---|---:|---:|---:|---:|---:|
| Prisma models | 92 | 194 | 21 | 22.8% | 71 canonical-only; 173 implementation-only |
| API operations | 377 | 662 unique | 13 | 3.4% | 364 canonical-only; 649 implementation-only |
| Screen routes | 179 | 270 | 7 | 3.9% | 172 canonical-only; 263 implementation-only |

The totals are not additive feature counts. One business capability may span several models, APIs, screens, rules, roles, and tests.

## Current execution evidence

| Gate | Result | Evidence / implication |
|---|---|---|
| SSOT validator | FAIL overall | 18 PASS, 1 FAIL; four blocking decisions |
| Backend build | PASS | Nest compiled 478 files |
| Frontend production build | FAIL | Type error on invalid `DnaStatCard` variant in R&D project monitoring |
| Backend unit suite | FAIL | 18 suites pass, 5 fail; 198 tests pass, 61 fail, 1 skip |
| Frontend unit suite | FAIL | 49 files pass, 2 fail, 2 skip; 325 tests pass, 2 fail, 7 skip; 2 worker errors |
| Frontend lint | FAIL | 8,630 findings: 524 errors and 8,106 warnings |
| Docker Compose boot precheck | FAIL | Root `.env` is malformed and cannot be parsed |
| Backend production dependency audit | FAIL | 27 high vulnerabilities |
| Frontend production dependency audit | FAIL | 19 vulnerabilities: 1 critical, 11 high, 4 moderate, 3 low |
| Backend E2E | NOT EXECUTED | Environment gate unavailable; 18 specs exist |
| Root Playwright E2E | NOT EXECUTED | Environment gate unavailable; 27 specs exist |
| Accessibility/visual/browser matrix | NOT CERTIFIED | Only a limited golden-reference visual spec was found |
| Load/performance/soak | NOT CERTIFIED | Scripts exist, but no current passing evidence pack |
| Backup restore/DR | NOT CERTIFIED | Scripts exist, but no current RPO/RTO drill evidence |

## Gap register and required change

### P0 — must be closed before feature phases

1. Remove credential material from tracked documentation/history as appropriate, rotate every exposed or historically exposed credential, and prove revocation.
2. Remove unsafe production defaults, repair `.env` parsing, and establish validated environment templates plus secret-manager delivery.
3. Upgrade/remediate vulnerable production dependencies; regenerate lockfiles and retest. Critical/high exploitable findings must be zero.
4. Repair frontend production build, backend/frontend unit suites, and the test worker/OOM configuration.
5. Expand CI so PRs cannot merge without SSOT validation, build, lint, unit/contract tests, migration checks, and scoped E2E.

### P1 — blocks correctness and UAT readiness

1. Resolve the four business decisions and reach 19/19 SSOT gates.
2. Reconcile all 92 canonical models against the 194 implementation models using an explicit `canonical → implementation | alias | replace | remove | extension` map.
3. Reconcile all 377 canonical operations and 179 canonical screen routes to implementation. Remove duplicate `/v1/v1` routes and uncontrolled aliases.
4. Establish one canonical physical schema and migration history. Contract and implementation schemas may not evolve independently.
5. Eliminate production mock/fallback/dummy data paths. Static scan found markers in 120 frontend source files; every hit must be classified, not bulk-deleted blindly.
6. Make all 37 requirements, 106 business rules, 37 workflows, 76 events, 144 permissions, and 239 trace tests executable or linked to executable evidence.
7. Close financial, inventory, period-lock, approval, idempotency, concurrency, and reversal invariants with negative-path tests.
8. Establish owned domain boundaries and classify every implementation object as `CANONICAL`, `APPROVED_EXTENSION`, `COMPATIBILITY_ADAPTER`, `DUPLICATE`, `DEPRECATED`, `DEAD_CODE`, or `DECISION_REQUIRED`; removal requires reachability and regression evidence.
9. Make architecture fitness checks blocking in CI: dependency direction, forbidden/circular imports, orphan objects, unused production dependencies/exports, duplication, and changed-code complexity.
10. Inventory every screen against the strict DNA boundary. Classify direct UI-kit/DNA-subpath imports, raw interactive primitives, duplicate local components, hardcoded visual values, divergent reference markup, and missing barrel exports; block new violations in CI.

### P2 — required for a polished full ERP

1. Normalize the design system across every in-scope route; remove 8,630 lint/DNA findings without disabling rules.
2. Certify empty, loading, error, permission-denied, offline/retry, conflict, print, export, and responsive states.
3. Meet WCAG 2.1 AA, keyboard/focus requirements, 44×44 px targets, browser matrix, and visual-regression approval.
4. Complete reports, notifications, notes/@mentions, document lifecycle, imports/exports, schedulers, and external integrations.
5. Add user guidance, operational runbooks, data dictionary, permission catalog, and support diagnostics.
6. Consolidate duplicate frontend/backend/data-access paths and remove classified dead/deprecated code in each domain without retaining uncontrolled parallel implementations.
7. Migrate every canonical and approved-extension screen to imports from `@/components/dna`; make `/visual-dna` and `/visual-dna/golden-reference` canonical, executable references that render the real exported components.

### P3 — operational excellence before UAT handoff

1. Prove performance targets: FCP <1.5s, LCP <2.5s, CLS <0.1, list API p95 <200ms, report API p95 <500ms, OLTP query p95 <100ms, report query p95 <1s.
2. Prove backup encryption, restore, RPO ≤24h, and RTO ≤4h.
3. Prove observability: structured logs, trace IDs, metrics, actionable alerts, audit immutability, and incident drills.
4. Complete at least two production-like migration rehearsals with identical repeatable results and zero unexplained financial/inventory deltas.
5. Produce the final UAT pack with seeded roles, scripts, expected results, known-limitations register (empty), rollback plan, and signed technical readiness certificate.
6. Complete the five changeability rehearsals defined in `_ARCHITECTURE_MAINTAINABILITY_STANDARD.md` so persisted-field, workflow/rule, UI/API, report/KPI, and integration/event changes can be delivered and reversed without unexplained unrelated-domain edits.

## What “100% ready for UAT” means

The system may enter UAT only when all of the following are true:

- Every phase in `_PRODUCTION_PHASE_GATES.yaml` is `PASS`; no phase is waived by schedule pressure.
- SSOT is 19/19, all four decisions are resolved, and canonical-to-code mappings are 100% classified and verified.
- Both production builds, lint, typecheck, unit, integration, contract, migration, E2E, visual, accessibility, security, performance, and DR gates are green.
- There are zero P0/P1 defects, zero unexplained skipped/quarantined tests, and zero production mock/fallback paths.
- Critical financial/inventory/approval golden threads pass happy, negative, concurrency, idempotency, authorization, rollback, and audit assertions.
- Migration reconciliation has zero unexplained delta for control totals, stock quantity/value, receivables, payables, cash/bank, and general ledger.
- UI review covers all 179 canonical screens and every approved implementation-only screen in normal, empty, loading, error, permission-denied, and responsive states.
- Architecture certification reports zero forbidden cycles/boundary violations, unexplained orphan/dead/duplicate objects, and unused direct production dependencies; ownership, ADRs, and removal conditions are complete.
- Five production-like change rehearsals prove that the ERP can sustain the expected 8–15 monthly changes with traceable impact, backward-compatible database/interfaces, automated regression, observability, and deploy/reversal evidence.
- Every canonical and approved-extension UI has per-screen DNA evidence; static and rendered scans report zero unregistered direct UI-kit/DNA-subpath imports, raw interactive primitives, duplicated DNA components, hardcoded visual values, divergent golden-reference markup, or invalid/expired exceptions.
- Operations can deploy, monitor, back up, restore, roll back, and diagnose the release using rehearsed runbooks.

Business UAT then validates fitness for real users and signs acceptance; it must not be used to discover basic build failures, missing authorization, broken accounting, untested migration, or unfinished UI.

## Limitations and confidence

Confidence is **medium** for the measured baseline and **low** for feature completeness. Static exact matching is intentionally strict and live `kil.gserp.id` revalidation was unavailable in the preceding certification run. The next roadmap phase must classify every mismatch and repeat legacy parity checks before a defensible functional completion percentage can replace the current readiness score.
