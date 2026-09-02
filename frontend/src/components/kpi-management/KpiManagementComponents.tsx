"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KPIStatus, KPICalculationType } from "@/types/kpi-management";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown, Building2, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function KPIStatusBadge({ status }: { status: KPIStatus }) {
  switch (status) {
    case "EXCELLENT":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          EXCELLENT (&ge;100%)
        </span>
      );
    case "ON_TRACK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          ON TRACK (90–99%)
        </span>
      );
    case "AT_RISK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          AT RISK (80–89%)
        </span>
      );
    case "OFF_TRACK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <XCircle className="w-3 h-3 text-rose-600" />
          OFF TRACK (&lt;80%)
        </span>
      );
    default:
      return <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded">{status}</span>;
  }
}

export function KPITrendIndicator({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
        <TrendingUp className="w-3.5 h-3.5" />
        +{trend.toFixed(1)} pts
      </span>
    );
  } else if (trend < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600">
        <TrendingDown className="w-3.5 h-3.5" />
        {trend.toFixed(1)} pts
      </span>
    );
  }
  return <span className="text-[11px] font-medium text-slate-400">0.0 pts</span>;
}

export function KpiNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/kpi-management/department", label: "DEPARTMENT KPI OVERVIEW", icon: Building2 },
    { href: "/kpi-management/individual", label: "INDIVIDUAL KPI OVERVIEW", icon: Users },
    { href: "/kpi-management/settings", label: "KPI CONFIG & TARGET SETTINGS", icon: Settings },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 h-[46px] overflow-x-auto shadow-2xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-2 whitespace-nowrap text-decoration-none cursor-pointer",
              isActive
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
