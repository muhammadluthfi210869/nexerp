-- Fase 2 — index the ledger's foreign keys, and reclassify two misgrouped accounts.
--
-- Why this migration exists
-- -------------------------
-- Measured against the live database on 2026-09-26:
--
--   journal_entries  → 1 index (the primary key). All 11 source-document columns
--                      (`soId`, `poId`, `paymentId`, `adjustmentId`, `returnId`,
--                      `purchaseReturnId`, `planId`, `requisitionId`, `invoiceId`,
--                      `billId`, `salesInvoiceId`) are foreign keys with a real
--                      relation and no index.
--   journal_lines    → 1 index (the primary key). `journalId` and `accountId`
--                      unindexed, which is the join every trial-balance and
--                      general-ledger query performs.
--   accounts         → primary key + `code` unique. `parentId` unindexed, so the
--                      account tree walk is a scan.
--
-- PostgreSQL does not index the referencing side of a foreign key. The cost is
-- invisible at 35 journal entries and becomes a full scan of the ledger per
-- document at production volume, when the reports that are supposed to justify
-- the numbers are the ones that slow down.
--
-- Second change in this file: `accounts.reportGroup`. `1103 Piutang Usaha` and
-- `1151 Persediaan Barang` are both `type = ASSET` but carried
-- `reportGroup = OTHER_EXPENSE`, because `reportGroup` defaults to
-- `OTHER_EXPENSE` in the Prisma schema. `getProfitLoss` routes accounts by
-- `reportGroup`, so a receivable and an inventory account were addressable as
-- expenses. They are set to `CURRENT_ASSET`, which is what their `type` says.
--
-- Idempotency
-- -----------
-- `CREATE INDEX IF NOT EXISTS` throughout. `migrate deploy` is the container boot
-- path (`backend/init-db.sh`) and the live database was shaped by `db push`, so
-- this must be a safe no-op on a database that already has the indexes.
--
-- Deliberately NOT in this file
-- -----------------------------
-- 1. `onDelete` policies. 305 of the 375 relations declare none. Rewriting them
--    wholesale is a data-loss change, not an integrity one — a cascade added to
--    the wrong relation deletes rows nobody asked to delete. `journal_lines` →
--    `journal_entries` already cascades, which is the one that matters here.
-- 2. Consolidating the three competing charts of accounts (the 4-digit regime,
--    the 5-digit `(P15)` regime, and the frontend's own `lib/coa-utils.ts` map).
--    That changes which account a figure lands on, so it is a decision with an
--    owner, not a migration. Recorded as a follow-up in the Fase 2 gate report.
-- 3. The duplicate account pairs (1200/1201, 1303/1304, 1401/1402, 1501/1502,
--    2201/2202, 4101/4102) and the 55 accounts no code references. Deleting an
--    account that holds a balance destroys history; the duplicates are left in
--    place until the canonical regime is chosen.

-- ── journal_entries: the 11 source-document foreign keys ────────────────────
CREATE INDEX IF NOT EXISTS "journal_entries_soId_idx"             ON "journal_entries" ("soId");
CREATE INDEX IF NOT EXISTS "journal_entries_poId_idx"             ON "journal_entries" ("poId");
CREATE INDEX IF NOT EXISTS "journal_entries_paymentId_idx"        ON "journal_entries" ("paymentId");
CREATE INDEX IF NOT EXISTS "journal_entries_adjustmentId_idx"     ON "journal_entries" ("adjustmentId");
CREATE INDEX IF NOT EXISTS "journal_entries_returnId_idx"         ON "journal_entries" ("returnId");
CREATE INDEX IF NOT EXISTS "journal_entries_purchaseReturnId_idx" ON "journal_entries" ("purchaseReturnId");
CREATE INDEX IF NOT EXISTS "journal_entries_planId_idx"           ON "journal_entries" ("planId");
CREATE INDEX IF NOT EXISTS "journal_entries_requisitionId_idx"    ON "journal_entries" ("requisitionId");
CREATE INDEX IF NOT EXISTS "journal_entries_invoiceId_idx"        ON "journal_entries" ("invoiceId");
CREATE INDEX IF NOT EXISTS "journal_entries_billId_idx"           ON "journal_entries" ("billId");
CREATE INDEX IF NOT EXISTS "journal_entries_salesInvoiceId_idx"   ON "journal_entries" ("salesInvoiceId");

-- ── journal_lines: the trial-balance and ledger join ────────────────────────
CREATE INDEX IF NOT EXISTS "journal_lines_journalId_idx"    ON "journal_lines" ("journalId");
CREATE INDEX IF NOT EXISTS "journal_lines_accountId_idx"    ON "journal_lines" ("accountId");
CREATE INDEX IF NOT EXISTS "journal_lines_taxAccountId_idx" ON "journal_lines" ("taxAccountId");

-- ── accounts: tree walking ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "accounts_parentId_idx" ON "accounts" ("parentId");

-- ── accounts: two assets that were addressable as expenses ──────────────────
-- Guarded by `type = 'ASSET'` so this cannot silently reclassify an account that
-- has since been changed to something else. Only rows still carrying the
-- default value are touched, so an operator's deliberate choice is preserved.
UPDATE "accounts"
   SET "reportGroup" = 'CURRENT_ASSET'
 WHERE "code" IN ('1103', '1151')
   AND "type" = 'ASSET'
   AND "reportGroup" = 'OTHER_EXPENSE';

-- ── accounts: the one posting account that genuinely does not exist ─────────
-- `finance.service.ts` resolves `6224` for bank administration fees and fell
-- through to `8100 Beban Lain-lain`. One expense account is enough for the
-- ledger to be readable but not enough to be analysable: every bank charge is
-- indistinguishable from every other sundry expense.
--
-- This is the only account this migration creates. The other codes the posting
-- code referenced (`1121`, `1120`, `1153`, `1154`, `1157`) are deliberately NOT
-- created — for each of them an account with the right meaning already exists
-- (`1110`, `1302`, `1303`), and adding a parallel one would split the balance
-- across two rows that no report can tell apart. Those chains were repointed at
-- the existing accounts in the same change.
--
-- `gen_random_uuid()` because the `id` column has no database default: Prisma
-- generates the UUID client-side, so a SQL insert must supply its own.
INSERT INTO "accounts" ("id", "code", "name", "isActive", "allowManualJournal",
                        "type", "normalBalance", "reportGroup")
SELECT gen_random_uuid(), '6224', 'Beban Administrasi Bank', true, true,
       'EXPENSE', 'DEBIT', 'OPEX'
 WHERE NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = '6224');
