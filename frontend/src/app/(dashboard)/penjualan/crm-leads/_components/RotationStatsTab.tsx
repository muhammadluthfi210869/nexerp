"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/dna";
import type { CRMDistributionStats, LeadConversion } from "../_types/crm-leads.types";

interface RotationStatsTabProps {
  leadsLoading: boolean;
  leads: LeadConversion[];
  distributions: CRMDistributionStats;
}

export function RotationStatsTab({
  leadsLoading,
  leads,
  distributions,
}: RotationStatsTabProps) {
  return (
    <div className="space-y-6">
      {leadsLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Menghitung statistik rotasi...</div>
      ) : leads.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Belum Ada Data Statistik Lead</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Distribusi Lead per Sales</h3>
            <div className="space-y-3">
              {distributions.sales.map(([name, count]) => {
                const total = leads.length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{name}</span>
                      <span className="text-blue-600">
                        {count} lead ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Kanal Asal Traffic</h3>
            <div className="space-y-3">
              {distributions.traffics.map(([traffic, count]) => {
                const total = leads.length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={traffic} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{traffic}</span>
                      <span className="text-amber-600">
                        {count} lead ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
