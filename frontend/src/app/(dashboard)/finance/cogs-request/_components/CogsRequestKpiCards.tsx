import React from "react";
import { FileText, PieChart, TrendingUp, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/dna";
import { CogsRequestKpis } from "../_types/cogs-request.types";

interface CogsRequestKpiCardsProps {
  kpis: CogsRequestKpis;
}

export function CogsRequestKpiCards({ kpis }: CogsRequestKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        label="ACTIVE REQUESTS"
        value={String(kpis.activeCount)}
        icon={<FileText className="text-blue-500" />}
      />
      <StatCard
        label="CLOSED REQUESTS"
        value={String(kpis.closedCount)}
        icon={<PieChart className="text-emerald-500" />}
      />
      <StatCard
        label="TOTAL RECORDS"
        value={String(kpis.totalRecords)}
        icon={<TrendingUp className="text-blue-500" />}
      />
      <StatCard
        label="FILTERED"
        value={String(kpis.filteredCount)}
        icon={<ShieldAlert className="text-rose-500" />}
      />
    </div>
  );
}
