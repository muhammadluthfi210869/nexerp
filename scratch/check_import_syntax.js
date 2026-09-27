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
const defaultImports = [];
const namedImports = [];

for (const file of files) {
  const norm = file.replace(/\\/g, '/');
  if (norm.includes('/components/dna') || norm.includes('/components/ui')) {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('@/components/ui/')) {
      if (/import\s+([A-Za-z0-9_]+)\s+from\s+['"]@\/components\/ui\//.test(line)) {
        defaultImports.push({ file: norm.replace(/.*frontend\/src\//, ''), line: i + 1, text: line.trim() });
      } else {
        namedImports.push({ file: norm.replace(/.*frontend\/src\//, ''), line: i + 1, text: line.trim() });
      }
    }
  }
}

console.log('Default imports count:', defaultImports.length);
if (defaultImports.length > 0) {
  console.log('Default imports:', defaultImports);
}
console.log('Named imports count:', namedImports.length);
