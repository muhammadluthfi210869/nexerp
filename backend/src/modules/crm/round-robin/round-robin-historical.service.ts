// RoundRobinHistoricalService — surfaces months of dreamlab-side round-robin
// assignment data in OmniCRM.
//
// Data source: PostgreSQL `dreamlab` DB (separate from ERP). Tables queried:
//   - busdevs: roster of CS agents with phone, is_active
//   - leads: historical lead records with assigned_to (busdev name string),
//            assigned_phone, created_at
//   - rr_counter: singleton row with current_index (atomic round-robin pointer)
//
// All counts come from `leads` grouped by `assigned_to`. We compute:
//   - totalLeads: all-time count
//   - last30d / last7d: timestamps within those windows
//   - lastAssignedAt: MAX(created_at) per agent
//
// Balance metric: coefficient of variation (stddev / mean) of totalLeads across
// active busdevs. Bands (matches docs/RUNBOOK-DEPLOY-DAN-TEST-OMNICRM.md spec):
//   - CV < 0.05  → SEIMBANG
//   - 0.05 ≤ CV < 0.15 → CENDERUNG_SEIMBANG
//   - CV ≥ 0.15 → TIDAK_SEIMBANG
//
// If no active busdevs, returns an empty payload (no throw).

import { Injectable } from "@nestjs/common";
import { DreamlabPrismaService } from "../dreamlab/dreamlab-prisma.service";

export interface HistoricalBusdevRow {
  name: string;
  phone: string | null;
  isActive: boolean;
  totalLeads: number;
  last30d: number;
  last7d: number;
  lastAssignedAt: string | null;
}

export interface BalanceMetrics {
  stdDeviation: number;
  coefficientOfVariation: number;
  isBalanced: "SEIMBANG" | "CENDERUNG_SEIMBANG" | "TIDAK_SEIMBANG";
  range: { min: number; max: number };
  mean: number;
}

export interface HistoricalSnapshot {
  busdevs: HistoricalBusdevRow[];
  rrCounter: { currentIndex: number | null; updatedAt: string | null };
  balanceMetrics: BalanceMetrics;
  generatedAt: string;
}

type RosterRow = { name: string; phone: string | null; is_active: boolean };
type LeadAggRow = { assigned_to: string; total: bigint; last30d: bigint; last7d: bigint; last_at: Date | null };
type CounterRow = { current_index: number | null; updated_at: Date | null };

@Injectable()
export class RoundRobinHistoricalService {
  constructor(private readonly dreamlab: DreamlabPrismaService) {}

  async snapshot(): Promise<HistoricalSnapshot> {
    const client = this.dreamlab.getClient();

    const now = new Date();
    const cutoff30 = new Date(now.getTime() - 30 * 86_400_000);
    const cutoff7 = new Date(now.getTime() - 7 * 86_400_000);

    // 1. Roster (all busdevs, active + inactive)
    const roster = await client.$queryRaw<RosterRow[]>`
      SELECT name, phone, is_active FROM busdevs ORDER BY name ASC
    `;

    // 2. Lead counts per assigned_to, with time-window breakdowns.
    //    We do this with conditional aggregation in a single query.
    const leadAggs = await client.$queryRaw<LeadAggRow[]>`
      SELECT
        assigned_to,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE created_at >= ${cutoff30}) AS last30d,
        COUNT(*) FILTER (WHERE created_at >= ${cutoff7}) AS last7d,
        MAX(created_at) AS last_at
      FROM leads
      WHERE assigned_to IS NOT NULL AND assigned_to <> ''
      GROUP BY assigned_to
    `;

    // 3. Round-robin counter state
    const counterRows = await client.$queryRaw<CounterRow[]>`
      SELECT current_index, updated_at FROM rr_counter WHERE id = 1 LIMIT 1
    `;
    const counter = counterRows[0] ?? { current_index: null, updated_at: null };

    // 4. Merge roster with lead aggs
    const leadMap = new Map(leadAggs.map((r) => [r.assigned_to, r]));
    const busdevs: HistoricalBusdevRow[] = roster.map((r) => {
      const agg = leadMap.get(r.name);
      return {
        name: r.name,
        phone: r.phone,
        isActive: r.is_active,
        totalLeads: agg ? Number(agg.total) : 0,
        last30d: agg ? Number(agg.last30d) : 0,
        last7d: agg ? Number(agg.last7d) : 0,
        lastAssignedAt: agg?.last_at ? agg.last_at.toISOString() : null,
      };
    });

    // Sort by totalLeads DESC (busiest first)
    busdevs.sort((a, b) => b.totalLeads - a.totalLeads);

    // 5. Balance metrics — based on ACTIVE busdevs only
    const activeTotals = busdevs.filter((b) => b.isActive).map((b) => b.totalLeads);
    const balanceMetrics = this.computeBalance(activeTotals);

    return {
      busdevs,
      rrCounter: {
        currentIndex: counter.current_index,
        updatedAt: counter.updated_at ? counter.updated_at.toISOString() : null,
      },
      balanceMetrics,
      generatedAt: now.toISOString(),
    };
  }

  private computeBalance(totals: number[]): BalanceMetrics {
    if (totals.length === 0) {
      return {
        stdDeviation: 0,
        coefficientOfVariation: 0,
        isBalanced: "SEIMBANG",
        range: { min: 0, max: 0 },
        mean: 0,
      };
    }
    const mean = totals.reduce((s, v) => s + v, 0) / totals.length;
    const variance = totals.reduce((s, v) => s + (v - mean) ** 2, 0) / totals.length;
    const stdDeviation = Math.sqrt(variance);
    const cv = mean === 0 ? 0 : stdDeviation / mean;
    const isBalanced: BalanceMetrics["isBalanced"] =
      cv < 0.05 ? "SEIMBANG" : cv < 0.15 ? "CENDERUNG_SEIMBANG" : "TIDAK_SEIMBANG";
    return {
      stdDeviation: Math.round(stdDeviation * 100) / 100,
      coefficientOfVariation: Math.round(cv * 1000) / 1000,
      isBalanced,
      range: { min: Math.min(...totals), max: Math.max(...totals) },
      mean: Math.round(mean * 100) / 100,
    };
  }
}
