"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FlaskConical, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Timer,
  History,
  Beaker,
  Thermometer,
  CloudRain,
  ShieldCheck,
  MoreVertical,
  Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function StabilityTestingPage() {
  const { data: stabilityLogs, isLoading } = useQuery({
    queryKey: ["stability-logs"],
    queryFn: async () => {
      const res = await api.get("/rnd/lab-test-results", { params: { type: "stability" } });
      return (res.data || []).map((r: any) => ({
        id: r.id.substring(0, 8).toUpperCase(),
        product: r.formula?.name || "Unknown",
        batch: r.formula?.sampleRequest?.sampleCode || "—",
        startDate: new Date(r.testDate).toISOString().split('T')[0],
        currentMonth: Math.floor((Date.now() - new Date(r.testDate).getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1,
        status: r.stability40C === "STABLE" && r.stabilityRT === "STABLE" ? "STABLE" : "MONITORING",
        nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));
    }
  });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Product Shelf-Life Monitoring</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Stability <span className="text-blue-500">Testing</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Accelerated & real-time stability verification protocols
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <History className="mr-2 h-4 w-4" /> Stability Archives
           </Button>
           <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 font-black uppercase tracking-tighter text-sm border-none">
              <Timer className="mr-2 h-5 w-5" /> Start New Study
           </Button>
        </div>
      </div>

      {/* Environmental Chamber Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-slate-900 text-white relative overflow-hidden group">
            <div className="relative z-10">
               <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Chamber A: Accelerated</span>
               </div>
               <h3 className="text-5xl font-black italic tracking-tighter">40°C <span className="text-xl font-light">/ 75% RH</span></h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Status: Operating within scientific threshold</p>
            </div>
            <Activity className="h-24 w-24 text-white/5 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-700" />
         </Card>

         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-white">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
               <CloudRain className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-tight">Chamber B: Real-Time</span>
            </div>
            <h3 className="text-5xl font-black italic tracking-tighter text-slate-900">25°C <span className="text-xl font-light text-slate-400">/ 60% RH</span></h3>
            <p className="text-[9px] font-black text-emerald-600 uppercase mt-4">Status: Stable</p>
         </Card>

         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-blue-600 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Active Studies</p>
            <h3 className="text-5xl font-black italic tracking-tighter mt-2">12 <span className="text-lg font-light">Samples</span></h3>
            <div className="mt-6 flex gap-2">
               <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase px-3 py-1">Skin: 8</Badge>
               <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase px-3 py-1">Color: 4</Badge>
            </div>
         </Card>
      </div>

      {/* Stability Logs Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Study ID</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Product / Formulation</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Interval</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Next Test Gate</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Integrity Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {stabilityLogs?.map((log: any) => (
                  <TableRow key={log.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                              <Timer className="h-5 w-5 text-blue-400" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{log.id}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Started: {log.startDate}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Beaker className="h-4 w-4 text-slate-400" />
                           </div>
                           <div>
                              <p className="font-black text-slate-900 text-sm uppercase italic">{log.product}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Batch: {log.batch}</p>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className="bg-slate-100 text-slate-900 border-none font-black text-[10px] px-3 py-1">
                           MONTH {log.currentMonth}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-slate-400" />
                           <p className="font-bold text-slate-500 text-xs uppercase">{log.nextTest}</p>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          log.status === 'STABLE' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700 animate-pulse"
                        )}>
                           {log.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <Button className="h-11 px-6 bg-white hover:bg-slate-900 hover:text-white text-slate-900 font-black uppercase tracking-tight text-[10px] rounded-xl shadow-md border-2 border-slate-50 transition-all italic">
                           Log Result <ChevronRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>
    </div>
  );
}

