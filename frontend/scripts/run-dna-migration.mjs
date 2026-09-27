import fs from "fs";
import path from "path";
import { transformFile } from "./dna-table-migrator.mjs";

const targetModule = process.argv[2]; // e.g. "inventory", "approvals", "master", or "all"

const APP_DIR = path.resolve("src/app/(dashboard)");

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

let countModified = 0;
let countSkipped = 0;

walk(APP_DIR, (fp) => {
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");

  // Skip SEMUA dashboard
  if (
    rel.includes("/dashboard/") ||
    rel.includes("Dashboard") ||
    rel.endsWith("/dashboard/page.tsx")
  ) {
    return;
  }

  // Jika user specify target module
  if (targetModule && targetModule !== "all") {
    if (!rel.includes(`/(dashboard)/${targetModule}/`)) {
      return;
    }
  }

  const res = transformFile(fp);
  if (res.modified) {
    console.log(`[MIGRATED] ${rel}`);
    countModified++;
  } else {
    countSkipped++;
  }
});

console.log(`\n=== Migration Complete ===`);
console.log(`Total modified: ${countModified}`);
console.log(`Total skipped : ${countSkipped}`);
