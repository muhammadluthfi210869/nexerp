-- Preserve the migration already recorded in the production database.
-- Adds round-robin agent identity to captured leads.
ALTER TABLE lead_captures
  ADD COLUMN IF NOT EXISTS "assignedName" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "assignedPhone" VARCHAR(20);
