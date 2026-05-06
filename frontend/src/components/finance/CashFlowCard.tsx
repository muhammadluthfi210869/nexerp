"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CashFlowCardProps {
  netCashFlow?: number;
  isLoading?: boolean;
}

export function CashFlowCard({ netCashFlow = 0, isLoading }: CashFlowCardProps) {
  if (isLoading) return <Skeleton className="h-[160px] w-full rounded-3xl" />;

  return (
    <Card className="bg-white shadow-xl border-none rounded-3xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
      <CardContent className="pt-8 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-blue-500/10 p-3 rounded-2xl">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Net Cash Flow</span>
            <span className={`text-2xl font-black tracking-tight ${netCashFlow >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {formatCurrency(netCashFlow)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-black/[0.03] pt-4 mt-6">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted opacity-60">Status</span>
                <span className="text-sm font-bold text-text-main capitalize">
                    {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
                </span>
            </div>
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Landmark className="w-3 h-3" />
                <span className="text-[10px] font-bold">Liquid Assets</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

