/**
 * Reproduction test — Tahap 2, batch 2 (Pembelian + Gudang + sisa Master).
 *
 * Same defect class as `master/__tests__/master-crud-persistence.test.tsx`, measured
 * 2026-09-26 on the working tree:
 *
 *   A) HANDLERS THAT LIE ABOUT A WRITE THEY NEVER SEND
 *      `toast.success("... berhasil ...")` after editing React state, with no request.
 *      /master/personnel   handleSaveUser   mints `id: \`u-${Date.now()}\``, `setUsersList`
 *      /master/personnel   handleDeleteUser setUsersList(prev.filter(...))
 *      /master/warehouses  handleSaveAccess setAccessList(prev.map(...)) — backend has
 *                          POST /master/warehouses/access and it is never called
 *      /pembelian/faktur-pembelian  handleCreateBill, handleImportExcel (invents
 *                          "3 Faktur Pembelian baru ditambahkan")
 *      /pembelian/purchase-returns  handleApproveVendor, handleCompleteReturn
 *      /warehouse/release  handleConfirmDelivered — also blocks the UI on `prompt()`
 *
 *   B) HANDLERS WITH NO BACKEND ROUTE AT ALL, ALSO REPORTING SUCCESS
 *      /pembelian/kebutuhan        handleCreateSubmit  — CreateGoodsRequirementDto needs a
 *                          salesOrderId UUID + items[].materialId UUID; the form has neither,
 *                          so it cannot be wired and must stop claiming it saved
 *      /pembelian/dp-pembelian     handleApprovePayment — no /purchase/down-payments/:id
 *                          transition route exists
 *      /pembelian/faktur-pembelian handleSaveReason — bill.unpaidReason exists, but the
 *                          invoices controller exposes no PATCH
 *      /warehouse/gudang           handleSaveBin — GET /warehouse/locations only, no POST
 *                                  handleSaveCategory — category DTO has no CoA-mapping fields
 *
 *   C) DOUBLE PREFIX
 *      /master/personnel requests `fetch("/api/v1/users")`. next.config rewrites
 *      `/api/:path*` -> `<backend>/v1/:path*`, so the page asks the server for
 *      `/v1/v1/users`. Measured against the local backend: `/v1/users` -> 401 (exists),
 *      `/v1/v1/users` -> 404. The page also used bare `fetch`, so it carried no JWT —
 *      even the correct path would have 401'd.
 *
 * Backend routes confirmed live (see docs/qa-gate/2026-09-26-tahap2-batch2-pembelian-gudang.md):
 *   POST/PATCH/DELETE /v1/users           POST /v1/master/warehouses/access
 *   POST /v1/purchase/invoices            POST /v1/purchase/invoices/import
 *   POST /v1/purchase/returns/:id/approve PATCH /v1/purchase/returns/:id/status
 *   PATCH /v1/fulfillment/shipments/:id/status
 *
 * Per CLAUDE.md QA GATE this test must FAIL before the fix and pass after.
 *
 * ponytail: source-level, not rendered. Driving six pages through the DOM would need six
 * navigation mocks and six query stubs to assert what a brace-matched read of the handler
 * already proves. `master-crud-persistence.test.tsx` carries the one behavioural render test
 * for this defect class. Add a render test here when a page's write path stops being a
 * single named handler.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// __dirname is `src/app/(dashboard)/__tests__`.
const APP = path.resolve(__dirname, "..");
const pageSrc = (rel: string) => fs.readFileSync(path.join(APP, rel), "utf8");

/** The body of a named handler, from `const <name>` up to the next top-level `const`/`return`. */
function handlerBody(src: string, name: string): string {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.search(/\n {2}(?:const|function|return) /);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * Does the write path from this handler reach the backend?
 *
 * The handler may call `api.<verb>(...)` itself, or hand off to a TanStack mutation and let
 * its `mutationFn` issue the request. Either is a real write; a handler that only touches
 * React state reaches neither.
 */
function handlerReachesBackend(src: string, handlerName: string): boolean {
  const body = handlerBody(src, handlerName);
  if (/api\.(post|patch|put|delete)\(/.test(body)) return true;
  const handoff = body.match(/(\w+Mut(?:ation)?)\.mutate\(/);
  if (!handoff) return false;
  return /api\.(post|patch|put|delete)\(/.test(handlerBody(src, handoff[1]));
}

type WriteCase = {
  file: string;
  handler: string;
  /** The local-state write or fabricated value this handler must no longer contain. */
  forbid?: RegExp;
  /** The real request the handler must end up issuing. */
  route: RegExp;
};

const WRITE_PATHS: WriteCase[] = [
  {
    file: "master/personnel/PersonnelRegistry.tsx",
    handler: "handleSaveUser",
    forbid: /id:\s*`u-\$\{Date\.now\(\)\}`/,
    route: /api\.(post|patch)\(\s*[`"']\/users/,
  },
  {
    file: "master/personnel/PersonnelRegistry.tsx",
    handler: "handleDeleteUser",
    forbid: /setUsersList\(/,
    route: /api\.delete\(\s*[`"']\/users\//,
  },
  {
    file: "master/warehouses/page.tsx",
    handler: "handleSaveAccess",
    forbid: /setAccessList\(/,
    route: /api\.post\(\s*[`"']\/master\/warehouses\/access/,
  },
  {
    file: "pembelian/faktur-pembelian/page.tsx",
    handler: "handleCreateBill",
    route: /api\.post\(\s*[`"']\/purchase\/invoices[`"']/,
  },
  {
    file: "pembelian/faktur-pembelian/page.tsx",
    handler: "handleImportExcel",
    forbid: /3 Faktur Pembelian baru ditambahkan/,
    route: /api\.post\(\s*[`"']\/purchase\/invoices\/import/,
  },
  {
    file: "pembelian/purchase-returns/page.tsx",
    handler: "handleApproveVendor",
    route: /\/purchase\/returns\/\$\{[^}]+\}\/approve/,
  },
  {
    file: "pembelian/purchase-returns/page.tsx",
    handler: "handleCompleteReturn",
    route: /\/purchase\/returns\/\$\{[^}]+\}\/status/,
  },
  {
    file: "warehouse/release/page.tsx",
    handler: "handleConfirmDelivered",
    forbid: /\bprompt\(/,
    route: /\/fulfillment\/shipments\/\$\{[^}]+\}\/status/,
  },
  {
    // The happy path really does issue a batch, but the "no FEFO batch found" branch used to
    // report the same success string. Only one of the two branches can be true.
    file: "warehouse/workstation/page.tsx",
    handler: "handleIssueConfirmation",
    forbid: /toast\.success\(/,
    route: /api\.post\(\s*[`"']\/warehouse\/batches\/\$\{[^}]+\}\/status/,
  },
];

/**
 * Handlers whose backend route does not exist. They may keep whatever local UI affordance
 * they have, but they must not report a server write that never happened.
 */
const NO_ROUTE_YET: Array<{ file: string; handler: string }> = [
  { file: "pembelian/kebutuhan/page.tsx", handler: "handleCreateSubmit" },
  { file: "pembelian/dp-pembelian/page.tsx", handler: "handleApprovePayment" },
  { file: "pembelian/faktur-pembelian/page.tsx", handler: "handleSaveReason" },
  { file: "warehouse/gudang/page.tsx", handler: "handleSaveBin" },
  { file: "warehouse/gudang/page.tsx", handler: "handleSaveCategory" },
  // POST /fulfillment/shipments exists but needs `logisticsId` (@IsUUID) and `soId` (@IsUUID);
  // the modal holds a free-text courier name and an SO *number*, so it cannot fill either.
  { file: "warehouse/release/page.tsx", handler: "handleCreateDelivery" },
];

describe("pembelian/gudang write paths must persist, not just toast", () => {
  for (const { file, handler, forbid, route } of WRITE_PATHS) {
    describe(`${file} :: ${handler}`, () => {
      it("has a handler body (name not renamed away)", () => {
        expect(handlerBody(pageSrc(file), handler).length).toBeGreaterThan(40);
      });

      if (forbid) {
        it("no longer fakes the write in local state", () => {
          expect(handlerBody(pageSrc(file), handler)).not.toMatch(forbid);
        });
      }

      it("reaches the backend through a mutation or a direct call", () => {
        expect(handlerReachesBackend(pageSrc(file), handler)).toBe(true);
      });

      it("calls the real route", () => {
        expect(pageSrc(file)).toMatch(route);
      });
    });
  }

  for (const { file, handler } of NO_ROUTE_YET) {
    describe(`${file} :: ${handler} (no backend route yet)`, () => {
      it("has a handler body (name not renamed away)", () => {
        expect(handlerBody(pageSrc(file), handler).length).toBeGreaterThan(40);
      });

      it("does not report a success the server never performed", () => {
        expect(handlerBody(pageSrc(file), handler)).not.toMatch(/toast\.success\(/);
      });
    });
  }
});

describe("dashboard pages must not double the /v1 prefix", () => {
  // next.config rewrites `/api/:path*` -> `<backend>/v1/:path*`, so a page asking for
  // `/api/v1/x` reaches `/v1/v1/x`. Verified live: /v1/users -> 401, /v1/v1/users -> 404.
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      return e.isFile() && /\.tsx?$/.test(e.name) ? [p] : [];
    });

  const files = walk(APP).filter((p) => !p.includes("__tests__"));

  it("scanned the dashboard tree", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("never requests /api/v1/** (the rewrite already adds /v1)", () => {
    const offenders = files
      .filter((p) => /["'`]\/api\/v1\//.test(fs.readFileSync(p, "utf8")))
      .map((p) => path.relative(APP, p));
    expect(offenders).toEqual([]);
  });
});
