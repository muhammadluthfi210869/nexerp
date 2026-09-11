# Digital Marketing Task & Social Management — Phase 0 Stabilization

Status: implemented on 2026-09-10  
Scope: Management Task and Social Tracker only  
Mutation policy: no database schema/data mutation in Phase 0

## Outcome

Phase 0 establishes a repeatable, isolated engineering baseline before the brief in
`dreamlab-erp-—-task-&-social-media-management/` is merged into the ERP.

The scoped code gate is green:

| Gate | Result |
|---|---|
| Backend Nest build | PASS — 404 files compiled |
| Marketing backend TypeScript check | PASS |
| Marketing Task/Social Jest suite | PASS — 48/48 tests |
| Frontend Task/Social TypeScript check | PASS |
| Marketing DB inventory | PASS, read-only |
| Prisma migration history | BLOCKED — local/database histories diverge |
| Full frontend TypeScript check | BLOCKED by unrelated active ERP edits |

Run the repeatable gate:

```powershell
.\scripts\verify-marketing-phase0.ps1 -SkipDatabase
```

Run the complete preflight, including read-only database checks:

```powershell
.\scripts\verify-marketing-phase0.ps1
```

The complete command intentionally exits non-zero while migration history is
divergent. A non-zero result is a release stop, not a reason to run `db push`.

## Source-of-truth hierarchy

When sources disagree, use this order:

1. Runtime PostgreSQL inventory and migration history for deployed data reality.
2. `backend/prisma/schema/` plus applied migration SQL for the intended data contract.
3. Backend DTO/controller/service behavior and generated OpenAPI for API behavior.
4. `frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx` and
   `VISUAL_DNA.md` for visual behavior.
5. The AI Studio brief for functional coverage only; its localStorage persistence and
   standalone sidebar are not production architecture.
6. Historical planning documents are advisory and must not override current code or DB.

## Stabilization changes

- Added an isolated Jest configuration and scripts for only Task/Social marketing tests.
- Added an isolated frontend TypeScript configuration for Management Task and Social Tracker.
- Changed `db-status.ts` into a genuinely read-only inventory command.
- Fixed server-side task scope filtering so authorization is applied before pagination.
- Added deterministic task ordering and scope-correct totals.
- Fixed canonical member alias resolution, including Zarka → Zarkasi.
- Fixed attachment authorization to load the relations required by the visibility check.
- Moved attachment authorization ahead of quota/file inspection work.

## Database findings

Audited target: local `erp_db_test` only. No staging or production connection URL is
configured under a distinct environment key in this workspace, so those environments
were not contacted.

Observed row counts during the 2026-09-10 audit:

| Entity | Rows |
|---|---:|
| MarketingTask | 73 |
| MarketingTaskHistory | 8 |
| MarketingTaskAttachment | 72 |
| MarketingTaskComment | 65 |
| MarketingProject | 5 |
| SocialPost | 0 |
| SocialChecklistItem | 0 |
| CampaignOkr | 0 |
| MetaAccountConfig | 0 |
| MetaInsightsSnapshot | missing table |

There are 78 users, of which 15 have marketing/admin access.

### Migration blocker

The database and repository share history only through
`20260902220000_omni_crm_and_tasks`. The database contains many applied migrations
that are absent locally, while four local migrations are not recorded as applied.

Do not run any of the following until a reviewed reconciliation plan exists:

- `prisma migrate deploy`
- `prisma migrate reset`
- `prisma db push`
- manual `ALTER TABLE` repair

Required next action for Phase 2 preparation: export the applied migration ledger and
schema-only dump from the actual target environment, recover missing migration files,
compare checksums/DDL, and rehearse reconciliation against a restored disposable copy.

## Isolation from unrelated work

The repository was already dirty before Phase 0. Numerous non-marketing pages and DNA
exports are being changed, including deletion of several compatibility components.
Phase 0 deliberately does not restore, rewrite, commit, stash, or discard those changes.

The full frontend typecheck currently fails in unrelated ERP pages because of malformed
JSX. The scoped Task/Social typecheck is the valid gate for this stream until the other
stream is integrated. A production release still requires the full repository build to
be green.

## Exit criteria

Phase 0 implementation work is complete. Phase 1 may proceed in parallel with migration
reconciliation, but no database migration or production deployment may proceed until:

1. migration history is reconciled on a disposable restored database;
2. the relevant DNA component changes are settled or merged;
3. the full frontend build/typecheck baseline is green;
4. staging and production database targets are explicitly identified and audited read-only.
