# P08 Frozen Acceptance Contract

**Phase:** P08 — Sample, R&D, formulation, creative, and legality
**Contract version:** `P08-v1`, frozen 2026-09-20
**Executor prompt:** `prompts/P08_FAST_PILOT_EXECUTION_PROMPT.md`
**Final verification command:** `npm run verify:p08`
**Success:** natural exit `0`; all focused backend, frontend, PostgreSQL golden-thread, affected build/type/lint and cleanup checks pass

## Purpose and finish line

P08 is complete when one real, tenant-safe golden thread proves:

`sample request → Finance-verified sample payment → approved formulation → finalized artwork → recorded permit`

and the same transactions produce the required immutable revision lineage, approval segregation and audit/outbox effects exactly once.

## Frozen scope

In scope:

- canonical ownership for the design/artwork and legality-permit subjects across contracts `01/03/04/05/06/07/08/10` and the canonical `schema.prisma` — these currently have **no** canonical owner;
- resolution of the `SalesSample`/`Formulation` (contract) vs `SampleRequest`/`Formula` (code) divergence to one authority per concept;
- sample request, Finance payment verification, and authorized submit/approve/reject;
- formulation composition, deterministic gram/HPP, revision lineage, adjustment lineage, lock immutability;
- design/artwork approval with bounded revision, and one dedicated page showing revision history plus finalized designs only;
- permit (BPOM / HKI-Merk / Halal) recording and expiry monitoring;
- affected screens on live internal APIs with canonical DNA composition and loading/empty/error/denied/success states.

Out of scope:

- permit submission workflow, regulatory filing, and product stability testing (deferred by owner decision 2026-09-20);
- sales, SO, DP, invoice, receipt, returns (P09);
- procurement, AP, matching (P10);
- QC release and traceability (P14);
- external provider/webhook/scheduler hardening (P17);
- repo-wide warning cleanup, Docker, deploy, load, browser matrix, release-depth security/DR (P19–P22).

## Exact required acceptance checks

| ID | Required proof |
|---|---|
| `contract_ownership` | Design/artwork and legality-permit concepts each have exactly one canonical owner across domain, workflow, rules, API, screen, RBAC, event and traceability; the `SalesSample`/`Formulation` vs `SampleRequest`/`Formula` divergence resolves to one authority; broken P08 screen references are corrected; owner decisions are recorded as `DEC-2026-09-20-*`. |
| `sample_payment_verification` | A sample request cannot enter formulation until Finance verifies the sample fee has been received. The acceptance-time auto-approve path is gone. Unauthorized and unverified-payment attempts fail. Submit/approve/reject obey canonical roles. |
| `formulation_deterministic_and_immutable` | Composition totals exactly 100%; %→gram conversion and HPP are deterministic and reproducible; revision lineage preserves prior versions; a locked formula and an approved revision reject mutation. |
| `adjustment_lineage_preserved` | An adjustment or rework creates its own lineage and never rewrites an approved or locked revision; the parent revision number is unchanged. |
| `design_bounded_revision_and_finalized_page` | Design approval follows the canonical state machine with required role segregation; revisions are allowed up to the bounded limit and the design locks only past it; exactly one page presents revision history and finalized designs only, on live data through `@/components/dna`. |
| `permit_record_and_expiry` | Permits are recorded with issue/expiry dates and expiry is detectable and surfaced; no submission workflow is implemented. |
| `audit_outbox_atomicity` | Governed P08 writes, their audit record and required outbox event commit together exactly once or roll back together. |
| `golden_thread` | The complete sample-to-permit flow passes through real production services and a disposable PostgreSQL database, including one retry and one unauthorized attempt. |
| `frontend_live_data_dna_states` | Affected screens call live internal APIs, import interactive/visual primitives through `@/components/dna`, and prove loading/empty/error/denied/success. No production mock or fallback remains in P08 scope. |
| `affected_regression_and_cleanup` | One narrow P07→P08 sample-handoff smoke, affected type/build/lint checks and P08 tests pass; temporary `nex_p08_*` databases are removed with zero residue. |

## Required adversarial cases

The production path must reject or safely collapse all of these:

1. formulation started with unverified or absent sample payment;
2. composition total not equal to 100%;
3. mutation attempted on a locked formula or an approved revision;
4. revision requested past the bounded limit without the authorized unlock;
5. approval performed by a role that lacks the canonical permission, or across tenant scope;
6. repeated idempotency key producing two business effects;
7. transaction failure between business write and audit/outbox;
8. permit read past expiry treated as valid.

These are ordinary negative business tests, not a mutation framework. Each case must use the same production service used by valid traffic.

## Thresholds

- all 10 acceptance checks and all subphase/seam tests pass;
- golden thread produces exactly one canonical sample, one verified payment effect, one approved formulation, one finalized artwork, one permit record and one required audit chain;
- cross-tenant or unauthorized disclosure/mutation count is `0`;
- unexpected skipped, pending, todo, only or flaky tests: `0`;
- new type errors and lint errors in changed scope: `0`;
- production mocks/fallbacks and new unregistered DNA violations in changed scope: `0`;
- residual `nex_p08_*` databases and plaintext secrets in evidence: `0`.

No repository-wide zero-warning or historical-debt cleanup is required by P08 unless the changed code increases that debt or blocks the owned workflow.

## Final-verification admission and rerun policy

P08 creates no bespoke certifier, gate engine, mutation harness, SHA-token system, generated evidence framework, or `scripts/ssot/p08_*` engine. `npm run verify:p08` is a thin fail-fast composition of already-exercised commands declared directly in `package.json`. It may run only after all subphases pass. If it fails, rerun only the owning targeted test before one final verification rerun. Independent auditor reproduction is the second proof.

New ordinary acceptance criteria may not be added after execution begins. Only a newly reproduced P0/P1 security, authorization, correctness or data-loss defect can amend this contract.
