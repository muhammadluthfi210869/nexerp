import fs from "fs";
import path from "path";

function walk(dir) {
  const results = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules" && ent.name !== ".next") {
      results.push(...walk(p));
    } else if (ent.isFile() && (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts"))) {
      const content = fs.readFileSync(p, "utf-8");
      if (content.includes("DnaTable as Table")) {
        results.push(p);
      }
    }
  }
  return results;
}

const files = walk("src/app");
console.log(`Found ${files.length} files with DnaTable as Table:`);
files.forEach((f) => console.log(" -", f.replace(/\\/g, "/")));
