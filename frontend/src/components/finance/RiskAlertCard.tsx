"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface RiskAlertCardProps {
  overdueAR?: number;
  overdueAP?: number;
  isLoading?: boolean;
}

export function RiskAlertCard({ overdueAR = 0, overdueAP = 0, isLoading }: RiskAlertCardProps) {
  if (isLoading) return <Skeleton className="h-[160px] w-full rounded-3xl" />;

  const hasUrgentDebt = overdueAR > 0 || overdueAP > 0;

  return (
    <Card className={`shadow-xl border-none rounded-3xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 ${hasUrgentDebt ? 'bg-red-50/50' : 'bg-white'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-200 transition-colors" />
      <CardContent className="pt-8 relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`${hasUrgentDebt ? 'bg-red-500/20 animate-pulse' : 'bg-slate-500/10'} p-3 rounded-2xl`}>
            <ShieldAlert className={`w-6 h-6 ${hasUrgentDebt ? 'text-red-600' : 'text-slate-600'}`} />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Financial Risk Alert</span>
            <span className={`text-xl font-black tracking-tight ${hasUrgentDebt ? 'text-red-700' : 'text-slate-700'}`}>
                {hasUrgentDebt ? 'Action Required' : 'No Critical Alerts'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-black/[0.03] pt-4">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted opacity-60">Overdue Piutang</span>
                <span className={`font-sans text-sm font-bold ${overdueAR > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                    {formatCurrency(overdueAR)}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-text-muted opacity-60">Overdue Hutang</span>
                <span className={`font-sans text-sm font-bold ${overdueAP > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                    {formatCurrency(overdueAP)}
                </span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

