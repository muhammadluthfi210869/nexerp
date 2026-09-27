import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function pageSrc(relPath: string): string {
  const fullPath = path.resolve(__dirname, "..", relPath);
  return fs.readFileSync(fullPath, "utf8");
}

describe("Tahap 4 — Finance & Reports Parity and Backend Connectivity", () => {
  describe("Reports / Cash Flow (/reports/cash-flow)", () => {
    const src = pageSrc("reports/cash-flow/page.tsx");

    it("fetches data from backend /reports/cash-flow or /finance/reports/cash-flow", () => {
      expect(src).toMatch(/api\.get\(\s*[`"'](\/finance)?\/reports\/cash-flow[`"']/);
    });

    it("does NOT rely purely on hardcoded local cash constants without useQuery", () => {
      expect(src).toMatch(/useQuery<[^>]*>\(\{/);
    });
  });

  describe("Reports / Trial Balance (/reports/trial-balance)", () => {
    const src = pageSrc("reports/trial-balance/page.tsx");

    it("queries backend /reports/trial-balance or /finance/reports/trial-balance", () => {
      expect(src).toMatch(/api\.get\(\s*[`"'](\/finance)?\/reports\/trial-balance/);
    });

    it("does NOT render only FALLBACK_TB_ROWS without querying backend", () => {
      expect(src).toMatch(/useQuery<[^>]*>\(\{/);
    });
  });

  describe("Reports / AP Aging (/reports/ap-aging)", () => {
    it("ensures /reports/ap-aging or /finance/ap-aging connects to real AP aging route", () => {
      // Check either /reports/ap-aging or /finance/ap-aging
      const hasReportAp = fs.existsSync(path.resolve(__dirname, "../reports/ap-aging/page.tsx"));
      const targetSrc = hasReportAp
        ? pageSrc("reports/ap-aging/page.tsx")
        : pageSrc("finance/ap-aging/page.tsx");

      expect(targetSrc).toMatch(/api\.get\(\s*[`"'](\/finance)?\/reports\/ap-aging/);
    });
  });

  describe("Reports / Mutation Goods (/reports/mutation-goods)", () => {
    const src = pageSrc("reports/mutation-goods/page.tsx");

    it("queries backend transactions or goods mutation route", () => {
      expect(src).toMatch(/api\.get\(\s*[`"']\/reports\/mutation-goods[`"']/);
    });
  });

  describe("Finance / Fixed Assets (/finance/assets)", () => {
    const src = pageSrc("finance/assets/page.tsx");

    it("queries backend /finance/fixed-assets", () => {
      expect(src).toMatch(/api\.get\(\s*[`"']\/finance\/fixed-assets[`"']/);
    });
  });
});
