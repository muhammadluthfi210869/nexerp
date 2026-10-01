"use client";

import React from "react";
import { Trophy } from "lucide-react";
import {
  Card,
  DnaButton,
  DnaInput,
  Label,
  TabsContent,
} from "@/components/dna";
import { QuotaRow } from "./QuotaRow";
import { TargetData, getCriticalCardClass } from "../_types/input.types";

interface SampleInputTargetsTabProps {
  targetsIncomplete: boolean;
  canEditTargets: boolean;
  targetData: TargetData;
  setTargetData: React.Dispatch<React.SetStateAction<TargetData>>;
  loading: boolean;
  submitTargets: () => Promise<void>;
}

export function SampleInputTargetsTab({
  targetsIncomplete,
  canEditTargets,
  targetData,
  setTargetData,
  loading,
  submitTargets,
}: SampleInputTargetsTabProps) {
  return (
    <TabsContent value="targets">
      <Card
        className={`p-6 bg-white rounded-2xl overflow-hidden ${
          targetsIncomplete
            ? `${getCriticalCardClass(
                true
              )} [&_h3]:text-[#DC2626] [&_.target-critical]:text-[#DC2626]`
            : getCriticalCardClass(false)
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-8">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Fiscal{" "}
                <span
                  className={
                    targetsIncomplete ? "target-critical" : "text-blue-600"
                  }
                >
                  KPIs
                </span>
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Set the benchmark for current marketing period
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Active Month
                </Label>
                <DnaInput
                  disabled={!canEditTargets}
                  type="number"
                  value={targetData.month}
                  onChange={(e) =>
                    setTargetData({
                      ...targetData,
                      month: Number(e.target.value),
                    })
                  }
                  className="font-black text-blue-600 text-xl text-center"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Fiscal Year
                </Label>
                <DnaInput
                  disabled={!canEditTargets}
                  type="number"
                  value={targetData.year}
                  onChange={(e) =>
                    setTargetData({
                      ...targetData,
                      year: Number(e.target.value),
                    })
                  }
                  className="font-black text-blue-600 text-xl text-center"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-2">
                Revenue Target (IDR)
              </Label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">
                  Rp
                </span>
                <DnaInput
                  disabled={!canEditTargets}
                  type="number"
                  value={targetData.revenueTarget}
                  onChange={(e) =>
                    setTargetData({
                      ...targetData,
                      revenueTarget: Number(e.target.value),
                    })
                  }
                  className="h-16 pl-16 bg-blue-50/50 border-blue-100 rounded-xl font-black text-3xl text-blue-600 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col justify-between relative shadow-xl">
            <div className="absolute -right-6 -top-4 opacity-5">
              <Trophy size={140} />
            </div>

            <div className="space-y-8">
              <h4 className="text-lg font-bold uppercase tracking-widest text-blue-200">
                Quota Mapping
              </h4>
              <div className="space-y-4">
                <QuotaRow
                  disabled={!canEditTargets}
                  label="Qualified Leads"
                  value={targetData.leadTarget}
                  onChange={(v) =>
                    setTargetData({ ...targetData, leadTarget: v })
                  }
                />
                <QuotaRow
                  disabled={!canEditTargets}
                  label="Content Posts"
                  value={targetData.postTarget}
                  onChange={(v) =>
                    setTargetData({ ...targetData, postTarget: v })
                  }
                />
                <QuotaRow
                  disabled={!canEditTargets}
                  label="Ad Budget (Daily)"
                  value={targetData.adBudget}
                  onChange={(v) =>
                    setTargetData({ ...targetData, adBudget: v })
                  }
                />
              </div>
            </div>

            <DnaButton
              variant="outline"
              disabled={loading || !canEditTargets}
              onClick={submitTargets}
              className="w-full mt-8 text-blue-600 border-blue-200 hover:bg-blue-50 shadow-lg shadow-blue-900/40"
            >
              Commit Targets
            </DnaButton>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
