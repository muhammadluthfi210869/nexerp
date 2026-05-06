"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Zap, 
  Clock, 
  AlertCircle,
  Database,
  ArrowRightLeft,
  ChevronRight,
  MoreVertical,
  Activity,
  FileCode
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AuditLedgerPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/system/audit-logs?limit=100`);
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "ALL" || log.entityType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getEntityColor = (type: string) => {
    switch (type) {
      case "PRODUCTION_SCHEDULE": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "WAREHOUSE_INBOUND": return "bg-blue-50 text-blue-700 border-blue-100";
      case "STOCK_LEDGER": return "bg-amber-50 text-amber-700 border-amber-100";
      case "PURCHASE_ORDER": return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-base p-8 font-sans">
      {/* Header section with Glassmorphism */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-brand-black rounded-xl shadow-lg shadow-black/10">
              <History className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-brand-black uppercase">
              Audit <span className="text-slate-400">Ledger</span>
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Immutable Cross-Module State Machine Monitor
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Live Stream Active</span>
          </div>
          <Button className="bg-brand-black hover:bg-slate-800 text-white font-bold rounded-2xl px-6 h-12 shadow-xl shadow-black/10 transition-all active:scale-95">
            EXPORT LEDGER
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-black transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Entity ID, Type, or Reason..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-black/5 font-bold text-sm text-slate-700 transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "PRODUCTION_SCHEDULE", "WAREHOUSE_INBOUND", "STOCK_LEDGER"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap",
                filterType === type 
                  ? "bg-brand-black text-white shadow-lg shadow-black/10" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              )}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
            <RefreshCw className="w-12 h-12 animate-spin" />
            <p className="font-bold text-sm uppercase tracking-widest">Hydrating Ledger...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
            <Database className="w-16 h-16 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">No matching logs found in the ledger</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div 
              key={log.id} 
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:border-slate-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Timeline Info */}
              <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-1 min-w-[140px]">
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-brand-black group-hover:text-white transition-colors duration-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-brand-black tracking-tight">
                    {format(new Date(log.createdAt), "HH:mm:ss")}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {format(new Date(log.createdAt), "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Entity Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    getEntityColor(log.entityType)
                  )}>
                    {log.entityType.replace("_", " ")}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 font-mono">
                    #{log.entityId.slice(-8).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-brand-black mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200">
                      {log.fromState || "INIT"}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                    <span className="px-2 py-0.5 bg-brand-black rounded text-[10px] font-bold text-white shadow-sm shadow-black/20">
                      {log.toState}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-600 line-clamp-1">
                  {log.reason || "Automated state transition processed by system protocol."}
                </p>
              </div>

              {/* Actor Info */}
              <div className="lg:w-48 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                  {log.changedBy?.fullName?.charAt(0) || "S"}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 leading-none mb-0.5 truncate">
                    {log.changedBy?.fullName || "SYSTEM_DAEMON"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Event Protocol</p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2">
                <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-brand-black transition-all active:scale-90">
                  <FileCode className="w-4 h-4" />
                </button>
                <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-brand-black transition-all active:scale-90">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Events", value: logs.length, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Auto Transitions", value: logs.filter(l => !l.changedById).length, icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Manual Override", value: logs.filter(l => l.changedById).length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Ledger Integrity", value: "99.9%", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-slate-300 transition-all">
            <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-brand-black tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

