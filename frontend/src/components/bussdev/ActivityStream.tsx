"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  RefreshCw, ShieldAlert, Share2, Zap, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface ActivityStreamProps {
  leadId: string;
  maxItems?: number;
  pollInterval?: number;
  className?: string;
}

const EVENT_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  STATE_CHANGE: { color: "bg-blue-500", icon: RefreshCw, label: "Stage Update" },
  GATE_BLOCKED: { color: "bg-rose-500", icon: ShieldAlert, label: "Gate Blocked" },
  GATE_OPENED: { color: "bg-emerald-500", icon: CheckCircle2, label: "Gate Opened" },
  HANDOVER: { color: "bg-amber-500", icon: Share2, label: "Dept Handover" },
  OVERRIDE: { color: "bg-purple-500", icon: Zap, label: "Emergency Override" },
  MILESTONE: { color: "bg-emerald-500", icon: CheckCircle2, label: "Milestone" },
  SLA_BREACH: { color: "bg-rose-500", icon: AlertTriangle, label: "SLA Breach" },
  STOCK_CHECK_READY: { color: "bg-indigo-500", icon: RefreshCw, label: "Stock Check" },
  STOCK_CHECK_SHORTAGE: { color: "bg-rose-500", icon: AlertTriangle, label: "Stock Shortage" },
  HKI_BPOM_REGISTRATION: { color: "bg-cyan-500", icon: ShieldAlert, label: "BPOM Reg" },
};

const DIV_COLORS: Record<string, string> = {
  BD: "text-blue-600 bg-blue-50",
  RND: "text-amber-600 bg-amber-50",
  SCM: "text-indigo-600 bg-indigo-50",
  FINANCE: "text-emerald-600 bg-emerald-50",
  MANAGEMENT: "text-purple-600 bg-purple-50",
  CREATIVE: "text-violet-600 bg-violet-50",
  WAREHOUSE: "text-cyan-600 bg-cyan-50",
  LEGAL: "text-slate-600 bg-slate-50",
  SYSTEM: "text-slate-400 bg-slate-100",
};

export function ActivityStream({ leadId, maxItems = 20, pollInterval, className }: ActivityStreamProps) {
  const now = new Date().getTime();

  const { data: events, isLoading } = useQuery({
    queryKey: ["activity-stream", leadId],
    queryFn: async () => (await api.get(`/bussdev/lead/${leadId}/activity-stream`)).data as any[],
    enabled: !!leadId,
    refetchInterval: pollInterval,
  });

  if (isLoading) return <LoadingSkeleton rows={4} className="p-4" />;
  if (!events || events.length === 0) return <EmptyState title="Belum ada aktivitas" description="Riwayat aktivitas untuk lead ini akan muncul di sini" />;

  const displayEvents = events.slice(0, maxItems);

  return (
    <div className={cn("space-y-3", className)}>
      {displayEvents.map((event: any) => {
        const evConfig = EVENT_CONFIG[event.eventType] || { color: "bg-slate-500", icon: RefreshCw, label: event.eventType };
        const Icon = evConfig.icon;
        const divColor = DIV_COLORS[event.senderDivision] || "text-slate-600 bg-slate-50";

        return (
          <div key={event.id} className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0", evConfig.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="w-[1px] flex-1 bg-slate-200 group-last:hidden" />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", divColor)}>
                  {event.senderDivision}
                </span>
                <Badge className="bg-slate-100 text-slate-500 font-black text-[7px] uppercase tracking-wider border-none rounded-md px-1.5 py-0">
                  {evConfig.label}
                </Badge>
              </div>
              <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{event.notes || "—"}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                  {new Date(event.createdAt).toLocaleString("id-ID")}
                </span>
                {event.deadlineAt && (
                  <span className={cn(
                    "flex items-center gap-1 text-[8px] font-black uppercase tracking-tight",
                    new Date(event.deadlineAt) < new Date() ? "text-rose-500" : "text-emerald-500"
                  )}>
                    <Clock className="w-2.5 h-2.5" />
                    {Math.ceil((new Date(event.deadlineAt).getTime() - now) / (1000 * 60 * 60 * 24))}d remaining
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function getEventIcon(eventType: string) {
  const cfg = EVENT_CONFIG[eventType];
  return cfg?.icon || RefreshCw;
}

