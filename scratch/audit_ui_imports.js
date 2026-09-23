const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!['node_modules', '.next', 'dist'].includes(f)) {
        res = res.concat(walk(p));
      }
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      res.push(p);
    }
  }
  return res;
}

const files = walk(path.resolve('frontend/src'));
const importMap = new Map();
const fileList = [];

for (const file of files) {
  const norm = file.replace(/\\/g, '/');
  if (norm.includes('/components/dna') || norm.includes('/components/ui')) {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/from ['"]@\/components\/ui\/([a-zA-Z0-9_-]+)['"]/g)];
  if (matches.length > 0) {
    fileList.push({ file: norm, count: matches.length, imports: matches.map(m => m[1]) });
    for (const m of matches) {
      const comp = m[1];
      importMap.set(comp, (importMap.get(comp) || 0) + 1);
    }
  }
}

console.log('Total violating files:', fileList.length);
console.log('Import occurrences by component:', JSON.stringify(Object.fromEntries(importMap), null, 2));
console.log('\nTop 15 files with most UI imports:');
fileList.sort((a, b) => b.count - a.count);
for (const item of fileList.slice(0, 15)) {
  console.log(`- ${item.file.replace(/.*frontend\/src\//, '')} (${item.count}): ${item.imports.join(', ')}`);
}
