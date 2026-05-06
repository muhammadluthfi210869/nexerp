import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

/**
 * Sanitizes HTML by removing Elementor/WP bloat and keeping only semantic tags.
 * Follows the "Clean on Entry" principle for enterprise architecture.
 */
function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // List of tags to keep (Semantic HTML)
  const allowedTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'A', 'IMG', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'];

  function processNode(node: Node) {
    if (node.nodeType === 1) { // Element
      const el = node as HTMLElement;
      
      // 1. Remove all attributes except essential ones for SEO and functionality
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        if (el.tagName === 'A' && attrName === 'href') continue;
        if (el.tagName === 'IMG' && (attrName === 'src' || attrName === 'alt' || attrName === 'title')) continue;
        el.removeAttribute(attr.name);
      }

      // 2. Handle Tag Sanitization
      if (!allowedTags.includes(el.tagName)) {
        // If tag is not allowed, unwrap its children into the parent
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.parentNode?.removeChild(el);
      } else {
        // Recursively process children of allowed tags
        const children = Array.from(el.childNodes);
        children.forEach(processNode);
      }
    } else if (node.nodeType === 3) { // Text Node
      // Keep text nodes as they are
    } else {
      // Remove other types (comments, etc)
      node.parentNode?.removeChild(node);
    }
  }

  // Process all children of the body
  const bodyNodes = Array.from(doc.body.childNodes);
  bodyNodes.forEach(processNode);
  
  // 3. Final String Cleanup
  let cleanHtml = doc.body.innerHTML;
  
  // Remove empty tags (e.g., <p></p>) that often come from WP whitespace
  cleanHtml = cleanHtml.replace(/<[^\/>][^>]*><\/[^>]+>/g, '');
  
  // Collapse excessive whitespace/newlines into a single space
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

  // The JSON key is the full SQL query string
  const queryKey = Object.keys(jsonData)[0];
  const items = jsonData[queryKey];

  console.log(`🚀 Starting ingestion of ${items.length} items...`);

  let count = 0;
  for (const item of items) {
    const slug = item.url_slug;
    if (!slug) continue;

    const cleanContent = sanitizeHtml(item.konten_mentah || '');
    const metaDesc = (item.yoast_seo_desc || item.rankmath_seo_desc || '').substring(0, 255);

    try {
      await prisma.article.upsert({
        where: { slug: slug },
        update: {
          title: item.judul_artikel || 'Untitled',
          content: cleanContent,
          metaDescription: metaDesc,
          publishedAt: item.tanggal_publish ? new Date(item.tanggal_publish) : new Date(),
        },
        create: {
          title: item.judul_artikel || 'Untitled',
          slug: slug,
          content: cleanContent,
          metaDescription: metaDesc,
          publishedAt: item.tanggal_publish ? new Date(item.tanggal_publish) : new Date(),
        },
      });
      count++;
      if (count % 10 === 0) console.log(`✅ Progress: ${count}/${items.length} items...`);
    } catch (err) {
      console.error(`❌ Error upserting slug [${slug}]:`, err);
    }
  }

  console.log(`\n💎 SUCCESS: ${count} items ingested and sanitized.`);
  console.log('🌟 Architecture: Pure HTML generated, Elementor debt cleared.');
}

main()
  .catch((e) => {
    console.error('💥 Fatal Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
