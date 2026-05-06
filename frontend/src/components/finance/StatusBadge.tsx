"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
    OVERDUE: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
    SENT: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  };

  const style = statusStyles[status.toUpperCase()] || "bg-slate-100 text-slate-700";

  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider", style)}>
      {status}
    </Badge>
  );
}

