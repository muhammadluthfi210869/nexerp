// backend/src/modules/crm/__tests__/round-robin-historical.spec.ts
//
// Tests for RoundRobinHistoricalService.
// Verifies roster + lead aggregation + balance metric computation against a
// mocked DreamlabPrismaService.

import { ServiceUnavailableException } from "@nestjs/common";
import { RoundRobinHistoricalService } from "../round-robin/round-robin-historical.service";

function makeService(opts: {
  configured: boolean;
  roster?: Array<{ name: string; phone: string | null; is_active: boolean }>;
  leadAggs?: Array<{ assigned_to: string; total: bigint; last30d: bigint; last7d: bigint; last_at: Date | null }>;
  counter?: Array<{ current_index: number | null; updated_at: Date | null }>;
}) {
  const client: any = {
    $queryRaw: jest.fn().mockImplementation((q: TemplateStringsArray) => {
      // Cheap discriminator: the first SQL fragment contains a keyword.
      const sql = q[0];
      if (sql.includes("FROM busdevs")) return Promise.resolve(opts.roster ?? []);
      if (sql.includes("FROM leads")) return Promise.resolve(opts.leadAggs ?? []);
      if (sql.includes("rr_counter")) return Promise.resolve(opts.counter ?? []);
      return Promise.resolve([]);
    }),
  };
  const dreamlab: any = {
    getClient: () => opts.configured ? client : (() => { throw new ServiceUnavailableException("DREAMLAB_DATABASE_URL not configured"); })(),
  };
  return { service: new RoundRobinHistoricalService(dreamlab), client };
}

describe("RoundRobinHistoricalService (Dreamlab historical distribution)", () => {
  it("throws 503 if DREAMLAB_DATABASE_URL is not configured", async () => {
    const { service } = makeService({ configured: false });
    await expect(service.snapshot()).rejects.toThrow(ServiceUnavailableException);
  });

  it("returns roster + per-busdev counts + balance metrics when configured", async () => {
    const { service } = makeService({
      configured: true,
      roster: [
        { name: "Nisa", phone: "6281234567001", is_active: true },
        { name: "Diva", phone: "6281234567002", is_active: true },
        { name: "Ratih", phone: "6281234567003", is_active: false },
      ],
      leadAggs: [
        { assigned_to: "Nisa", total: BigInt(140), last30d: BigInt(28), last7d: BigInt(7), last_at: new Date("2026-09-12T10:00:00Z") },
        { assigned_to: "Diva", total: BigInt(135), last30d: BigInt(30), last7d: BigInt(6), last_at: new Date("2026-09-13T11:00:00Z") },
        { assigned_to: "Ratih", total: BigInt(145), last30d: BigInt(27), last7d: BigInt(5), last_at: new Date("2026-09-11T09:00:00Z") },
      ],
      counter: [{ current_index: 1, updated_at: new Date("2026-09-13T11:00:00Z") }],
    });

    const snapshot = await service.snapshot();

    expect(snapshot.busdevs).toHaveLength(3);
    // sorted by totalLeads DESC (Ratih 145 first even though inactive)
    expect(snapshot.busdevs[0].name).toBe("Ratih");
    expect(snapshot.busdevs[0].totalLeads).toBe(145);
    expect(snapshot.busdevs[1].name).toBe("Nisa");
    expect(snapshot.busdevs[2].name).toBe("Diva");

    // balanceMetrics uses ACTIVE busdevs only → Nisa 140 + Diva 135
    // mean = 137.5, stddev = sqrt((2.5^2 + 2.5^2)/2) = 2.5, cv = 2.5/137.5 ≈ 0.018 → SEIMBANG
    expect(snapshot.balanceMetrics.isBalanced).toBe("SEIMBANG");
    expect(snapshot.balanceMetrics.range.min).toBe(135);
    expect(snapshot.balanceMetrics.range.max).toBe(140);

    // rrCounter surfaced
    expect(snapshot.rrCounter.currentIndex).toBe(1);
    expect(snapshot.rrCounter.updatedAt).toBe("2026-09-13T11:00:00.000Z");

    // Ratih (inactive) included in roster but excluded from balance calc
    expect(snapshot.busdevs.find((b) => b.name === "Ratih")!.isActive).toBe(false);
    expect(snapshot.busdevs.find((b) => b.name === "Ratih")!.totalLeads).toBe(145);
  });

  it("returns empty payload with SEIMBANG + zeros when no active busdevs", async () => {
    const { service } = makeService({
      configured: true,
      roster: [],
      leadAggs: [],
      counter: [],
    });
    const snapshot = await service.snapshot();
    expect(snapshot.busdevs).toHaveLength(0);
    expect(snapshot.balanceMetrics).toEqual({
      stdDeviation: 0,
      coefficientOfVariation: 0,
      isBalanced: "SEIMBANG",
      range: { min: 0, max: 0 },
      mean: 0,
    });
    expect(snapshot.rrCounter.currentIndex).toBeNull();
  });
});
