-- Drop legacy foreign key constraints that prevent shop-floor WorkOrders and ProductionLogs from linking with FinishedGood and QCAudit
ALTER TABLE "qc_audits" DROP CONSTRAINT IF EXISTS "qc_audits_stepLogId_fkey";
ALTER TABLE "finished_goods" DROP CONSTRAINT IF EXISTS "finished_goods_woId_fkey";
