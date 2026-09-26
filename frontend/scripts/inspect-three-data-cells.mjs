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

const pattern = /<(?:td|DnaTd)[^>]*>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<\/(?:td|DnaTd)>/i;
const renderPattern = /render:\s*\([^)]*\)\s*=>\s*\(?[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>/i;

const files = [];

walk(APP_DIR, (fp) => {
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");
  if (rel.includes("/dashboard/") || rel.includes("Dashboard") || rel.endsWith("/dashboard/page.tsx")) {
    return;
  }
  const code = fs.readFileSync(fp, "utf-8");
  if (pattern.test(code) || renderPattern.test(code)) {
    files.push(rel);
  }
});

console.log("=== NON-DASHBOARD FILES WITH 3 DATA STACKED ===");
console.log(`Total: ${files.length}`);
files.forEach((f) => console.log(` - ${f}`));
