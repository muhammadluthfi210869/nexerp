const fs = require('fs');
const html = fs.readFileSync('warehouse_access_manage.html', 'utf8');
// Find all checkboxes with name attr
const re = /<input\b([^>]*?type=["']checkbox["'][^>]*?)>/gi;
let m;
const boxes = [];
while ((m = re.exec(html)) !== null) {
  const a = m[1];
  const name = (a.match(/\bname=["']([^"']+)["']/) || [])[1];
  const value = (a.match(/\bvalue=["']([^"']*)["']/) || [])[1];
  const id = (a.match(/\bid=["']([^"']+)["']/) || [])[1];
  const checked = /\bchecked\b/i.test(a);
  if (name) boxes.push({ name, value, id, checked });
}
console.log('Total checkboxes:', boxes.length);
console.log('Unique names:', [...new Set(boxes.map(b => b.name))]);
console.log('First 5 boxes:');
console.log(boxes.slice(0, 5));

// Also check if any select dropdowns
const selRe = /<select\b([^>]*name=["'][^"']+["'][^>]*?)>([\s\S]*?)<\/select>/gi;
let sm;
const sels = [];
while ((sm = selRe.exec(html)) !== null) {
  const name = (sm[1].match(/\bname=["']([^"']+)["']/) || [])[1];
  sels.push(name);
}
console.log('\nSelects:', sels);
