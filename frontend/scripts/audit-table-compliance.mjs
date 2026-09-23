import fs from "fs";
import path from "path";

const APP_DIR = path.resolve("src/app");

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "__tests__") {
        walkDir(fullPath, callback);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
      callback(fullPath);
    }
  }
}

let totalPages = 0;
let rawTableCount = 0;
let dnaDataTableCount = 0;
let dnaTableCount = 0;
let fontMonoCount = 0;

const rawTableFiles = [];
const fontMonoFiles = [];
const compliantDnaFiles = [];

walkDir(APP_DIR, (filePath) => {
  totalPages++;
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");

  const hasRawTable = /<table\b/i.test(content) && !/DnaTable/.test(content);
  const hasDnaDataTable = /DnaDataTable/.test(content);
  const hasDnaTable = /DnaTable\b/.test(content) || /ApprovalPageShell/.test(content);
  const hasFontMono = /\bfont-mono\b/.test(content);

  if (hasRawTable) {
    rawTableCount++;
    rawTableFiles.push(relPath);
  }

  if (hasDnaDataTable || hasDnaTable) {
    if (hasDnaDataTable) dnaDataTableCount++;
    if (hasDnaTable) dnaTableCount++;
    compliantDnaFiles.push(relPath);
  }

  if (hasFontMono) {
    fontMonoCount++;
    fontMonoFiles.push(relPath);
  }
});

console.log("=================================================");
console.log("       NEX ERP — TABLE COMPLIANCE AUDIT REPORT   ");
console.log("=================================================");
console.log(`Total Halaman UI Discan      : ${totalPages}`);
console.log(`Halaman Mengadopsi DNA Table : ${compliantDnaFiles.length} (${Math.round((compliantDnaFiles.length / totalPages) * 100)}%)`);
console.log(`  - Memakai <DnaDataTable>   : ${dnaDataTableCount}`);
console.log(`  - Memakai <DnaTable/Shell> : ${dnaTableCount}`);
console.log(`Halaman Masih Raw <table>    : ${rawTableCount}`);
console.log(`Halaman Berisi 'font-mono'   : ${fontMonoCount}`);
console.log("=================================================");

if (rawTableFiles.length > 0) {
  console.log("\n[Sample Halaman Raw <table> yang Perlu Dimigrasikan]:");
  rawTableFiles.slice(0, 10).forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
}

if (fontMonoFiles.length > 0) {
  console.log("\n[Sample Halaman Mengandung 'font-mono' (Beresiko Courier)]: ");
  fontMonoFiles.slice(0, 10).forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
}
