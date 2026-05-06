"use client";

import { useState } from "react";
import { 
  Terminal, 
  ShieldCheck, 
  Activity, 
  Search, 
  Users, 
  FlaskConical, 
  History, 
  CreditCard,
  Zap,
  Globe,
  Lock,
  Boxes
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Import Departmental Views (We will use the actual page components or variants)
import CommercialDashboard from "../commercial/page";
import RndDashboard from "../rnd/page";
import ProductionFloor from "../production-floor/page";
import FinanceDashboard from "../finance/page";

export default function SuperAdminTerminal() {

  const stats = [
    { label: "Network status", value: "ENCRYPTED", icon: ShieldCheck, color: "text-emerald-500" },
    { label: "Active Nodes", value: "14/14", icon: Globe, color: "text-blue-500" },
    { label: "Logic Interlocks", value: "ACTIVE", icon: Lock, color: "text-orange-500" },
    { label: "System Load", value: "1.2ms", icon: Activity, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Header / Mission Control Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white text-black rounded-sm group hover:rotate-90 transition-transform cursor-pointer">
                 <Terminal size={20} />
              </div>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 font-sans text-[9px] uppercase tracking-tight bg-emerald-500/5">
                Auth Status: SUPER_ADMIN_OVERRIDE
              </Badge>
           </div>
           <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
             Executive Command <br/>
             <span className="text-zinc-500 opacity-50">Terminal v7.0</span>
           </h1>
           <p className="text-zinc-500 font-sans text-sm uppercase tracking-tight mt-4 max-w-2xl leading-relaxed">
             Hyper-Unified Audit Interface. Monitoring cross-departmental UX integrity and data interlocks across the entire ERP ecosystem from a single encrypted link.
           </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          {stats.map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-md hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tight">{stat.label}</span>
              </div>
              <p className="text-lg font-sans font-bold text-white tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Navigation Tabs */}
      <Tabs defaultValue="marketing" className="w-full space-y-8">
        <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-zinc-900/50">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl w-full flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="marketing" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <Users className="w-3 h-3 mr-2" /> Commercial
            </TabsTrigger>
            <TabsTrigger value="rnd" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <FlaskConical className="w-3 h-3 mr-2" /> R&D Lab
            </TabsTrigger>
            <TabsTrigger value="production" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <History className="w-3 h-3 mr-2" /> Factory Floor
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <CreditCard className="w-3 h-3 mr-2" /> Treasury
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <Boxes className="w-3 h-3 mr-2" /> Logistics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Commercial Department UX */}
        <TabsContent value="marketing" className="mt-0">
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-3xl p-1 overflow-hidden">
            <div className="bg-zinc-900/50 p-6 flex items-center justify-between border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white uppercase italic">Commercial Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Lead Attribution & Prospect Funnel UX</p>
              </div>
              <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-white group">
                <Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Inspect Source Code
              </Button>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <CommercialDashboard />
            </div>
          </div>
        </TabsContent>

        {/* R&D Department UX */}
        <TabsContent value="rnd" className="mt-0">
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-3xl p-1 overflow-hidden">
             <div className="bg-zinc-900/50 p-6 flex items-center justify-between border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white uppercase italic">Chemical R&D Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Dosage Precision & Formula Interlocks</p>
              </div>
              <Badge className="bg-orange-500 text-black font-black italic">INTERLOCK_ACTIVE: 100%_DOSAGE</Badge>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <RndDashboard />
            </div>
          </div>
        </TabsContent>

        {/* Production Department UX */}
        <TabsContent value="production" className="mt-0">
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-3xl p-1 overflow-hidden">
             <div className="bg-zinc-900/50 p-6 flex items-center justify-between border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white uppercase italic">Floor Execution Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Mass Balance & Station Telemetry</p>
              </div>
              <Badge className="bg-emerald-500 text-black font-black italic">LIVE_FEED: WORKSTATION_ALPHA</Badge>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <ProductionFloor />
            </div>
          </div>
        </TabsContent>

        {/* Finance Department UX */}
        <TabsContent value="finance" className="mt-0">
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-3xl p-1 overflow-hidden">
             <div className="bg-zinc-900/50 p-6 flex items-center justify-between border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white uppercase italic">Treasury Control Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Financial Interlocks & Revenue Gates</p>
              </div>
              <Badge className="bg-blue-500 text-white font-black italic">LEDGER_STATION</Badge>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <FinanceDashboard />
            </div>
          </div>
        </TabsContent>

        {/* Placeholder for Warehouse */}
        <TabsContent value="warehouse" className="mt-0">
          <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <Boxes size={48} className="text-zinc-700 mb-4 animate-bounce" />
            <p className="text-xl font-black text-zinc-600 uppercase tracking-tight italic tracking-tighter">Under Construction: Batch 3 - Smart Warehouse</p>
            <p className="text-xs text-zinc-800 font-sans mt-2 uppercase tracking-tighter">Initial Alpha Modules Required: Stock Intake & QR Matrix</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Audit Notification Rail */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex items-center gap-4 bg-white text-black p-4 rounded-xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] animate-in slide-in-from-right duration-700 border-2 border-white overflow-hidden">
           <div className="absolute top-0 left-0 h-1 bg-black animate-[shrink_5000ms_linear_forwards]" />
           <div className="p-2 bg-black text-white rounded">
              <Zap size={16} className="fill-current" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-tight leading-none">Super Admin Notice</p>
              <p className="text-xs font-bold leading-none mt-1 uppercase italic">Multi-View Audit Port Activated</p>
           </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

