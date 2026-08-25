ALTER TABLE "journal_entries" ADD COLUMN "fundRequestId" UUID;
ALTER TABLE "journal_entries" ADD COLUMN "sourceEntityType" TEXT;
ALTER TABLE "journal_entries" ADD COLUMN "sourceEntityId" TEXT;
ALTER TABLE "journal_entries" ADD COLUMN "category" TEXT;
ALTER TABLE "journal_entries" ADD COLUMN "direction" TEXT;

CREATE UNIQUE INDEX "journal_entries_fundRequestId_key" ON "journal_entries"("fundRequestId");
ALTER TABLE "journal_entries"
  ADD CONSTRAINT "journal_entries_fundRequestId_fkey"
  FOREIGN KEY ("fundRequestId") REFERENCES "fund_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
