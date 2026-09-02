"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Award, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface ProfitabilityCardProps {
  profit?: number;
  margin?: number;
  isLoading?: boolean;
}

export function ProfitabilityCard({ profit = 0, margin = 0, isLoading }: ProfitabilityCardProps) {
  if (isLoading) return <Skeleton className="h-[160px] w-full rounded-3xl" />;

  return (
    <Card className="bg-white shadow-xl border-none rounded-3xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-100 transition-colors" />
      <CardContent className="pt-8 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-purple-500/10 p-3 rounded-2xl">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Net Profit</span>
            <span className={`text-2xl font-black tracking-tight ${profit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                {formatCurrency(profit)}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 mt-6 border-t border-black/[0.03] pt-4">
            <div className="flex justify-between text-[10px] uppercase font-bold text-text-muted">
                <span>Profit Margin</span>
                <span className="text-purple-700">{margin.toFixed(1)}%</span>
            </div>
            <Progress value={margin} className="h-1.5 bg-purple-100" />
        </div>
      </CardContent>
    </Card>
  );
}

