-- Rollback / Down migration for 20260918120000_p04_deduplicate_slug_indexes
CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles"("slug");
CREATE INDEX IF NOT EXISTS "website_products_slug_idx" ON "website_products"("slug");
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260918120000_p04_deduplicate_slug_indexes';
