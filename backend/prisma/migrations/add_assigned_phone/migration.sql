-- Add assignedName and assignedPhone columns to lead_captures table
-- for tracking which round-robin agent was assigned to each lead
ALTER TABLE lead_captures
  ADD COLUMN IF NOT EXISTS "assignedName" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "assignedPhone" VARCHAR(20);
