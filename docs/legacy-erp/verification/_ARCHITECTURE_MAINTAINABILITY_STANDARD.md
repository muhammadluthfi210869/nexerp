# NEX ERP — Architecture and Maintainability Certification Standard

**Purpose:** ensure the production ERP can safely absorb an expected **8–15 backend, frontend, database, reporting, workflow, and integration changes per month** after go-live. This document defines certification evidence; runtime business behavior remains owned by `contracts/`.

## Core principles

1. Organize code around owned business domains, not technical dumping grounds.
2. Keep business rules and state transitions out of controllers, transport adapters, and UI components.
3. Dependencies point inward toward domain/application behavior; domain modules do not depend directly on UI or delivery mechanisms.
4. A shared module contains only deliberately stable primitives with named owners. It is not a shortcut for cross-domain coupling.
5. Cross-domain effects use explicit application interfaces and canonical events; database-table reach-through is forbidden unless approved and documented.
6. Schema, API, and event changes are backward compatible during their declared deployment/migration window.
7. Every material architecture exception has an owner, rationale, test, expiry/review date, and ADR/decision reference.

## Required lifecycle classification

Every canonical and implementation object discovered in P02 must be classified as one of:

- `CANONICAL`
- `APPROVED_EXTENSION`
- `COMPATIBILITY_ADAPTER`
- `DUPLICATE`
- `DEPRECATED`
- `DEAD_CODE`
- `DECISION_REQUIRED`

Removal requires caller/import/runtime-registration evidence, contract and parity review, affected-test review, and a regression run. `COMPATIBILITY_ADAPTER` and `DEPRECATED` entries require an owner and explicit removal condition; they cannot live indefinitely without review.

## Machine-enforced thresholds

| Control | Release threshold |
|---|---|
| Domain ownership | 100% deployable modules and cross-cutting packages have a named owner and purpose |
| Module boundaries | 0 forbidden imports or direct cross-domain persistence reach-through |
| Circular dependencies | 0 forbidden domain/application cycles; framework-generated cycles must be explicitly allowlisted with evidence |
| Orphan objects | 0 unexplained routes, screens, controllers, services, jobs, events, models, or migrations |
| Production dependencies | 0 unused direct production dependencies; no duplicate package performing the same approved function without rationale |
| Lifecycle debt | 0 unexplained `DEAD_CODE`/`DUPLICATE`; every retained `DEPRECATED`/`COMPATIBILITY_ADAPTER` has owner and removal condition |
| Duplication | New/changed hand-written code ≤1% duplicated lines; whole hand-written codebase ≤3%, excluding generated/vendor/migration snapshots |
| Complexity | New/changed functions cyclomatic complexity ≤10; 11–15 requires decomposition rationale and tests; >15 fails unless a time-bounded approved exception exists |
| Function responsibility | New/changed business functions have one explicit responsibility and tests at their owning layer; file length alone is not a pass/fail metric |
| Architecture fitness | Boundary, dependency, unused, orphan, and duplication checks run in CI and cannot be informational-only |
| Changed critical logic | Finance, inventory, authorization, state-transition, and idempotency changes retain ≥90% branch coverage and pass mutation sampling where tooling supports it |
| Documentation | Material boundary/dependency decisions have an ADR/decision entry and updated module/traceability ownership |

The P03 baseline may ratchet legacy metrics downward rather than deleting unsafe code blindly, but no PR may increase a ratcheted debt count. The final P20/P22 release candidate must meet the thresholds above or carry an explicit non-P0/P1 exception permitted by the roadmap; dead, duplicate, orphan, boundary, security, correctness, or data-integrity failures are not waivable.

## Per-change Definition of Done

Every change, including post-go-live maintenance, must include:

1. Requirement and canonical IDs.
2. Impact map: contracts, modules, database objects, API/events, screens, roles, reports, tests, deployment and rollback/roll-forward.
3. Contract-first update for changed behavior.
4. Backward-compatible database/API/event evolution where zero-downtime or rolling deployment requires it.
5. Automated unit, integration, contract, and affected E2E regression.
6. Architecture fitness checks for the changed dependency graph.
7. Security, authorization, audit, notes/@mention, accessibility, observability, and performance review where affected.
8. Deployment and reversal instructions with feature flag when blast radius warrants it.
9. Removal of superseded code after the compatibility window closes.
10. Evidence pack with actual commands, results, changed ownership, debt delta, and exceptions.

## Change-coupling failure conditions

A change fails maintainability review when it:

- requires edits in unrelated domains without an explicit contract dependency;
- duplicates a rule in backend, frontend, report, or integration layers;
- reaches another domain's database tables instead of using its owned interface/event;
- adds a generic shared helper solely to avoid defining ownership;
- requires manual production data edits without an idempotent migration/backfill;
- cannot be tested without booting unrelated modules;
- cannot be rolled forward/back or safely disabled;
- leaves both old and new implementations active without a controlled compatibility/removal plan.

## P21 change rehearsals

Before UAT, run five production-like rehearsals: persisted-field evolution, workflow/business-rule change, UI/API change, report/KPI change, and integration/event change. Each rehearsal passes only when:

- the pre-change impact map predicts the touched artifacts;
- no unexplained unrelated-domain files or tables change;
- old/new compatibility works during the declared window;
- migrations/backfills are idempotent and rehearsed;
- required automated suites and architecture checks pass;
- telemetry exposes failure and the deploy/reversal procedure succeeds;
- superseded code has a verified removal point.

P22 independently samples the dependency graph, lifecycle registry, ADRs, and rehearsal evidence. Passing functional tests alone is insufficient for maintainability certification.

## Post-go-live operating indicators

Track monthly rather than using these to excuse a release gate:

- planned versus completed changes;
- lead time from approved contract to production;
- change failure and rollback rate;
- mean time to restore;
- escaped defects by severity and owning module;
- architecture/debt ratchet movement;
- percentage of changes with complete traceability and automated regression;
- compatibility adapters/deprecations created versus removed.

If the system cannot sustain 8–15 safe monthly changes without rising failure rate or architectural debt, pause feature intake for remediation instead of weakening gates.
