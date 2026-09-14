-- Canonical marketing task workspace requires a stable member profile per user.
-- Expand-only and idempotent: no legacy data is removed or rewritten.

CREATE TABLE IF NOT EXISTS "marketing_team_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "name" VARCHAR(100) NOT NULL,
  "role" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150) NOT NULL,
  "phone" VARCHAR(30),
  "avatarBg" VARCHAR(20) NOT NULL DEFAULT '#e8eef6',
  "initial" VARCHAR(5) NOT NULL,
  "department" VARCHAR(100) NOT NULL DEFAULT 'Digital Marketing',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_team_members_userId_key"
  ON "marketing_team_members"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_team_members_email_key"
  ON "marketing_team_members"("email");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketing_team_members_userId_fkey'
  ) THEN
    ALTER TABLE "marketing_team_members"
      ADD CONSTRAINT "marketing_team_members_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "marketing_team_members" (
  "userId", "name", "role", "email", "initial", "department", "updatedAt"
)
SELECT
  u."id",
  LEFT(COALESCE(NULLIF(TRIM(u."fullName"), ''), split_part(u."email", '@', 1)), 100),
  CASE
    WHEN 'MARKETING' = ANY(u."roles") THEN 'Marketing Manager'
    WHEN 'DIGIMAR' = ANY(u."roles") THEN 'Digital Marketing'
    WHEN 'HEAD_OPS' = ANY(u."roles") THEN 'Head Operations'
    ELSE 'Administrator'
  END,
  LEFT(u."email", 150),
  LEFT(UPPER(COALESCE(NULLIF(SUBSTRING(TRIM(u."fullName") FROM 1 FOR 1), ''), SUBSTRING(u."email" FROM 1 FOR 1))), 5),
  'Digital Marketing',
  CURRENT_TIMESTAMP
FROM "users" u
WHERE u."status" = 'ACTIVE'
  AND u."roles" && ARRAY['SUPER_ADMIN', 'HEAD_OPS', 'MARKETING', 'DIGIMAR']::"UserRole"[]
ON CONFLICT ("userId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "email" = EXCLUDED."email",
  "initial" = EXCLUDED."initial",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
