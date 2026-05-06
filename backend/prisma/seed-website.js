const { Client } = require('pg');
const fs = require('fs');
const { JSDOM } = require('jsdom');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

/**
 * Sanitizes HTML by removing Elementor/WP bloat and keeping only semantic tags.
 * JS version for standalone execution.
 */
function sanitizeHtml(html) {
  if (!html) return '';
  
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const allowedTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'A', 'IMG', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'];

  function processNode(node) {
    if (node.nodeType === 1) { // Element
      const el = node;
      
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        if (el.tagName === 'A' && attrName === 'href') continue;
        if (el.tagName === 'IMG' && (attrName === 'src' || attrName === 'alt' || attrName === 'title')) continue;
        el.removeAttribute(attr.name);
      }

      if (!allowedTags.includes(el.tagName)) {
        while (el.firstChild) {
          el.parentNode.insertBefore(el.firstChild, el);
        }
        el.parentNode.removeChild(el);
      } else {
        const children = Array.from(el.childNodes);
        children.forEach(processNode);
      }
    } else if (node.nodeType === 3) {
      // Keep text
    } else {
      if (node.parentNode) node.parentNode.removeChild(node);
    }
  }

  const bodyNodes = Array.from(doc.body.childNodes);
  bodyNodes.forEach(processNode);
  
  let cleanHtml = doc.body.innerHTML;
  cleanHtml = cleanHtml.replace(/<[^\/>][^>]*><\/[^>]+>/g, '');
  cleanHtml = cleanHtml.replace(/\s+/g, ' ').trim();
  
  return cleanHtml;
}

async function main() {
  const filePath = 'c:/Users/Luthfi/Downloads/well-known/artikel_epage.json';
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  console.log('📖 Reading JSON data...');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);

  const queryKey = Object.keys(jsonData)[0];
  const items = jsonData[queryKey];

  console.log(`🚀 Starting raw ingestion of ${items.length} items...`);

  await client.connect();

  let count = 0;
  for (const item of items) {
    const slug = item.url_slug;
    if (!slug) continue;

    const cleanContent = sanitizeHtml(item.konten_mentah || '');
    const metaDesc = (item.yoast_seo_desc || item.rankmath_seo_desc || '').substring(0, 255);
    const pubDate = item.tanggal_publish ? new Date(item.tanggal_publish) : new Date();

    try {
      await client.query(`
        INSERT INTO articles (title, slug, content, "publishedAt", "metaDescription", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          "metaDescription" = EXCLUDED."metaDescription",
          "publishedAt" = EXCLUDED."publishedAt",
          "updatedAt" = NOW()
      `, [item.judul_artikel || 'Untitled', slug, cleanContent, pubDate, metaDesc]);

      count++;
      if (count % 10 === 0) console.log(`✅ Progress: ${count}/${items.length} items...`);
    } catch (err) {
      console.error(`❌ Error inserting slug [${slug}]:`, err.message);
    }
  }

  console.log(`\n💎 SUCCESS: ${count} items ingested via Raw SQL.`);
  await client.end();
}

main().catch(err => console.error(err));
