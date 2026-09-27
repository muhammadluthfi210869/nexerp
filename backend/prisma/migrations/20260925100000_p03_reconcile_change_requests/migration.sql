-- P03 schema/live-DB reconciliation: create the `change_requests` table.
--
-- Why this migration exists
-- -------------------------
-- `backend/prisma/schema/system.prisma:149` declares `model ChangeRequest`
-- mapped to `change_requests`, and `system.controller.ts` queries it on four
-- live endpoints (`changeRequest.findMany` x2, `.create`, `.update`). But no
-- migration ever created the table, so every one of those endpoints failed at
-- runtime with "relation change_requests does not exist".
--
-- Discovered by G2 (DB live vs Prisma schema diff) on 2026-09-25:
--   24 schema files / 208 models / 207 live tables -> exactly 1 declared model
--   had no backing table. Everything else in `prisma migrate diff` was clean.
--
-- Additive only. The two foreign keys that `prisma migrate diff` also reports
-- (`finished_goods_woId_fkey`, `qc_audits_stepLogId_fkey`) are deliberately NOT
-- restored here: migration 20260923200000_relax_p13_p14_legacy_fks dropped them
-- on purpose so shop-floor WorkOrders and ProductionLogs can link to
-- FinishedGood/QCAudit. Prisma resolves those relations in application code, so
-- dropping the DB constraint does not break the code paths that use them.

CREATE TABLE IF NOT EXISTS "change_requests" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "module" TEXT DEFAULT 'SCM',
    "requestedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);