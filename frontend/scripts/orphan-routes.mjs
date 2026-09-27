#!/usr/bin/env node
/**
 * orphan-routes — dashboard routes that no sidebar entry links to.
 *
 * Fase 2 of docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md calls these
 * "153 orphan screen". The number matters because a page nobody can reach
 * is a page nobody verified.
 *
 * Earlier ad-hoc counting used `sidebarSource.includes("/route")` against the
 * whole Sidebar.tsx text. That is wrong twice over:
 *   - it matches substrings, so "/approvals" looks linked when only
 *     "/approvals/finance-approvals" is present;
 *   - Sidebar.tsx also contains `id:` slugs, icon imports and comments.
 *
 * This version reads only `href: "..."` values and matches a route when an
 * href equals it or is an ancestor of it (a dynamic segment like
 * `/samples/project-control/[projectId]` is reached from its parent href).
 *
 * Usage:  node scripts/orphan-routes.mjs [--json]
 * Exit:   0 always (it is a report, not a gate). Wire it into a gate when
 *         someone decides what the acceptable number is.
 */
import fs from "node:fs";
import path from "node:path";

const ROUTES_ROOT = "src/app/(dashboard)";
const SIDEBAR = "src/components/layout/Sidebar.tsx";

/** Every href the sidebar can navigate to. */
function sidebarHrefs() {
  const src = fs.readFileSync(SIDEBAR, "utf8");
  const hrefs = new Set();
  // href: "/x"  — the only shape Sidebar.tsx uses (NavSection and SubMenuItem).
  for (const m of src.matchAll(/\bhref:\s*"([^"]+)"/g)) hrefs.add(m[1]);
  return hrefs;
}

/** Every route the App Router serves under (dashboard). */
function pageRoutes() {
  const routes = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "page.tsx") {
        const rel = path.relative(ROUTES_ROOT, p).split(path.sep).join("/");
        routes.push("/" + rel.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, ""));
      }
    }
  };
  walk(ROUTES_ROOT);
  return routes;
}

const hrefs = sidebarHrefs();
const routes = pageRoutes();

const isReached = (route) =>
  [...hrefs].some((h) => route === h || route.startsWith(h + "/"));

const orphans = routes.filter((r) => r !== "/" && !isReached(r)).sort();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ total: routes.length, linked: routes.length - orphans.length, orphans }, null, 2));
} else {
  console.log(`sidebar hrefs : ${hrefs.size}`);
  console.log(`dashboard pages: ${routes.length}`);
  console.log(`orphans        : ${orphans.length}`);
  console.log(`linked         : ${routes.length - orphans.length}`);
  if (process.argv.includes("--list")) console.log("\n" + orphans.join("\n"));
}