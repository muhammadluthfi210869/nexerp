const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to database for media URL refactoring...");

    // 1. Define replacement patterns
    // We want to change 'https://dreamlab.id/wp-content/uploads/' to '/uploads/'
    const oldBase = 'https://dreamlab.id/wp-content/uploads/';
    const oldBaseNonHttps = 'http://dreamlab.id/wp-content/uploads/';
    const newBase = '/uploads/';

    console.log(`🔄 Refactoring Article content...`);
    
    // Update Articles
    const resArticles = await client.query(`
      UPDATE articles 
      SET content = REPLACE(
        REPLACE(content, $1, $3), 
        $2, $3
      )
      WHERE content LIKE '%' || $1 || '%' OR content LIKE '%' || $2 || '%'
      RETURNING id
    `, [oldBase, oldBaseNonHttps, newBase]);

    console.log(`✅ Updated ${resArticles.rowCount} articles.`);

    // Update Website Products (if any)
    const resProducts = await client.query(`
      UPDATE website_products 
      SET content = REPLACE(
        REPLACE(content, $1, $3), 
        $2, $3
      )
      WHERE content LIKE '%' || $1 || '%' OR content LIKE '%' || $2 || '%'
      RETURNING id
    `, [oldBase, oldBaseNonHttps, newBase]);

    console.log(`✅ Updated ${resProducts.rowCount} products.`);

    console.log("\n💎 Media URL migration complete.");
    console.log("NOTE: You must move your 'wp-content/uploads' content to 'frontend/public/uploads' for these images to load.");

  } catch (err) {
    console.error("❌ Error fixing media URLs:", err);
  } finally {
    await client.end();
  }
}

main();
