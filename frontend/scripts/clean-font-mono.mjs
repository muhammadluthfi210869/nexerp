import fs from "fs";
import path from "path";

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

let cleanedCount = 0;

walk(APP_DIR, (fp) => {
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");

  // Skip dashboard
  if (
    rel.includes("/dashboard/") ||
    rel.includes("Dashboard") ||
    rel.endsWith("/dashboard/page.tsx")
  ) {
    return;
  }

  let code = fs.readFileSync(fp, "utf-8");
  if (!code.includes("font-mono")) return;

  const original = code;
  // Replace font-mono with tabular-nums
  code = code.replace(/\bfont-mono\b/g, "tabular-nums");

  if (code !== original) {
    fs.writeFileSync(fp, code, "utf-8");
    console.log(`[CLEANED font-mono] ${rel}`);
    cleanedCount++;
  }
});

console.log(`\n=== font-mono Cleaned in ${cleanedCount} files ===`);
