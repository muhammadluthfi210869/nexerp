/**
 * Reproduction test — Tahap 3: Commercial, Penjualan, R&D & Checklist Tracking.
 *
 * Verifies write-path authenticity and eliminates fabricated toast feedback:
 *   1. /inventory/formula-adjustment-rnd:
 *      `handleSaveUpscale` emitted toast.success without dispatching any HTTP write
 *      to the backend. Backend does not have POST /rnd/formulas/adjustments.
 *      Must not claim false persistence; if local calculation only, warn honestly.
 *   2. /approvals/sales-sample:
 *      Must provide functional `onApprove` / `onReject` connected to real backend
 *      sample transition endpoints (`PATCH /rnd/sample/:id/advance` or `POST /rnd/sample/:id/accept`).
 *   3. /penjualan/sample-sales:
 *      `handleCreateSubmit` mutated only local React state and called toast.success
 *      instead of dispatching real POST to /bussdev/samples.
 *   4. /penjualan/sales-target:
 *      `handleCreateSubmit` added `st-${Date.now()}` to React state and emitted toast.success,
 *      while backend has no sales target creation controller. Must not claim server persistence.
 *   5. /quality/checklist-progress and /quality/checklist-tracking:
 *      Must query real backend QC endpoints (/qc/checklists and /qc/checklists/completed)
 *      without falling back to static fabricated items or inventing fake statuses.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "..");
const pageSrc = (rel: string) => fs.readFileSync(path.join(APP, rel), "utf8");

function handlerBody(src: string, name: string): string {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.search(/\n {2}(?:const|function|return) /);
  return end < 0 ? rest : rest.slice(0, end);
}

function handlerReachesBackend(src: string, handlerName: string): boolean {
  const body = handlerBody(src, handlerName);
  if (/api\.(post|patch|put|delete)\(/.test(body)) return true;
  const handoff = body.match(/(\w+Mut(?:ation)?)\.mutate\(/);
  if (!handoff) return false;
  return /api\.(post|patch|put|delete)\(/.test(handlerBody(src, handoff[1]));
}

describe("Tahap 3 — Write Path Persistence and Honesty", () => {
  describe("R&D / Formula Adjustment (SCR-136)", () => {
    const src = pageSrc("inventory/formula-adjustment-rnd/page.tsx");

    it("does NOT falsely claim server persistence in handleSaveUpscale", () => {
      const body = handlerBody(src, "handleSaveUpscale");
      // Must not emit toast.success claiming it was saved for SPK
      expect(body).not.toMatch(/toast\.success\([^)]*Penyesuaian Formulasi Disimpan/);
    });

    it("emits toast.warning or honest disclaimer if local calculation only", () => {
      const body = handlerBody(src, "handleSaveUpscale");
      expect(body).toMatch(/toast\.(warning|info)\(/);
    });
  });

  describe("Approvals — Sales Sample (R&D)", () => {
    const src = pageSrc("approvals/sales-sample/page.tsx");

    it("wires onApprove prop to backend sample advance/accept route", () => {
      expect(src).toMatch(/onApprove=\{/);
      expect(src).toMatch(/api\.(post|patch)\(\s*[`"']\/rnd\/sample/);
    });

    it("wires onReject prop to backend sample rejection route", () => {
      expect(src).toMatch(/onReject=\{/);
      expect(src).toMatch(/newStage:\s*["']REJECTED["']/);
    });
  });

  describe("Penjualan — Sample Sales (/penjualan/sample-sales)", () => {
    const src = pageSrc("penjualan/sample-sales/page.tsx");

    it("handleCreateSubmit dispatches real POST /bussdev/samples", () => {
      expect(src).not.toMatch(/id:\s*`smp-\$\{Date\.now\(\)\}`/);
      expect(handlerReachesBackend(src, "handleCreateSubmit")).toBe(true);
      expect(src).toMatch(/api\.post\(\s*[`"']\/bussdev\/samples[`"']/);
    });
  });

  describe("Penjualan — Sales Target (/penjualan/sales-target)", () => {
    const src = pageSrc("penjualan/sales-target/page.tsx");

    it("does NOT invent id `st-${Date.now()}` with false success toast when route is missing", () => {
      const body = handlerBody(src, "handleCreateSubmit");
      expect(body).not.toMatch(/toast\.success\([^)]*Target Ditambahkan/);
    });

    it("informs user that backend endpoint is not yet available with toast.warning", () => {
      const body = handlerBody(src, "handleCreateSubmit");
      expect(body).toMatch(/toast\.warning\(/);
    });
  });

  describe("Quality — Checklist Progress & Tracking", () => {
    const progressSrc = pageSrc("quality/checklist-progress/page.tsx");
    const trackingSrc = pageSrc("quality/checklist-tracking/page.tsx");

    it("queries real QC checklist routes without fake hardcoded fallback arrays", () => {
      expect(progressSrc).toMatch(/\/qc\/checklists/);
      expect(trackingSrc).toMatch(/\/qc\/checklists\/completed/);
      expect(progressSrc).not.toMatch(/return\s*\[\s*\{\s*id:\s*["']chk-/);
      expect(trackingSrc).not.toMatch(/return\s*\[\s*\{\s*id:\s*["']chk-/);
    });
  });
});
