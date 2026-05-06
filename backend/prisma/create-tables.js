const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public"
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to database");
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE TABLE IF NOT EXISTS "articles" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "metaDescription" VARCHAR(255),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug");

      CREATE TABLE IF NOT EXISTS "website_products" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "metaDescription" VARCHAR(255),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "website_products_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "website_products_slug_key" ON "website_products"("slug");

      CREATE TABLE IF NOT EXISTS "redirects" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "source" TEXT NOT NULL,
          "destination" TEXT NOT NULL,
          "statusCode" INTEGER NOT NULL DEFAULT 301,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "redirects_source_key" ON "redirects"("source");
    `);
    console.log("✅ Website tables created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  } finally {
    await client.end();
  }
}
main();
