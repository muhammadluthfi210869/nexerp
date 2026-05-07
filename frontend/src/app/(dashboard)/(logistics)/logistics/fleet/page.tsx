"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Truck, 
  Search, 
  MapPin, 
  Navigation, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  User,
  Fuel,
  Maximize2,
  Calendar,
  MoreVertical,
  Layers,
  Box,
  PlusCircle,
  Globe,
  Radar
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function FleetControlCenter() {
  const { data: fleet, isLoading } = useQuery({
    queryKey: ["fleet-status"],
    queryFn: async () => {
      return [
        { id: "FLT-001", vehicle: "HINO WINGBOX (B 1234 ABC)", driver: "SUDIRMAN", status: "ON_ROUTE", destination: "SEMARANG HUB", load: "95%", eta: "14:20" },
        { id: "FLT-002", vehicle: "ISUZU GIGA (B 5678 XYZ)", driver: "BAMBANG", status: "LOADING", destination: "BANDUNG DIST", load: "40%", eta: "---" },
        { id: "FLT-003", vehicle: "MITSUBISHI FUSO (B 9012 DEF)", driver: "EKO", status: "IDLE", destination: "---", load: "0%", eta: "---" },
        { id: "FLT-004", vehicle: "BLIND VAN (B 3456 GHI)", driver: "AGUS", status: "DELIVERED", destination: "LOCAL STORE A", load: "0%", eta: "DONE" },
      ];
    }
  });

  return (
    <div className="space-y-8">
      {/* 🚛 I. FLEET COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">FLEET TELEMETRY ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">FLEET <span className="text-slate-300">CONTROL CENTER</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">LIVE ASSET TRACKING & DISPATCH PROTOCOLS</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-brand-black uppercase">FLEET UPTIME</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">MAXIMIZED CAPACITY</p>
           </div>
           <div className="flex gap-2">
              <Button variant="outline" className="h-14 px-6 border border-slate-100 bg-white text-brand-black rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-sm italic hover:bg-slate-50 transition-all">
                 <Calendar className="mr-2 h-4 w-4 text-orange-500" /> SCHEDULE
              </Button>
              <Button className="h-14 px-8 bg-brand-black text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none italic">
                 <PlusCircle className="mr-2 h-5 w-5" /> NEW SHIPMENT
              </Button>
           </div>
        </div>
      </div>

      {/* 📡 II. STRATEGIC TELEMETRY HUB */}
      <Card className="bento-card bg-brand-black h-[500px] relative overflow-hidden group">
         <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
         
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
               <div className="absolute -top-32 -left-32 h-64 w-64 bg-orange-500/10 blur-[100px] rounded-full animate-pulse" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="p-8 rounded-full bg-orange-500/5 border border-orange-500/10 animate-ping absolute inset-0 scale-150" />
                  <Globe className="h-20 w-20 text-orange-500/50 relative z-10" />
               </div>
               <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10 whitespace-nowrap">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">CENTRAL LOGISTICS NODE • STANDBY</span>
               </div>
            </div>
         </div>

         {/* Mock Markers */}
         <div className="absolute top-1/4 left-1/3">
            <div className="relative group/marker cursor-pointer">
               <Navigation className="h-8 w-8 text-emerald-500 rotate-45 animate-bounce" />
               <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-brand-black border border-white/10 text-white px-5 py-2 rounded-xl font-black text-[9px] whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-all uppercase tracking-widest italic shadow-2xl">
                  FLT-001 • 98 KM/H • SEMARANG
               </div>
            </div>
         </div>

         <div className="absolute bottom-1/3 right-1/4">
            <div className="relative group/marker cursor-pointer">
               <Navigation className="h-8 w-8 text-orange-500 rotate-[120deg] animate-pulse" />
               <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-brand-black border border-white/10 text-white px-5 py-2 rounded-xl font-black text-[9px] whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-all uppercase tracking-widest italic shadow-2xl">
                  FLT-002 • LOADING • BANDUNG
               </div>
            </div>
         </div>

         {/* Navigation Overlays */}
         <div className="absolute bottom-8 right-8 flex flex-col gap-3">
            <Button size="icon" className="h-14 w-14 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-orange-500 transition-all">
               <Maximize2 className="h-5 w-5" />
            </Button>
            <Button size="icon" className="h-14 w-14 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-orange-500 transition-all">
               <Radar className="h-5 w-5" />
            </Button>
         </div>

         <div className="absolute top-8 left-8">
            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[10px] tracking-[0.2em] px-6 py-2.5 rounded-full flex items-center gap-3 italic">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE TELEMETRY STREAM
            </Badge>
         </div>
      </Card>

      {/* 🚛 III. FLEET ASSET REGISTRY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-brand-black rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. FLEET ASSET REGISTRY</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {fleet?.map((unit: any) => (
              <Card key={unit.id} className="bento-card p-8 bg-white group hover:translate-y-[-5px] transition-all relative overflow-hidden">
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-orange-600 transition-all shadow-lg shadow-slate-200">
                       <Truck className="h-6 w-6" />
                    </div>
                    <span className={cn(
                       "px-4 py-1 rounded-full font-black uppercase tracking-widest text-[8px] border tabular shadow-sm",
                       unit.status === 'ON_ROUTE' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                       unit.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                       unit.status === 'LOADING' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                       {unit.status.replace('_', ' ')}
                    </span>
                 </div>

                 <div className="space-y-1 relative z-10">
                    <h4 className="text-lg font-black italic uppercase tracking-tighter text-brand-black group-hover:text-orange-600 transition-colors">{unit.vehicle}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{unit.id} • {unit.driver}</p>
                 </div>

                 <div className="mt-8 space-y-4 relative z-10">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">PAYLOAD</span>
                       <span className="text-brand-black tabular">{unit.load}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div 
                          className={cn(
                             "h-full transition-all duration-1000",
                             parseInt(unit.load) > 80 ? "bg-rose-500" : "bg-orange-500"
                          )} 
                          style={{ width: unit.load }} 
                       />
                    </div>
                 </div>

                 <div className="mt-8 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-brand-black transition-all">
                    <div>
                       <p className="text-[7px] font-black uppercase text-slate-400 group-hover:text-orange-500">TARGET</p>
                       <p className="text-[9px] font-black uppercase italic group-hover:text-white truncate max-w-[80px]">{unit.destination}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[7px] font-black uppercase text-slate-400 group-hover:text-orange-500">ETA</p>
                       <p className="text-[9px] font-black uppercase italic group-hover:text-white tabular">{unit.eta}</p>
                    </div>
                 </div>
              </Card>
           ))}
        </div>
      </div>

      {/* 🚀 IV. PERFORMANCE COMMANDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <PerformanceCard label="FUEL INTELLIGENCE" desc="Live monitoring of fleet consumption efficiency and thermal metrics." icon={Fuel} color="bg-orange-500" />
         <PerformanceCard label="DRIVER GUARD" desc="Tracking rest-cycles, safety protocols, and delivery velocity scores." icon={ShieldCheck} color="bg-brand-black" />
         <PerformanceCard label="ROUTE ENGINE" desc="AI-powered planning to minimize transit latency and carbon output." icon={Activity} color="bg-slate-100" invert={true} />
      </div>
    </div>
  );
}

function PerformanceCard({ label, desc, icon: Icon, color, invert = false }: any) {
  return (
     <Card className={cn("bento-card p-10 overflow-hidden relative group transition-all hover:translate-y-[-5px]", color, invert ? "text-brand-black" : "text-white")}>
        <div className="relative z-10 flex flex-col gap-8">
           <div className={cn("h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", invert ? "bg-white border border-slate-100" : "bg-white/10 backdrop-blur-md border border-white/10")}>
              <Icon className={cn("h-10 w-10", invert ? "text-orange-500" : "text-white")} />
           </div>
           <div>
              <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{label}</h4>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mt-4 leading-relaxed opacity-60", invert ? "text-slate-500" : "text-slate-400")}>{desc}</p>
           </div>
        </div>
        <Icon className={cn("h-48 w-48 absolute -right-12 -bottom-12 opacity-5 rotate-12 transition-transform group-hover:scale-110", invert ? "text-black" : "text-white")} />
     </Card>
  );
}

