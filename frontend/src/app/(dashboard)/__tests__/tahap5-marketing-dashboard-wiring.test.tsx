import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function pageSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const REF = "marketing/dashboard/MarketingReferenceDashboard.tsx";

describe("Tahap 5 — Marketing dashboard reads real data, not hardcoded literals", () => {
  const src = pageSrc(REF);

  it("calls GET /marketing/analytics (the route that serves every KPI on this page)", () => {
    expect(src).toContain("/marketing/analytics");
  });

  it("calls GET /marketing/platform-performance (the channel audit matrix)", () => {
    expect(src).toContain("/marketing/platform-performance");
  });

  it("no longer carries the hardcoded 1.25M-impression Meta Ads row", () => {
    expect(src).not.toMatch(/views:\s*1250000/);
  });

  it("no longer carries the hardcoded 'Rp 3.24 M' revenue pillar", () => {
    expect(src).not.toContain("Rp 3.24 M");
  });

  it("no longer carries the hardcoded 'Rp 342.5 Jt' ad spend pillar", () => {
    expect(src).not.toContain("Rp 342.5 Jt");
  });

  it("no longer carries the hardcoded 'MARCH 2024' period badge", () => {
    expect(src).not.toContain("MARCH 2024");
  });

  it("no longer carries the hardcoded annual trend series", () => {
    expect(src).not.toContain("data={[40, 55, 45, 78, 85, 60, 95, 110, 90, 120, 130, 140]}");
  });
});
