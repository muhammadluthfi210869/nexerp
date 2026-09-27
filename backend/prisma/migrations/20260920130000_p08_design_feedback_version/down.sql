ALTER TABLE "design_feedbacks" DROP CONSTRAINT IF EXISTS "design_feedbacks_versionId_fkey";
DROP INDEX IF EXISTS "design_feedbacks_versionId_idx";
ALTER TABLE "design_feedbacks" DROP COLUMN IF EXISTS "versionId";
