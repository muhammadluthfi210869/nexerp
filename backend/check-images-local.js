const { Client } = require('pg');

async function checkImages() {
  const client = new Client({
    connectionString: "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public"
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, title, content FROM articles WHERE content LIKE '%wp-content/uploads%' LIMIT 5");
    
    console.log(`Found ${res.rows.length} articles with legacy images.\n`);
    
    res.rows.forEach(row => {
      console.log(`Article: ${row.title}`);
      const matches = row.content.match(/src="([^"]+wp-content\/uploads[^"]+)"/g);
      if (matches) {
        console.log(`- Sample URLs:`);
        matches.slice(0, 3).forEach(m => console.log(`  ${m}`));
      } else {
        console.log(`- No src matches found in content.`);
      }
      console.log('---');
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkImages();
