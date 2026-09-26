import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function pageSrc(relPath: string): string {
  const fullPath = path.resolve(__dirname, "..", relPath);
  return fs.readFileSync(fullPath, "utf8");
}

describe("Tahap 5 — Department Dashboards Wiring Persistence", () => {
  const dashboardWiringChecks = [
    {
      file: "executive/dashboard/ExecutiveDashboardClient.tsx",
      endpoint: "/dashboards/executive",
      altFile: "executive/dashboard/page.tsx",
    },
    {
      file: "bussdev/dashboard/BussdevDashboardClient.tsx",
      endpoint: "/dashboards/busdev",
      altFile: "bussdev/dashboard/page.tsx",
    },
    {
      file: "production/production-planning-dashboard/page.tsx",
      endpoint: "/dashboards/production",
    },
    {
      file: "warehouse/WarehouseDashboardClient.tsx",
      endpoint: "/dashboards/warehouse",
      altFile: "warehouse/page.tsx",
    },
    {
      file: "quality/dashboard/page.tsx",
      endpoint: "/dashboards/qc",
    },
    {
      file: "rnd/dashboard/page.tsx",
      endpoint: "/dashboards/rnd",
    },
    {
      file: "hr/HRDashboardClient.tsx",
      endpoint: "/dashboards/hr",
      altFile: "hr/dashboard/page.tsx",
    },
    {
      file: "legality/dashboard/page.tsx",
      endpoint: "/dashboards/legality",
    },
    {
      file: "scm/dashboard/page.tsx",
      endpoint: "/dashboards/procurement",
    },
    {
      file: "reports/notifications/page.tsx",
      endpoint: "/dashboards/notifications",
    },
    {
      file: "system/error-dashboard/page.tsx",
      endpoint: "/dashboards/system-errors",
    },
  ];

  dashboardWiringChecks.forEach(({ file, endpoint, altFile }) => {
    it(`connects ${endpoint} in ${file}`, () => {
      let content = "";
      try {
        content += pageSrc(file);
      } catch {
        // file not directly found
      }
      if (altFile) {
        try {
          content += pageSrc(altFile);
        } catch {
          // altFile not found
        }
      }

      expect(content).toContain(endpoint);
    });
  });
});
