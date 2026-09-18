# NEX ERP — Full ERP Production-Readiness Roadmap

**Objective:** deliver the complete ERP—not an MVP—with polished UI, verified business behavior, production operations, a final handoff that is ready for business UAT, and an architecture that can safely absorb an expected **8–15 cross-stack changes per month** after go-live.  
**Schedule policy:** no deadline-based waivers. Quality gates determine progress.  
**Phase count:** 23 sequential certification phases (`P00`–`P22`). Work inside a phase may run in parallel, but the next phase cannot be certified until the current phase is green.

This is an execution and certification plan, not runtime business authority. Canonical behavior remains owned by `contracts/00_MASTER_SPEC.md §9.1`.

## Non-negotiable phase protocol

Every phase follows the same state machine:

`NOT_STARTED → IN_PROGRESS → TESTING → PASS` or `TESTING → FAIL → REMEDIATION → TESTING`

Rules:

1. Entry requires the preceding phase to be `PASS` and its evidence pack committed.
2. A failing required test makes the phase `FAIL`; failure cannot be relabeled “known issue” to advance.
3. Fixes must add or update regression tests before retest.
4. No unexplained skipped, flaky, quarantined, or `only` tests are allowed.
5. A waiver is allowed only for a capability explicitly removed from scope through a canonical decision; it must remove/update its requirement, contract, UI, API, permission, and tests together.
6. Every phase reruns all earlier fast gates. Every domain phase reruns affected golden threads. `P20`–`P22` rerun the complete suite.
7. A phase is green only when machine evidence and human review agree.
8. Every change must preserve or improve changeability: no new unexplained dead code, duplicate implementation, forbidden dependency, circular dependency, or undocumented architectural exception.
9. Every phase uses the one-pass package in `verification/_ONE_PASS_PHASE_EXECUTION_STANDARD.md`: one complete prompt, one frozen acceptance contract, one authoritative command, adversarial proof, pre-certification checklist, and independent rerun.
10. A phase executor continues through remediation and retest until the authoritative command passes, except for an explicit decision/authority/external-system/destructive-action blocker; partial green results are not a handoff condition.

### Verification cadence

- Every phase performs scoped self-verification against its own required gates/tests before progression.
- Independent deep audit is grouped into an inclusive batch of at most five phases using `verification/_BATCH_VERIFICATION_PLAN.md`.
- A batch does not weaken sequential certification: the first failed phase prevents certification of later phases, even if later diagnostics happen to pass.
- Prefer audit milestones `P00–P03`, `P04–P06`, `P07–P10`, `P11–P14`, `P15`, `P16–P18`, `P19`, and `P20–P22`. P15 and P19–P22 receive dedicated depth due to financial, UI, system, migration/DR, and pre-UAT risk.
- The shorthand `verifikasi fase X-Y` is sufficient to invoke the complete batch protocol; ranges above five phases are split automatically.
- Per-phase commands are bounded `PHASE_GATE` checks and should normally finish in roughly 10–25 minutes on a prepared workspace. Clean-room installs, Docker/runtime, cumulative E2E, load/browser matrices, deployment and DR belong to integration checkpoints or P20–P22 unless a phase explicitly owns them.

## Universal Definition of Done

Applied to every phase:

- Contract first: owning contract, dependencies, traceability, and decision log updated.
- Implementation complete: backend, database, UI, RBAC/data scope, audit, notes/@mention, errors, and events where applicable.
- Data complete: migration/seed/backfill is idempotent and rollback-safe.
- Tests complete: happy, validation, authorization, negative, idempotency, concurrency, rollback, audit, empty/loading/error UI states.
- Quality complete: production builds pass; no new lint/type errors or vulnerability regressions.
- Maintainability complete: affected code has an explicit owner and boundary; dead/duplicate/deprecated paths are classified; dependency direction, complexity, unused-code, and duplication checks pass; material architecture decisions are recorded.
- Change safety complete: database/API/event changes use backward-compatible evolution where required, include rollback or roll-forward proof, and do not require unrelated domain edits merely to complete the requested capability.
- UI DNA complete: every affected application UI imports visual/interactive primitives through `@/components/dna`; no direct UI-kit/DNA-subpath import, raw primitive reimplementation, or unregistered hardcoded visual value remains; canonical reference and per-screen evidence pass.
- Evidence complete: commands, results, coverage, defects fixed, screenshots where visual, and reconciliation totals stored in the phase evidence pack.
- Zero unresolved P0/P1 defects in phase scope.

## Permanent release thresholds

| Area | Required threshold |
|---|---|
| SSOT | 19/19 deterministic gates PASS; zero blocking decisions |
| Canonical alignment | 100% of models, API operations, screens, permissions, workflows, events, and tests mapped and verified |
| Build/type/lint | Backend and frontend production builds PASS; 0 type errors; final lint 0 errors and 0 warnings |
| Unit coverage | ≥70% for business logic per NFR; ≥90% branches for finance, inventory, authorization, state transitions, and idempotency |
| Automated suites | 100% required tests pass; 0 unexpected skip/flaky/quarantine/worker errors |
| Security | 0 critical/high production vulnerabilities; no active leaked/default credentials; threat-model controls verified |
| Data reconciliation | 100% records classified; 0 unexplained control-total, inventory-value, AR/AP, cash/bank, or GL delta |
| UI/accessibility | All canonical screens reviewed; WCAG 2.1 AA; 0 serious/critical axe findings; keyboard/focus complete |
| UI DNA composition | 100% canonical and approved-extension screens covered; 0 unregistered direct UI-kit/DNA-subpath imports, raw interactive primitives, duplicated DNA primitives, hardcoded visual tokens, broken barrel exports, or divergent golden-reference implementations; policy in `verification/_UI_DNA_COMPLIANCE_STANDARD.md` |
| Performance | NFR §10 targets met at p95; no P1 Core Web Vitals failure |
| DR | Encrypted backup and restore drill proves RPO ≤24h and RTO ≤4h |
| Architecture/changeability | 100% modules have owners and declared boundaries; 0 forbidden circular dependencies; 0 unexplained orphan routes/screens/models/services; 0 unused production dependencies; all dead/duplicate/deprecated code classified; changed code passes complexity and duplication policy in `verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md` |
| Change rehearsal | Representative database, business-workflow, UI/API, reporting, and integration changes pass impact analysis, implementation, automated regression, deploy, and rollback/roll-forward rehearsal without unrelated-domain modification |
| Defects | 0 open P0/P1; P2 only if explicitly accepted for post-UAT and not correctness/security/accessibility/data-loss related |

## Phase map

### Foundation and truth

| Phase | Outcome | Required tests / evidence | Exit gate |
|---|---|---|---|
| **P00 — Stop-the-line containment** | Credentials contained; malformed environment repaired; vulnerable runtime path understood | Secret scan including history, rotation proof, `.env` parser check, dependency audit, compose config validation | No active exposed/default production credential; compose config parses; remediation plan exists for every critical/high finding |
| **P01 — Business certainty and SSOT lock** | Four open decisions resolved in canonical owners | SSOT validator, decision consistency, locked-status integrity, stakeholder decision evidence | 19/19 SSOT gates PASS; zero `DECISION_REQUIRED` |
| **P02 — Contract-to-code and lifecycle reconciliation** | One explicit mapping for all canonical and implementation objects, including their retain/consolidate/deprecate/remove disposition | Static readiness audit; model/API/route/RBAC/event/workflow diff; caller/import/runtime-registration analysis; duplicate/alias/orphan/unused/dead-code classification; screen-to-DNA import and hardcode inventory | 100% classified as `CANONICAL`, `APPROVED_EXTENSION`, `COMPATIBILITY_ADAPTER`, `DUPLICATE`, `DEPRECATED`, `DEAD_CODE`, or `DECISION_REQUIRED`; approved mapping has zero unexplained objects; every screen has a DNA migration disposition |
| **P03 — Reproducible build, architecture gates, and CI** | Clean checkout can build/test identically and every PR is guarded against architecture, maintainability, and UI DNA regression | Lockfile install, builds, typecheck, lint, unit smoke, SSOT, migration/container validation, architecture scans, DNA AST/import/native-interactive/hardcoded-token/barrel/reference checks | Required PR gates enforce all failures; both builds green; deterministic resources; architecture and DNA ratchets prevent new debt |
| **P04 — Canonical database and migration chain** | Contract and runtime use one physical schema/migration lineage that supports frequent safe evolution | Prisma validate/generate, empty-DB migrate, upgrade-from-supported-baseline, rollback rehearsal, schema diff, expand/migrate/contract compatibility test | Zero unapproved drift; migrations are idempotent and production-safe; old and new application versions can coexist during the declared deployment window |
| **P05 — Platform architecture, maintainability, and controls** | Domain boundaries, dependency direction, shared-kernel policy, auth, RBAC/data scope, audit, communication, outbox, idempotency, configuration, and error handling are consistent and independently changeable | Architecture dependency tests; circular/coupling/duplication/complexity scan; auth/session/MFA; permission matrix; tenant isolation; maker-checker; immutable audit; outbox; notes/@mention ACL; error contract | No forbidden dependency or circular domain edge; no god/shared dumping-ground path; cross-cutting tests green; representative modules can change without unrelated-domain modification |

### Full domain implementation

| Phase | Outcome | Required tests / evidence | Exit gate |
|---|---|---|---|
| **P06 — Master data and system configuration** | Organization, division, users/roles, customer/supplier/goods/warehouse/CoA/formulation masters complete | CRUD + uniqueness + soft delete + import/export + pagination/filter + role/data-scope + audit tests | Every master screen/API is live-data backed; no production mock/fallback; referential integrity green |
| **P07 — CRM, marketing, guest book, and BusDev** | Lead capture through qualification/lost/follow-up/target activity is production-ready | Dedup, ownership, reassignment, channel attribution, consent, import, follow-up SLA, role visibility, dashboard reconciliation | Golden thread Lead → qualified commercial opportunity passes with full audit/evidence |
| **P08 — Sample, R&D, formulation, creative, and legality** | Sample request/payment, formula revisions, adjustment decision, artwork/legal approvals, stability/regulatory tracking complete | Revision immutability, adjustment lineage, attachment/version, approvals, rejection/rework, expiry/SLA, role segregation | Sample → approved formulation/artwork/legal release golden thread passes |
| **P09 — Sales, DP, delivery, AR, and returns** | SO lifecycle, accepted-DP policy, production release, invoice/receipt, credit/return complete | Price/discount/credit limit; DP amendment/cancel; stock hold; delivery proof; invoice/payment allocation; return/credit note; reversal; concurrency | Lead/Sample → SO → DP → delivery → invoice → receipt/return/journal passes happy and negative paths |
| **P10 — SCM, MRP, procurement, AP, and matching** | Requirements through PO/GR/QC/invoice/payment/return complete | MRP shortage, PR/PO approvals, partial receipt, four-leg zero-tolerance match, debit note, AP allocation, duplicate invoice, reversal | PR → PO → GR → QC → AP invoice → payment/journal passes with exact reconciliation |
| **P11 — Warehouse and inventory** | Multi-warehouse stock, lots/batches, movement, reservation, transfer, opname, adjustment, and reverse logistics complete | No-negative-stock, lot/expiry, quarantine, reservation race, transfer in transit, opname threshold, adjustment approval, ledger-vs-balance reconciliation | Quantity/value ledger reconciles exactly under concurrency and rollback tests |
| **P12 — Production planning and dispatch** | Demand, work orders, material readiness, machine/capacity, schedules, and dispatch complete | MRP-to-WO, capacity conflict, material shortage, schedule collision, role approval, reschedule audit, idempotent dispatch | Approved SO → feasible, authorized, fully traced work order passes |
| **P13 — Production execution** | Mixing, filling, packaging, yield/loss, downtime, rework, scrap, and material return complete | Stage order, quantity conservation, issue/return, yield/shrinkage, breakdown recovery, concurrent scans, invalid transition, offline/retry | Work order execution produces complete immutable batch genealogy with balanced material movements |
| **P14 — QC, quarantine, release, and traceability** | Sampling/inspection, deviation, hold, rework/scrap, COA, and FG release complete | Quarantine-by-default, QC pass/reject, partial disposition, retest, release idempotency, unauthorized release, recall trace, attachment evidence | Packaging never creates sellable FG; only authorized QC release creates `AVAILABLE` stock; recall trace is complete |
| **P15 — Finance, costing, accounting, and closing** | Selected valuation/HPP, AP/AR, cash/bank, journals, tax records, assets, budget, reports, period close, reversal complete | Double-entry/property tests; valuation; COGS; tax rounding; allocation; maker-checker; close/lock; adjustment; reversal; trial balance; BS/P&L/CF reconciliation | Every source document posts exactly once; debits=credits; subledgers=GL; locked periods reject normal posting |
| **P16 — HR, personnel, attendance/payroll scope, and KPI** | Employee lifecycle, contracts, role assignments, performance, per-person KPI, and any approved payroll/attendance scope complete | Effective dates, multi-role weights=100%, actor-at-event attribution, zero denominator=N/A, finalized-period immutability, PII scope, payroll arithmetic if in scope | Employee and KPI records are evidence-backed, permission-safe, reproducible, and auditable |
| **P17 — Documents, communication, integrations, and automation** | Notes/@mentions, attachments, print/PDF, import/export, notifications, schedulers, WA/email, webhooks, and external connectors hardened | MIME/size/AV, signed access, template snapshot, retry/DLQ, webhook signature, duplicate/out-of-order event, scheduler overlap, provider outage | No silent loss/duplicate side effect; documents reproduce; integrations degrade safely and alert |
| **P18 — Reporting, executive analytics, and KPI governance** | Operational, statutory/finance, management, project, dashboard, and KPI reporting reconciles to source | Report-vs-transaction totals, filter/timezone, drill-down, export parity, row-level access, cache freshness, large-data performance | Every published metric has owner/formula/grain/source/freshness and reconciles to transactional truth |

Every domain phase (`P06`–`P18`) also applies a mandatory **changeability and DNA ratchet** to its touched scope: remove or consolidate items already classified `DUPLICATE`, `DEPRECATED`, or `DEAD_CODE`; keep business logic outside controllers/UI; preserve domain boundaries; add architecture and regression tests; update owner/traceability/ADR data; and leave no new mock, fallback, orphan, unused dependency/export, forbidden import, unexplained compatibility path, direct UI-kit/DNA-subpath import, raw interactive primitive, duplicate DNA component, or hardcoded visual value. A domain phase cannot pass when its golden thread is green but its touched architecture or UI DNA compliance fails.

### Product polish and production certification

| Phase | Outcome | Required tests / evidence | Exit gate |
|---|---|---|---|
| **P19 — Strict DNA migration, UI/UX polish, frontend consolidation, and accessibility** | Every application screen is migrated to the canonical DNA barrel and approved routes share coherent visual DNA, complete states, and no parallel primitive implementation | 100% screen-to-DNA manifest; AST import/native-interactive/hardcoded-token scans; barrel and golden-reference integrity; unused/orphan scan; visual regression; axe; keyboard/focus; responsive/browser and UI-state matrices | Every canonical and approved-extension screen has evidence; 0 unregistered DNA violations; `/visual-dna*` references pass; lint 0/0; no critical visual/a11y defect, orphan, duplicate primitive, or production mock/fallback |
| **P20 — System-wide verification, maintainability, and resilience** | Complete release candidate survives full regression plus global architecture, change-impact, security, performance, concurrency, and failure testing | All unit/integration/contract/E2E; golden threads; dependency graph and architecture tests; unused/orphan/duplicate/complexity scan; mutation sampling; SAST/dependency/container/DAST; load/soak; chaos/retry; memory/leak; browser matrix | 100% required tests pass; architecture/changeability thresholds pass; vulnerability and NFR thresholds pass; zero P0/P1 |
| **P21 — Migration, change delivery, operations, cutover, and DR rehearsal** | Production-like data and operations can be moved, changed, deployed, reconciled, monitored, restored, and rolled back | Two migration rehearsals; five representative cross-stack change rehearsals; control totals; backward-compatibility window; feature-flag/expand-contract where applicable; backup/restore; rollback/roll-forward; alert/deploy/support runbook simulation | Two identical clean migrations and every change rehearsal pass; zero unexplained delta; no unrelated-domain edits; RPO/RTO and rollback/roll-forward proven |
| **P22 — Independent pre-UAT, DNA, and maintainability certification** | A frozen release candidate, complete UAT pack, and independently verified sustainable-change/UI baseline are ready | Fresh clean-room execution of every permanent threshold; independent source sampling of DNA imports and rendered screens; architecture and change-rehearsal audit; traceability; UAT scripts; go/no-go | Signed `READY FOR UAT`; immutable release; no P0/P1; no unexplained dead/duplicate/orphan path; 100% DNA evidence accepted; architecture supports 8–15 monthly changes |

## Sustainable change model after go-live

The production baseline must support **8–15 changes per month** without turning each change into a system-wide rewrite. This is a capacity objective, not permission to bypass quality gates. Each post-go-live change must remain independently traceable, testable, deployable, observable, and reversible.

Five representative change archetypes are rehearsed before UAT:

1. Add/evolve a persisted field through contract, backward-compatible database migration, API, UI, audit, and rollback/roll-forward.
2. Change a business rule or workflow transition with authorization, historical-data behavior, event side effects, and regression coverage.
3. Change a screen and API interaction without duplicating domain logic or bypassing the design system.
4. Add/change a report or KPI with formula, grain, lineage, access control, reconciliation, and performance proof.
5. Change an integration/event contract with versioning, compatibility, retry/deduplication, observability, and provider-failure proof.

Each rehearsal must produce an impact map before code changes and prove afterward that: only intended contracts/modules changed; database and interface compatibility were preserved; automated regression passed; deployment and reversal are documented; telemetry detects failure; and no unrelated domain required modification. Detailed rules and measurable thresholds are in `verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md`.

## Test architecture required by P03

| Layer | Scope | Runs |
|---|---|---|
| Static/contract | SSOT, OpenAPI, Prisma, route/RBAC/trace refs, typecheck, lint, secret scan | Every PR |
| UI DNA compliance | AST imports, direct/deep UI imports, native controls, duplicated primitives, hardcoded visual values, DNA barrel, canonical reference routes, screen manifest, exception registry | Every UI PR; affected domain gate; full P19–P22 |
| Architecture/maintainability | Module boundaries, dependency direction, circular edges, unused exports/dependencies, orphan objects, duplication, changed-code complexity, owner and ADR checks | Every PR for changed scope; full scan on main/nightly and P20–P22 |
| Unit/property | Business calculations, state guards, money/rounding, permissions, idempotency | Every PR |
| Component | Forms, tables, dialogs, error/loading/empty/denied states, accessibility primitives | Every PR |
| Integration | Service + real Postgres/Redis-compatible dependencies, transactions/outbox, migrations | Every PR for affected module; full on main |
| API contract | All 377 canonical operations, schemas, errors, auth, idempotency | Every main build; changed operations on PR |
| Domain E2E | Each phase’s complete domain flow and negative paths | Phase gate and nightly |
| Cross-domain golden threads | Sales, procurement, production/QC, finance, access/communication | Nightly and release candidate |
| Visual/accessibility | Approved screenshots, axe, keyboard, responsive/browser | Nightly and P19/P20 |
| Security | Secret/SAST/dependency/container/DAST/RBAC/tenant isolation/upload | PR where affected; full nightly/release |
| Performance/resilience | k6 load/soak, concurrency, retry/DLQ, degraded dependencies | Nightly subset; full P20 |
| Migration/DR | empty/upgrade migration, reconciliation, backup/restore/rollback | P04, P21, release candidate |
| Change rehearsal | Persisted-field, workflow/rule, UI/API, report/KPI, and integration/event evolution with impact map and deploy/reversal proof | P21 and independently sampled in P22 |

## Defect severity and phase behavior

| Severity | Definition | Phase effect |
|---|---|---|
| P0 | Data loss/corruption, credential exposure, auth bypass, unbalanced finance, unavailable core system | Stop all phase progression; immediate containment |
| P1 | Broken required workflow, incorrect result, missing audit/permission, inaccessible critical UI, NFR floor missed | Phase fails; must fix before progression |
| P2 | Important usability or non-critical functional defect with safe workaround | Must fix before P22 unless explicitly accepted and not correctness/security/data/accessibility related |
| P3 | Cosmetic improvement with no functional/accessibility impact | May enter controlled backlog after product review |

## Required phase evidence pack

Each phase stores:

1. Scope and canonical IDs covered.
2. Changed files and migrations.
3. Machine-readable test results and coverage.
4. Contract/schema/API/screen/RBAC diff.
5. Defect list with root cause and regression test.
6. Data reconciliation report.
7. Security and performance results where applicable.
8. Visual/a11y evidence for UI scope.
9. Rollback and operational notes.
10. Maintainability delta: classified dead/duplicate/deprecated items, removals/consolidations, dependency graph changes, unused/duplication/complexity results, architecture exceptions, and ADR links.
11. Change-impact statement proving that the requested capability did not require unexplained unrelated-domain edits.
12. UI DNA evidence where applicable: screen IDs, imported DNA exports, static-scan results, reference/snapshot/accessibility results, and registered exceptions.
13. Final `PASS` or `FAIL` decision with reviewer identity and timestamp.

The structured registry is `verification/_PRODUCTION_PHASE_GATES.yaml`. The current baseline and percentage method are in `verification/_FULL_ERP_GAP_ASSESSMENT.md`.
