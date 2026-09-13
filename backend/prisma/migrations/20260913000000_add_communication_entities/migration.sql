-- Wave 3/D1 — Communication Protocol backend.
--
-- Four new tables (threads / replies / mentions / attachments) + ThreadStatus
-- enum. Idempotent: every CREATE wrapped in DO blocks / IF NOT EXISTS so
-- re-applying is a no-op. Out-of-scope drift (legacy columns, missing FKs in
-- other tables) intentionally NOT touched.

-- 0. Enum (must exist before tables that reference it)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThreadStatus') THEN
    CREATE TYPE "ThreadStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');
  END IF;
END $$;

-- 1. communication_threads
CREATE TABLE IF NOT EXISTS "communication_threads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "contextType" TEXT NOT NULL,
  "contextId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "ThreadStatus" NOT NULL DEFAULT 'OPEN',
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_threads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "communication_threads_contextType_contextId_idx"
  ON "communication_threads"("contextType", "contextId");
CREATE INDEX IF NOT EXISTS "communication_threads_status_updatedAt_idx"
  ON "communication_threads"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "communication_threads_createdById_idx"
  ON "communication_threads"("createdById");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_threads_createdById_fkey'
  ) THEN
    ALTER TABLE "communication_threads"
      ADD CONSTRAINT "communication_threads_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 2. communication_thread_replies
CREATE TABLE IF NOT EXISTS "communication_thread_replies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "threadId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "parentReplyId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_thread_replies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "communication_thread_replies_threadId_createdAt_idx"
  ON "communication_thread_replies"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "communication_thread_replies_authorId_idx"
  ON "communication_thread_replies"("authorId");
CREATE INDEX IF NOT EXISTS "communication_thread_replies_parentReplyId_idx"
  ON "communication_thread_replies"("parentReplyId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_thread_replies_threadId_fkey'
  ) THEN
    ALTER TABLE "communication_thread_replies"
      ADD CONSTRAINT "communication_thread_replies_threadId_fkey"
      FOREIGN KEY ("threadId") REFERENCES "communication_threads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_thread_replies_authorId_fkey'
  ) THEN
    ALTER TABLE "communication_thread_replies"
      ADD CONSTRAINT "communication_thread_replies_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_thread_replies_parentReplyId_fkey'
  ) THEN
    ALTER TABLE "communication_thread_replies"
      ADD CONSTRAINT "communication_thread_replies_parentReplyId_fkey"
      FOREIGN KEY ("parentReplyId") REFERENCES "communication_thread_replies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. communication_mentions
CREATE TABLE IF NOT EXISTS "communication_mentions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "replyId" UUID NOT NULL,
  "mentionedUserId" UUID NOT NULL,
  "notifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "communication_mentions_replyId_mentionedUserId_key"
  ON "communication_mentions"("replyId", "mentionedUserId");
CREATE INDEX IF NOT EXISTS "communication_mentions_mentionedUserId_notifiedAt_idx"
  ON "communication_mentions"("mentionedUserId", "notifiedAt");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_mentions_replyId_fkey'
  ) THEN
    ALTER TABLE "communication_mentions"
      ADD CONSTRAINT "communication_mentions_replyId_fkey"
      FOREIGN KEY ("replyId") REFERENCES "communication_thread_replies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_mentions_mentionedUserId_fkey'
  ) THEN
    ALTER TABLE "communication_mentions"
      ADD CONSTRAINT "communication_mentions_mentionedUserId_fkey"
      FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. communication_attachments
CREATE TABLE IF NOT EXISTS "communication_attachments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "threadId" UUID,
  "replyId" UUID,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "uploadedById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id"),
  -- Exactly one of threadId / replyId must be set.
  CONSTRAINT "communication_attachments_target_chk"
    CHECK (("threadId" IS NOT NULL AND "replyId" IS NULL)
        OR ("threadId" IS NULL AND "replyId" IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS "communication_attachments_threadId_idx"
  ON "communication_attachments"("threadId");
CREATE INDEX IF NOT EXISTS "communication_attachments_replyId_idx"
  ON "communication_attachments"("replyId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_attachments_threadId_fkey'
  ) THEN
    ALTER TABLE "communication_attachments"
      ADD CONSTRAINT "communication_attachments_threadId_fkey"
      FOREIGN KEY ("threadId") REFERENCES "communication_threads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_attachments_replyId_fkey'
  ) THEN
    ALTER TABLE "communication_attachments"
      ADD CONSTRAINT "communication_attachments_replyId_fkey"
      FOREIGN KEY ("replyId") REFERENCES "communication_thread_replies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_attachments_uploadedById_fkey'
  ) THEN
    ALTER TABLE "communication_attachments"
      ADD CONSTRAINT "communication_attachments_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
