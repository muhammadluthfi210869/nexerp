"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CogsHppCardProps {
  totalCogs: number;
  previousCogs: number;
  isLoading?: boolean;
}

export function CogsHppCard({ totalCogs, previousCogs, isLoading }: CogsHppCardProps) {
  const diff = totalCogs - previousCogs;
  const percentChange = previousCogs > 0 ? (diff / previousCogs) * 100 : 0;
  const isBetter = diff <= 0; // Lower COGS is usually better

  if (isLoading) return <div className="h-40 w-full bg-slate-100 animate-pulse rounded-3xl" />;

  return (
    <TooltipProvider>
      <Card className="p-8 border-none bg-white shadow-sm flex flex-col justify-between rounded-[32px] group hover:scale-[1.02] transition-all relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
            <TrendingDown size={120} className="text-slate-900" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Cost of Goods Sold (COGS)</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-slate-300" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white font-bold text-[10px] uppercase p-3 rounded-xl max-w-[200px]">
                Total production costs including materials, labor, and factory overhead (HPP).
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-3xl font-black tracking-tighter text-slate-900">
            Rp {totalCogs.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 ${isBetter ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {isBetter ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            <span className="text-[10px] font-black uppercase tracking-tight">{Math.abs(percentChange).toFixed(1)}%</span>
          </div>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">vs Last Month</span>
        </div>
      </Card>
    </TooltipProvider>
  );
}

