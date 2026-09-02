"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle, Clock, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SLAAlert {
  id: string;
  type: "SAMPLE" | "BPOM" | "AR";
  label: string;
  detail: string;
  daysOverdue: number;
  leadId?: string;
}

interface SLABannerProps {
  className?: string;
}

export function SLABanner({ className }: SLABannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: alerts } = useQuery<SLAAlert[]>({
    queryKey: ["sla-alerts"],
    queryFn: async () => {
      const res = await api.get("/bussdev/analytics/pipeline-granular");
      const leads: any[] = res.data || [];
      const result: SLAAlert[] = [];

      for (const lead of leads) {
        const daysInStage = lead.durationDays || 0;

        if (daysInStage > 14 && !["WON_DEAL", "LOST", "ABORTED"].includes(lead.status)) {
          result.push({
            id: `sample-${lead.id}`,
            type: "SAMPLE",
            label: lead.brandName || lead.clientName,
            detail: `Terdampar ${daysInStage} hari di ${(lead.status || "").replace(/_/g, " ")}`,
            daysOverdue: daysInStage - 14,
            leadId: lead.id,
          });
        }
      }

      return result.slice(0, 5);
    },
    refetchInterval: 30000,
  });

  const visibleAlerts = (alerts || []).filter((a) => !dismissed.includes(a.id));

  if (!visibleAlerts.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visibleAlerts.map((alert) => {
        const config = {
          SAMPLE: { color: "border-rose-200 bg-rose-50", textColor: "text-rose-700", icon: Clock },
          BPOM: { color: "border-amber-200 bg-amber-50", textColor: "text-amber-700", icon: ShieldAlert },
          AR: { color: "border-orange-200 bg-orange-50", textColor: "text-orange-700", icon: AlertTriangle },
        }[alert.type];

        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-sm transition-all",
              config.color,
            )}
          >
            <div className={cn("p-2 rounded-xl bg-white/50", config.textColor)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("font-black uppercase text-[10px] tracking-tight", config.textColor)}>
                  {alert.label}
                </span>
                <span className={cn("font-black text-[8px] uppercase bg-white/60 px-2 py-0.5 rounded-full", config.textColor)}>
                  {alert.type} • {alert.daysOverdue}d overdue
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate">{alert.detail}</p>
            </div>
            <button
              onClick={() => setDismissed((prev) => [...prev, alert.id])}
              className={cn("p-1.5 rounded-lg hover:bg-white/50 transition-colors shrink-0", config.textColor)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

