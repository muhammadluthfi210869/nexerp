import fs from "fs";
import path from "path";

const APP_DIR = path.resolve("src/app/(dashboard)");

function walk(dir, cb) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules" && ent.name !== ".next") {
      walk(p, cb);
    } else if (ent.isFile() && (ent.name.endsWith(".tsx") || ent.name.endsWith(".jsx"))) {
      cb(p);
    }
  }
}

const rawTableFiles = [];
const fakeDnaFiles = [];
const threeDataFiles = [];
const monoFiles = [];

walk(APP_DIR, (fp) => {
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");
  // Kecualikan dashboard
  if (
    rel.includes("/dashboard/") ||
    rel.includes("Dashboard") ||
    rel.endsWith("/dashboard/page.tsx")
  ) {
    return;
  }

  const code = fs.readFileSync(fp, "utf-8");
  const hasRawTable = /<table\b/i.test(code);
  const hasDnaTable = code.includes("DnaTable");

  if (hasRawTable && !hasDnaTable) {
    rawTableFiles.push(rel);
  }
  if ((code.includes("DnaDataTableCard") || code.includes("DnaDataTable")) && hasRawTable) {
    fakeDnaFiles.push(rel);
  }
  if (
    /<(td|DnaTd)[^>]*>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<\/(td|DnaTd)>/i.test(code) ||
    /render:\s*\([^)]*\)\s*=>\s*\(?[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>/i.test(code)
  ) {
    threeDataFiles.push(rel);
  }
  if (/\bfont-mono\b/.test(code) && (hasRawTable || hasDnaTable)) {
    monoFiles.push(rel);
  }
});

console.log("=== NON-DASHBOARD INVENTORY ===");
console.log("1. Raw Table files (no DnaTable):", rawTableFiles.length);
console.log("2. Fake DNA files (DnaCard with raw table):", fakeDnaFiles.length);
console.log("3. 1 Column 3 Data files:", threeDataFiles.length);
console.log("4. font-mono in tables:", monoFiles.length);

console.log("\n--- RAW TABLE FILES (first 20) ---");
console.log(rawTableFiles.slice(0, 20));

console.log("\n--- FAKE DNA FILES (all) ---");
console.log(fakeDnaFiles);

console.log("\n--- 1 COL 3 DATA FILES (all) ---");
console.log(threeDataFiles);
