-- P08: bind a design approval decision to the exact artwork version it decided on.
-- BUS-RULE-110 / DEC-2026-09-20-052. Safe expand only: the column is nullable and
-- legacy feedback rows keep `versionId = NULL` (no guessing which version they saw).

ALTER TABLE "design_feedbacks" ADD COLUMN IF NOT EXISTS "versionId" UUID;

CREATE INDEX IF NOT EXISTS "design_feedbacks_versionId_idx" ON "design_feedbacks" ("versionId");

ALTER TABLE "design_feedbacks" DROP CONSTRAINT IF EXISTS "design_feedbacks_versionId_fkey";
ALTER TABLE "design_feedbacks" ADD CONSTRAINT "design_feedbacks_versionId_fkey"
  FOREIGN KEY ("versionId") REFERENCES "design_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
