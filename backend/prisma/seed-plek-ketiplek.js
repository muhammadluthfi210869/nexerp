const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

/**
 * NO SANITIZATION - PLEK KETIPLEK MODE
 * We keep all classes, IDs, and attributes to preserve marketing CRO & Layout.
 */
function preserveRawHtml(html) {
  if (!html) return '';
  // We only do absolute minimum cleanup (fixing image URLs that we already refactored)
  let raw = html;
  raw = raw.replace(/https:\/\/dreamlab\.id\/wp-content\/uploads\//g, '/wp-content/uploads/');
  raw = raw.replace(/http:\/\/dreamlab\.id\/wp-content\/uploads\//g, '/wp-content/uploads/');
  return raw;
}

async function main() {
  const filePath = 'c:/Users/Luthfi/Downloads/well-known/artikel_epage.json';
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  console.log('📖 Reading JSON data for Raw Restoration...');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);

  const queryKey = Object.keys(jsonData)[0];
  const items = jsonData[queryKey];

  console.log(`🚀 Starting RAW ingestion of ${items.length} items (Plek Ketiplek Mode)...`);

  await client.connect();

  // Clear existing articles to avoid duplicates or mixed data
  console.log('🗑️ Clearing existing articles for fresh restoration...');
  await client.query('TRUNCATE TABLE articles CASCADE');

  let count = 0;
  for (const item of items) {
    const slug = item.url_slug;
    if (!slug) continue;

    // PRESERVE RAW HTML FOR CRO INTEGRITY
    const rawContent = preserveRawHtml(item.konten_mentah || '');
    const metaDesc = (item.yoast_seo_desc || item.rankmath_seo_desc || '').substring(0, 255);
    const pubDate = item.tanggal_publish ? new Date(item.tanggal_publish) : new Date();

    const id = crypto.randomUUID();
    try {
      await client.query(`
        INSERT INTO articles (id, title, slug, content, "publishedAt", "metaDescription", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          "metaDescription" = EXCLUDED."metaDescription",
          "publishedAt" = EXCLUDED."publishedAt",
          "updatedAt" = NOW()
      `, [id, item.judul_artikel || 'Untitled', slug, rawContent, pubDate, metaDesc]);

      count++;
      if (count % 20 === 0) console.log(`✅ Progress: ${count}/${items.length} items restored...`);
    } catch (err) {
      console.error(`❌ Error restoring slug [${slug}]:`, err.message);
    }
  }

  console.log(`\n💎 SUCCESS: ${count} items restored in RAW format.`);
  await client.end();
}

main().catch(err => console.error(err));
