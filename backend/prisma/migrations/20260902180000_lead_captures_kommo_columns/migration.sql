-- Add kommo* columns to lead_captures (declared in schema/marketing.prisma but not yet migrated)
ALTER TABLE "lead_captures"
  ADD COLUMN IF NOT EXISTS "kommoLeadId"              INTEGER,
  ADD COLUMN IF NOT EXISTS "kommoResponsibleUserId"   INTEGER,
  ADD COLUMN IF NOT EXISTS "kommoResponsibleUserName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "kommoPipelineId"          INTEGER,
  ADD COLUMN IF NOT EXISTS "kommoPipelineName"        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "kommoStatusId"            INTEGER,
  ADD COLUMN IF NOT EXISTS "kommoStatusName"          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "kommoSourceName"          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "kommoTags"                TEXT;
