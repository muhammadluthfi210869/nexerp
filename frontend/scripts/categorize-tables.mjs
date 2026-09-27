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

const modules = {};

walk(APP_DIR, (fp) => {
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");
  if (
    rel.includes("/dashboard/") ||
    rel.includes("DashboardClient") ||
    rel.includes("dashboard.tsx")
  ) {
    return;
  }

  const code = fs.readFileSync(fp, "utf-8");
  if (/<table\b/i.test(code)) {
    // ambil modul utama: src/app/(dashboard)/<module>/...
    const parts = rel.split("/");
    const mod = parts[3] || "other";
    if (!modules[mod]) modules[mod] = [];
    modules[mod].push(rel);
  }
});

console.log("=== MODUL NON-DASHBOARD DENGAN <table ===");
for (const [mod, files] of Object.entries(modules)) {
  console.log(`\nModul [${mod}]: ${files.length} files`);
  files.forEach((f) => console.log(`  - ${f}`));
}
