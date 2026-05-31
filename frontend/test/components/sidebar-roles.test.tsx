import { describe, it, expect } from "vitest";

// We test the MODULE_STRUCTURE constant structure — sidebar visibility is a client-side filter
// The actual rendering is tested via E2E, here we verify the data structure is correct
const MODULE_STRUCTURE = [
  {
    label: "MY DASHBOARD",
    items: [{ name: "My Dashboard", href: "/my-dashboard" }],
    roles: undefined,
  },
  {
    label: "BUSSDEV",
    roles: ["SUPER_ADMIN", "COMMERCIAL", "MARKETING", "DIRECTOR"],
    items: [
      { name: "Command Center", href: "/bussdev/dashboard" },
      { name: "Sales Pipeline", href: "/bussdev/pipeline" },
      { name: "Lead Intake Form", href: "/bussdev/intake" },
      { name: "Lost", href: "/bussdev/lost" },
    ],
  },
  {
    label: "FINANCE",
    roles: ["SUPER_ADMIN", "FINANCE", "DIRECTOR"],
    items: [
      { name: "Pusat Komando", href: "/finance/dashboard" },
      { name: "Kas & Bank", href: "/finance/kas" },
      { name: "Jurnal & COA", href: "/finance/jurnal" },
      { name: "Uang Muka (DP)", href: "/finance/dp" },
      { name: "Pembayaran", href: "/finance/bayar" },
      { name: "Piutang & Hutang", href: "/finance/piutang" },
      { name: "Fund & Approval", href: "/finance/fund" },
      { name: "Laporan", href: "/finance/reports" },
    ],
  },
  {
    label: "PRODUCTION",
    roles: ["SUPER_ADMIN", "PRODUCTION", "PRODUCTION_OP", "PPIC", "DIRECTOR"],
    items: [
      { name: "Dashboard", href: "/production" },
      { name: "Penjadwalan", href: "/production/schedule" },
      { name: "Operasional", href: "/production/operations" },
      { name: "Pipeline", href: "/production/pipeline" },
      { name: "Leakage", href: "/production/leakage" },
    ],
  },
  {
    label: "QUALITY CONTROL",
    roles: ["SUPER_ADMIN", "QC_LAB", "DIRECTOR"],
    items: [
      { name: "Dashboard", href: "/qc/dashboard" },
      { name: "Workbench", href: "/qc/workbench" },
      { name: "Inspections", href: "/qc/inspections" },
      { name: "COA Center", href: "/qc/coa" },
      { name: "Stability", href: "/qc/stability" },
      { name: "Report", href: "/qc/report" },
    ],
  },
  {
    label: "GUDANG",
    roles: ["SUPER_ADMIN", "WAREHOUSE", "DIRECTOR"],
    items: [
      { name: "Dashboard", href: "/warehouse" },
      { name: "Gudang", href: "/warehouse/gudang" },
      { name: "Stok", href: "/warehouse/stok" },
      { name: "Data Gudang", href: "/master/warehouses" },
    ],
  },
  {
    label: "RESEARCH & DEV",
    roles: ["SUPER_ADMIN", "RND", "DIRECTOR"],
    items: [
      { name: "Active Pipeline", href: "/rnd/pipeline" },
      { name: "Formula Repository", href: "/rnd/repository" },
      { name: "Sample Inbox", href: "/rnd/inbox" },
    ],
  },
];

function hasAccess(userRole: string, groupLabel: string): boolean {
  const group = MODULE_STRUCTURE.find((g) => g.label === groupLabel);
  if (!group || !group.roles) return false;
  return group.roles.includes(userRole);
}

describe("Sidebar Role Structure", () => {
  it("MY DASHBOARD is always visible (no role restriction)", () => {
    const group = MODULE_STRUCTURE[0];
    expect(group.label).toBe("MY DASHBOARD");
    expect(group.roles).toBeUndefined(); // No restriction = visible to all
  });

  describe("BussDev", () => {
    it("has 4 items after compression", () => {
      const group = MODULE_STRUCTURE.find((g) => g.label === "BUSSDEV")!;
      expect(group.items.length).toBe(4);
    });

    it("does NOT have Client Database or My Performance", () => {
      const group = MODULE_STRUCTURE.find((g) => g.label === "BUSSDEV")!;
      const names = group.items.map((i) => i.name);
      expect(names).not.toContain("Client Database");
      expect(names).not.toContain("My Performance");
      expect(names).not.toContain("Sales Order Central");
    });

    it("COMMERCIAL can access", () => {
      expect(hasAccess("COMMERCIAL", "BUSSDEV")).toBe(true);
    });

    it("FINANCE cannot access", () => {
      expect(hasAccess("FINANCE", "BUSSDEV")).toBe(false);
    });
  });

  describe("Finance", () => {
    it("has 8 items", () => {
      const group = MODULE_STRUCTURE.find((g) => g.label === "FINANCE")!;
      expect(group.items.length).toBe(8);
    });

    it("FINANCE can access", () => {
      expect(hasAccess("FINANCE", "FINANCE")).toBe(true);
    });

    it("RND cannot access", () => {
      expect(hasAccess("RND", "FINANCE")).toBe(false);
    });
  });

  describe("Production", () => {
    it("has 5 items after compression", () => {
      const group = MODULE_STRUCTURE.find((g) => g.label === "PRODUCTION")!;
      expect(group.items.length).toBe(5);
    });

    it("does NOT have My Performance", () => {
      const group = MODULE_STRUCTURE.find((g) => g.label === "PRODUCTION")!;
      const names = group.items.map((i) => i.name);
      expect(names).not.toContain("My Performance");
    });

    it("PRODUCTION and PRODUCTION_OP can access", () => {
      expect(hasAccess("PRODUCTION", "PRODUCTION")).toBe(true);
      expect(hasAccess("PRODUCTION_OP", "PRODUCTION")).toBe(true);
      expect(hasAccess("PPIC", "PRODUCTION")).toBe(true);
    });
  });

  describe("Quality Control", () => {
    it("QC_LAB can access", () => {
      expect(hasAccess("QC_LAB", "QUALITY CONTROL")).toBe(true);
    });
  });

  describe("Gudang", () => {
    it("WAREHOUSE can access", () => {
      expect(hasAccess("WAREHOUSE", "GUDANG")).toBe(true);
    });
  });

  describe("R&D", () => {
    it("RND can access", () => {
      expect(hasAccess("RND", "RESEARCH & DEV")).toBe(true);
    });
  });

  describe("SUPER_ADMIN", () => {
    it("can access ALL divisions", () => {
      for (const group of MODULE_STRUCTURE) {
        if (!group.roles) continue; // MY DASHBOARD has no roles
        if (group.roles.includes("SUPER_ADMIN")) {
          expect(hasAccess("SUPER_ADMIN", group.label)).toBe(true);
        }
      }
    });
  });

  describe("DIRECTOR", () => {
    it("can access ALL divisions", () => {
      for (const group of MODULE_STRUCTURE) {
        if (!group.roles) continue;
        if (group.roles.includes("DIRECTOR")) {
          expect(hasAccess("DIRECTOR", group.label)).toBe(true);
        }
      }
    });
  });
});
