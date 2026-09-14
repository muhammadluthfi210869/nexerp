-- Historical bridge: the next migration assigns DIRECTOR before the enum value
-- existed in the checked-in migration chain. Safe on databases already repaired.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTOR';
