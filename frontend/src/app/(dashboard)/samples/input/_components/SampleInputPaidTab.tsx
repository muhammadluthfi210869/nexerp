"use client";

import React from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Eye,
  MousePointer2,
} from "lucide-react";
import {
  Card,
  StatCard,
  TableWrapper,
  DnaBadge,
  TabsContent,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
} from "@/components/dna";
import { MatrixRow } from "./MatrixRow";
import {
  AdsEntry,
  BaselineEntry,
  MatrixTotals,
  getCriticalCardClass,
} from "../_types/input.types";

interface SampleInputPaidTabProps {
  totals: MatrixTotals;
  paidDataMissing: boolean;
  ctr: number;
  cpa: number;
  paidEfficiencyCritical: boolean;
  paidCostCritical: boolean;
  adsMatrix: Record<string, AdsEntry>;
  setAdsMatrix: React.Dispatch<React.SetStateAction<Record<string, AdsEntry>>>;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  baselineData: BaselineEntry[];
}

export function SampleInputPaidTab({
  totals,
  paidDataMissing,
  ctr,
  cpa,
  paidEfficiencyCritical,
  paidCostCritical,
  adsMatrix,
  setAdsMatrix,
  handleKeyDown,
  baselineData,
}: SampleInputPaidTabProps) {
  return (
    <TabsContent value="paid" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Aggregated Spend"
          value={`Rp ${totals.s.toLocaleString()}`}
          icon={<DollarSign />}
          subValue="Budget feed ready"
          className={
            paidDataMissing
              ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]`
              : undefined
          }
        />
        <StatCard
          label="Leads Acquired"
          value={totals.l}
          icon={<Users />}
          subValue="Lead stream detected"
          className={
            paidDataMissing
              ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]`
              : undefined
          }
        />
        <StatCard
          label="Efficiency (CTR)"
          value={`${totals.i > 0 ? ctr.toFixed(2) : 0}%`}
          icon={<TrendingUp />}
          subValue="CTR within normal range"
          className={
            paidEfficiencyCritical
              ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]`
              : undefined
          }
        />
        <StatCard
          label="Avg. CPA"
          value={`Rp ${totals.l > 0 ? cpa.toLocaleString() : 0}`}
          icon={<Target />}
          subValue="Acquisition cost stable"
          className={
            paidCostCritical
              ? `${getCriticalCardClass(true)} [&_h3]:text-[#DC2626]`
              : undefined
          }
        />
      </div>

      <Card
        className={`rounded-2xl overflow-hidden bg-white ${getCriticalCardClass(
          paidDataMissing
        )}`}
      >
        <div className="overflow-x-auto">
          <TableWrapper>
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50 border-b border-slate-200">
                  <DnaTh className="p-4 text-left w-64">
                    <span className="text-table-header text-slate-400">
                      Performance Metric
                    </span>
                  </DnaTh>
                  {Object.keys(adsMatrix).map((p) => (
                    <DnaTh key={p} className="p-4 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-bold tracking-tight text-slate-900">
                          {p.split("_")[0]}
                        </span>
                        <DnaBadge variant="info">Paid Feed</DnaBadge>
                      </div>
                    </DnaTh>
                  ))}
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                <MatrixRow
                  label="Ad Spend"
                  icon={DollarSign}
                  platforms={Object.keys(adsMatrix)}
                  field="spend"
                  matrix={adsMatrix}
                  setMatrix={setAdsMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={100}
                  prefix="Rp"
                  baseline={baselineData}
                  important
                />
                <MatrixRow
                  label="Impressions"
                  icon={Eye}
                  platforms={Object.keys(adsMatrix)}
                  field="impressions"
                  matrix={adsMatrix}
                  setMatrix={setAdsMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={200}
                  baseline={baselineData}
                />
                <MatrixRow
                  label="Clicks"
                  icon={MousePointer2}
                  platforms={Object.keys(adsMatrix)}
                  field="clicks"
                  matrix={adsMatrix}
                  setMatrix={setAdsMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={400}
                  baseline={baselineData}
                  showCalc={(p: string) => {
                    const ad = adsMatrix[p];
                    if (ad.impressions > 0)
                      return `CTR: ${(
                        (ad.clicks / ad.impressions) *
                        100
                      ).toFixed(1)}%`;
                    return null;
                  }}
                />
                <MatrixRow
                  label="Leads Generated"
                  icon={Users}
                  platforms={Object.keys(adsMatrix)}
                  field="leadsGenerated"
                  matrix={adsMatrix}
                  setMatrix={setAdsMatrix}
                  onKeyDown={handleKeyDown}
                  startIdx={500}
                  baseline={baselineData}
                  accent="text-emerald-600"
                  showCalc={(p: string) => {
                    const ad = adsMatrix[p];
                    if (ad.leadsGenerated > 0)
                      return `CPL: Rp ${(
                        ad.spend / ad.leadsGenerated
                      ).toLocaleString()}`;
                    return null;
                  }}
                />
              </DnaTableBody>
            </DnaTable>
          </TableWrapper>
        </div>
      </Card>
    </TabsContent>
  );
}
