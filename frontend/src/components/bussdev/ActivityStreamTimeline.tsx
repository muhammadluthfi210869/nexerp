"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { 
  Loader2, 
  ShieldAlert, 
  RefreshCw, 
  Share2, 
  Zap, 
  Clock, 
  User,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ActivityStreamTimelineProps {
  leadId: string;
}

const EVENT_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  STATE_CHANGE: { 
    color: "bg-blue-500", 
    icon: RefreshCw, 
    label: "Stage Update" 
  },
  GATE_BLOCKED: { 
    color: "bg-rose-500", 
    icon: ShieldAlert, 
    label: "Gate Blocked" 
  },
  HANDOVER: { 
    color: "bg-amber-500", 
    icon: Share2, 
    label: "Dept Handover" 
  },
  OVERRIDE: { 
    color: "bg-purple-600", 
    icon: Zap, 
    label: "Emergency Override" 
  },
  MILESTONE: { 
    color: "bg-emerald-500", 
    icon: CheckCircle2, 
    label: "Milestone" 
  }
};

const DIVISION_COLORS: Record<string, string> = {
  BD: "text-blue-600 bg-blue-50",
  RND: "text-amber-600 bg-amber-50",
  SCM: "text-indigo-600 bg-indigo-50",
  FINANCE: "text-emerald-600 bg-emerald-50",
  MANAGEMENT: "text-purple-600 bg-purple-50",
};

export function ActivityStreamTimeline({ leadId }: ActivityStreamTimelineProps) {
  const { data: streams, isLoading } = useQuery({
    queryKey: ["activity-stream", leadId],
    queryFn: async () => (await api.get(`/bussdev/lead/${leadId}/activity-stream`)).data,
    enabled: !!leadId,
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Syncing Protocol Logs...</p>
    </div>
  );

  if (!streams || streams.length === 0) return (
    <div className="p-12 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
      <Clock className="h-8 w-8 text-slate-200 mx-auto mb-3" />
      <p className="text-xs font-bold text-slate-400 italic">No operational events logged yet for this lead.</p>
    </div>
  );

  return (
    <div className="relative space-y-8 pl-4">
      {/* Vertical Line */}
      <div className="absolute left-[2.25rem] top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-100 via-slate-100 to-transparent" />

      {streams.map((event: any, index: number) => {
        const config = EVENT_CONFIG[event.eventType] || { color: "bg-slate-400", icon: Clock, label: event.eventType };
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex gap-6 group">
            {/* Timeline Node */}
            <div className={cn(
              "z-10 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300",
              config.color
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm group-hover:shadow-md transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn(
                    "font-black text-[9px] uppercase tracking-tight px-3 py-1 rounded-lg border-none",
                    DIVISION_COLORS[event.senderDivision] || "bg-slate-100 text-slate-600"
                  )}>
                    {event.senderDivision} Division
                  </Badge>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                    {format(new Date(event.createdAt), "HH:mm • dd MMM yyyy")}
                  </span>
                </div>
                <Badge className={cn("text-[8px] font-black uppercase tracking-tight py-0.5 px-2 bg-slate-900")}>
                  {config.label}
                </Badge>
              </div>

              <p className="text-sm font-bold text-slate-800 leading-relaxed mb-3">
                {event.notes}
              </p>

              {/* Action Source Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-3 w-3 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                    Logged By: <span className="text-slate-600">{event.loggedBy}</span>
                  </span>
                </div>
                
                {/* Duration Badge for Stage Changes */}
                {event.payload?.durationHours !== undefined && (
                  <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-tight bg-blue-50 px-2.5 py-1 rounded-full">
                    <Clock className="h-3 w-3" /> {event.payload.durationHours}h SLA
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

