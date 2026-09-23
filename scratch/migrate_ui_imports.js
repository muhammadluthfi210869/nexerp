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
let modifiedCount = 0;
const modifiedFiles = [];

for (const file of files) {
  const norm = file.replace(/\\/g, '/');
  if (norm.includes('/components/dna') || norm.includes('/components/ui')) {
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  if (/from ['"]@\/components\/ui\/[a-zA-Z0-9_-]+['"]/.test(content)) {
    const newContent = content.replace(/from ['"]@\/components\/ui\/[a-zA-Z0-9_-]+['"]/g, 'from "@/components/dna"');
    fs.writeFileSync(file, newContent, 'utf8');
    modifiedCount++;
    modifiedFiles.push(norm.replace(/.*frontend\/src\//, ''));
  }
}

console.log(`Successfully migrated ${modifiedCount} files to @/components/dna!`);
console.log('Sample migrated files:', modifiedFiles.slice(0, 10));
