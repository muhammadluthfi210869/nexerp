"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  ClipboardCheck, 
  FlaskConical, 
  TrendingUp, 
  Zap,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { QCNotificationHub } from "@/components/dashboard/QCNotificationHub";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";

const SupplierRadar = dynamic(() => import("@/components/qc/PatternTrackers").then(m => ({ default: m.SupplierRadar })), {
  ssr: false,
  loading: () => <ChartSkeleton height={400} />,
});

const DefectPareto = dynamic(() => import("@/components/qc/PatternTrackers").then(m => ({ default: m.DefectPareto })), {
  ssr: false,
  loading: () => <ChartSkeleton height={400} />,
});

const QualityFunnel = dynamic(() => import("@/components/qc/PatternTrackers").then(m => ({ default: m.QualityFunnel })), {
  ssr: false,
  loading: () => <ChartSkeleton height={400} />,
});

const fetchQCStats = async () => (await api.get("/production/qc/stats")).data;
const fetchPendingInspections = async () => (await api.get("/production/qc/pending")).data;

export default function QCDashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({ 
    queryKey: ["qcStats"], 
    queryFn: fetchQCStats 
  });

  const { data: pending, isLoading: isPendingLoading } = useQuery({ 
    queryKey: ["qcPendingSummarized"], 
    queryFn: fetchPendingInspections 
  });

  if (isStatsLoading || isPendingLoading) return (
     <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Zap className="w-12 h-12 text-blue-600 animate-pulse" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-tight italic">Brewing Quality Intelligence...</p>
        </div>
     </div>
  );

  // Mocked data for Pattern Trackers (Phase 3)
  const radarData = [
    { category: 'Chemicals', value: 92 },
    { category: 'Packaging', value: 85 },
    { category: 'Labels', value: 98 },
    { category: 'Finished', value: 88 },
    { category: 'Storage', value: 95 },
  ];

  const paretoData = [
    { reason: 'Viscosity Out', count: 45 },
    { reason: 'Leakage', count: 32 },
    { reason: 'Color Variation', count: 18 },
    { reason: 'Weight Issue', count: 12 },
    { reason: 'Others', count: 5 },
  ];

  const funnelData = [
    { stage: 'Bulk Mixing', qty: 1000 },
    { stage: 'Filling', qty: 980 },
    { stage: 'Capping', qty: 975 },
    { stage: 'Packaging', qty: 950 },
    { stage: 'Final QC', qty: 945 },
  ];

  return (
    <div className="p-8 space-y-8 bg-base min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Quality Intelligence & Audit Control
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-black text-[10px] px-3">PHASE 3 READY</Badge>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Zero-Defect Protocol / Automated COPQ Tracking</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-tight border-slate-200 shadow-sm">
            System Health: 100%
          </Button>
          <Button className="bg-slate-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-tight shadow-xl">
            Audit Export (.PDF)
          </Button>
        </div>
      </div>

      {/* ADVANCED METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="First Time Yield (FTY)" 
          value="94.2%" 
          sub="No Intervention Batches" 
          icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
          color="emerald"
          trend="Target: 95%"
        />
        <StatCard 
          label="Estimated COPQ" 
          value="Rp 14.5M" 
          sub="Cost of Poor Quality" 
          icon={<Activity className="w-6 h-6 text-rose-600" />}
          color="rose"
          trend="-2.4% MoM"
          isAlert={true}
        />
        <StatCard 
          label="Leakage Ratio" 
          value="0.84%" 
          sub="Production Shrinkage" 
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          color="amber"
          trend="+0.1%"
        />
        <StatCard 
          label="Hold Anomaly" 
          value="4" 
          sub="Batches Exceeding SLA" 
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          color="blue"
          isAlert={true}
        />
      </div>

      {/* PATTERN TRACKERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SupplierRadar data={radarData} />
        <DefectPareto data={paretoData} />
        <QualityFunnel data={funnelData} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT: INSPECTION LOGS */}
        <div className="col-span-8 space-y-8">
           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50 to-transparent">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                     <FileSearch className="w-5 h-5 text-blue-600" />
                   </div>
                   <div>
                     <h2 className="font-black text-slate-900 uppercase tracking-tighter text-base">Anomaly Detection Log</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time Variance Watcher</p>
                   </div>
                </div>
                <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-black text-[9px] px-3">HIGH RISK DETECTED</Badge>
              </div>
              
              <div className="p-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference No</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Anomalies</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { id: 'BCH-00241', type: 'Viscosity Error', impact: 'Rp 4.5M', status: 'PENDING_PIN' },
                      { id: 'PO-2026-92', type: 'Vendor Blacklist', impact: 'Risk Block', status: 'OVERRIDDEN' },
                      { id: 'BCH-00238', type: 'Weight Under', impact: 'Rp 1.2M', status: 'RESOLVED' },
                    ].map((row, i) => (
                      <tr key={i} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-xs font-black text-slate-900 italic">{row.id}</td>
                        <td className="py-4">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{row.type}</span>
                        </td>
                        <td className="py-4 text-xs font-black text-rose-600">{row.impact}</td>
                        <td className="py-4">
                          <Badge className={cn(
                            "font-black text-[8px] uppercase px-2",
                            row.status === 'PENDING_PIN' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Card>
        </div>

        {/* RIGHT: REALTIME QUEUE */}
        <div className="col-span-4 space-y-6">
           <Card className="p-6 border-none shadow-sm rounded-[2rem] bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-24 h-24 text-white" />
              </div>
              
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                 <h3 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60 italic">Live Workbench Queue</h3>
              </div>
              
              <div className="space-y-6">
                 {pending?.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-2 transition-transform">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-blue-400">
                             #{i+1}
                          </div>
                          <div>
                             <p className="text-[11px] font-black uppercase tracking-tight">{p.woNumber}</p>
                             <p className="text-[9px] font-bold opacity-40 uppercase tracking-tight italic">{p.stage}</p>
                          </div>
                       </div>
                       <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30 font-black text-[8px] uppercase group-hover:bg-blue-600 group-hover:text-white transition-colors">Start QC</Badge>
                    </div>
                 ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                 <Button className="w-full bg-white text-slate-900 hover:bg-blue-50 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl h-12 shadow-xl shadow-white/5">
                    Enter Focus-Mode
                 </Button>
              </div>
           </Card>

           <Card className="p-6 border-none shadow-sm rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 mb-2">Audit Compliance Score</h4>
              <div className="h-1.5 w-full bg-slate-300 rounded-full overflow-hidden mb-4">
                <div className="h-full w-[98%] bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-500">Integrity Check</span>
                <span className="text-[10px] font-black text-blue-600">98.5%</span>
              </div>
           </Card>
        </div>
      </div>
      <QCNotificationHub />
    </div>
  );
}

// --- HELPERS ---

function StatCard({ label, value, sub, icon, color, trend, isAlert }: any) {
  const colors: any = {
    emerald: "border-emerald-500 bg-emerald-50/20",
    blue: "border-blue-500 bg-blue-50/20",
    amber: "border-amber-500 bg-amber-50/20",
    rose: "border-rose-500 bg-rose-50/20",
  };

  return (
    <Card className={cn(
      "p-6 border-none shadow-sm rounded-2xl bg-white border-l-4 group transition-all hover:shadow-xl hover:shadow-slate-200/50",
      colors[color],
      isAlert && "bg-rose-50/30 border-rose-600"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl bg-white shadow-sm border border-slate-100 transition-transform group-hover:scale-110")}>
           {icon}
        </div>
        {trend && (
          <Badge className="bg-slate-900 text-white font-black text-[9px] px-2 py-0.5">{trend}</Badge>
        )}
      </div>
      <div>
         <h3 className={cn("text-3xl font-black italic tracking-tighter text-slate-900", isAlert && "text-rose-600")}>{value}</h3>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1 italic">{label}</p>
         <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{sub}</p>
      </div>
    </Card>
  );
}

