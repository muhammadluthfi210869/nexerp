import fs from "fs";
import path from "path";

const APP_DIR = path.resolve("src/app");

function walk(dir, cb) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules" && ent.name !== ".next" && ent.name !== "__tests__") {
      walk(p, cb);
    } else if (ent.isFile() && (ent.name.endsWith(".tsx") || ent.name.endsWith(".jsx"))) {
      cb(p);
    }
  }
}

const stats = {
  rawTable: [],
  rawButtonInTable: [],
  inlineStyle: [],
  hexColors: [],
  fontMono: [],
  threeDataCells: [],
  fakeDnaAdoption: [],
  radixDirectImports: [],
  shadcnDirectImports: []
};

walk(APP_DIR, (fp) => {
  const code = fs.readFileSync(fp, "utf-8");
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");

  // 1. Raw Table without DnaTable
  if (/<table\b/i.test(code) && !code.includes("DnaTable")) {
    stats.rawTable.push(rel);
  }

  // 2. Fake DNA adoption: imports DnaDataTableCard or DnaDataTable but embeds raw <table> inside
  if ((code.includes("DnaDataTableCard") || code.includes("DnaDataTable")) && /<table\b/i.test(code) && !code.includes("<DnaTable")) {
    stats.fakeDnaAdoption.push(rel);
  }

  // 3. 1 Column 3 Data heuristic: e.g. <p>...</p><p>...</p><p>...</p> inside a render cell or table cell
  if (/<(td|DnaTd)[^>]*>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<\/(td|DnaTd)>/i.test(code) ||
      /render:\s*\([^)]*\)\s*=>\s*\(?[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>/i.test(code)) {
    stats.threeDataCells.push(rel);
  }

  // 4. font-mono in app
  if (/\bfont-mono\b/.test(code)) {
    stats.fontMono.push(rel);
  }

  // 5. Raw interactive elements in table/list pages
  if (/<button\b/i.test(code) && (code.includes("table") || code.includes("Table"))) {
    stats.rawButtonInTable.push(rel);
  }

  // 6. Hardcoded hex colors
  if (/#[0-9a-fA-F]{3,8}\b/.test(code) && !code.includes("chart") && !code.includes("bg-[#F8FAFC]")) {
    stats.hexColors.push(rel);
  }

  // 7. Direct radix or shadcn imports (actual ES imports, ignoring comments)
  if (/(from\s+['"]@radix-ui\/|import\s+['"]@radix-ui\/)/.test(code)) {
    stats.radixDirectImports.push(rel);
  }
  if (/(from\s+['"]@\/components\/ui\/|import\s+['"]@\/components\/ui\/)/.test(code)) {
    stats.shadcnDirectImports.push(rel);
  }
});

console.log("================================================================");
console.log("             DEVIL'S ADVOCATE BRUTAL AUDIT REPORT               ");
console.log("================================================================");
console.log("1. Halaman RAW <table> murni (Tanpa DnaTable sama sekali)      :", stats.rawTable.length);
console.log("2. Halaman FAKE DNA (Pakai Card DNA tapi dalamnya <table> liar) :", stats.fakeDnaAdoption.length);
console.log("3. Halaman terdeteksi '1 KOLOM 3 DATA' (Pola tumpukan 3 paragraf):", stats.threeDataCells.length);
console.log("4. Halaman yang masih pakai 'font-mono' (Beresiko font Courier) :", stats.fontMono.length);
console.log("5. Halaman tabel yang masih menyusupkan raw <button> manual    :", stats.rawButtonInTable.length);
console.log("6. Halaman dengan hardcoded #HEX color (Bypass semantic token) :", stats.hexColors.length);
console.log("7. Halaman yang membocorkan import langsung @/components/ui/    :", stats.shadcnDirectImports.length);
console.log("8. Halaman yang membocorkan import langsung @radix-ui/          :", stats.radixDirectImports.length);
console.log("================================================================");

console.log("\n[TOP 10 HALAMAN FAKE DNA (Bungkusnya Card DNA, Isinya Raw Table)]:");
stats.fakeDnaAdoption.slice(0, 10).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

console.log("\n[TOP 10 HALAMAN TERDETEKSI 1 KOLOM 3 DATA]:");
stats.threeDataCells.slice(0, 10).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

console.log("\n[TOP 10 HALAMAN RAW TABLE MURNI (Legacy/Manual)]: ");
stats.rawTable.slice(0, 10).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

console.log("\n[TOP 10 HALAMAN DENGAN DIRECT SHADCN/UI IMPORT (Pelanggaran Boundary)]: ");
stats.shadcnDirectImports.slice(0, 10).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
