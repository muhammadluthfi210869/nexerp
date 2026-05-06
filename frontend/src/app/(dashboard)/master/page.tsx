"use client";

import React from "react";
import { 
  Archive, 
  Package, 
  Warehouse, 
  Truck, 
  Users, 
  Tags,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Database
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MASTER_SEGMENTS = [
  {
    title: "Categories",
    description: "System-wide taxonomy for goods, suppliers, and commercial leads.",
    href: "/master/categories",
    icon: Tags,
    color: "text-brand-orange",
    stats: "3 Segments"
  },
  {
    title: "Goods Registry",
    description: "Centralized catalog for Raw Materials, Packaging, and Finished Goods.",
    href: "/master/goods",
    icon: Package,
    color: "text-brand-orange",
    stats: "CoA Integrated"
  },
  {
    title: "Warehouse Hub",
    description: "Manage storage centers and bin-level location logic tracking.",
    href: "/master/warehouses",
    icon: Warehouse,
    color: "text-brand-orange",
    stats: "Geospatial"
  },
  {
    title: "Vendor Network",
    description: "Standardize supplier profiles, payment terms, and procurement links.",
    href: "/master/suppliers",
    icon: Truck,
    color: "text-brand-orange",
    stats: "Supply Ready"
  },
  {
    title: "Client Database",
    description: "Commercial master data for brand owners and B2B partnerships.",
    href: "/master/customers",
    icon: Users,
    color: "text-brand-orange",
    stats: "CRM Sync"
  },
  {
    title: "Personnel Registry",
    description: "Manage staff profiles, departmental assignments, and PIC links.",
    href: "/master/personnel",
    icon: Users,
    color: "text-brand-orange",
    stats: "HRIS Integrated"
  }
];

export default function MasterOverviewPage() {
  return (
    <div className="p-12 space-y-16 animate-in fade-in duration-1000 bg-base min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-brand-orange rounded-full shadow-[0_0_15px_rgba(246,145,30,0.5)]" />
              <span className="text-[11px] font-heading font-black uppercase tracking-[0.5em] text-brand-orange italic">Foundation Registry v4.0</span>
           </div>
           <h1 className="text-7xl font-heading font-black tracking-[calc(-0.05em)] text-brand-black uppercase italic leading-[0.9]">
             System <br />
             <span className="text-brand-orange">Constitution</span>
           </h1>
           <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[11px] max-w-xl leading-relaxed italic opacity-60 pl-1">
             Master data management hub. Centralizing the fundamental registry for cross-divisional workflow synchronization.
           </p>
        </div>

        <div className="flex gap-4">
           <div className="w-16 h-16 bg-brand-black rounded-[1.5rem] flex items-center justify-center shadow-2xl">
             <Archive className="h-8 w-8 text-white" />
           </div>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {MASTER_SEGMENTS.map((segment, i) => (
          <Link key={i} href={segment.href} className="flex">
            <Card className="glass-premium border-none shadow-2xl hover:translate-y-[-12px] transition-all duration-500 group cursor-pointer border border-white/10 overflow-hidden bg-white/40 flex flex-col w-full h-full rounded-[4rem]">
              <CardContent className="p-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-10">
                  <div className={cn("p-6 rounded-[2rem] bg-white border border-surface shadow-2xl group-hover:bg-brand-black group-hover:text-white transition-all duration-500", segment.color)}>
                    <segment.icon className="h-10 w-10 stroke-[2.5px]" />
                  </div>
                  <Badge className="glass-premium text-brand-black border-none font-heading font-black text-[9px] px-5 py-2 rounded-full italic tracking-tight group-hover:bg-brand-orange group-hover:text-white transition-colors duration-500 shadow-sm">
                    {segment.stats}
                  </Badge>
                </div>
                
                <div className="flex-1 space-y-4 mb-10">
                  <h3 className="text-3xl font-heading font-black text-brand-black uppercase italic leading-none tracking-tighter group-hover:text-brand-orange transition-colors">
                    {segment.title}
                  </h3>
                  <p className="text-text-muted text-xs font-black uppercase leading-relaxed italic opacity-40 group-hover:opacity-60 transition-opacity">
                    {segment.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-brand-black font-heading font-black text-xs uppercase tracking-tight italic group-hover:text-brand-orange transition-all">
                  Initialize Segment Protocol
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform duration-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Data Integrity Audit Card */}
        <Card className="rounded-[4rem] border-2 border-dashed border-border/20 bg-surface/30 shadow-none hover:border-brand-orange/50 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-12 flex flex-col items-center justify-center text-center h-full relative z-10">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-text-muted mb-8 shadow-2xl group-hover:rotate-12 transition-transform duration-500 border border-border/5">
              <Database className="h-10 w-10 text-brand-orange" />
            </div>
            <h3 className="text-2xl font-heading font-black text-brand-black uppercase italic tracking-tighter">Integrity Scan</h3>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-4 mb-8 italic opacity-60">Run a system-wide diagnostic on master data relations.</p>
            <Button className="h-16 px-10 rounded-[1.5rem] bg-brand-black hover:bg-brand-orange text-white font-heading font-black text-[10px] uppercase tracking-tight italic border-none shadow-2xl shadow-brand-black/20 transition-all">
              Initialize Audit (V4)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info Box */}
      <div className="glass-premium rounded-[3.5rem] p-12 flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/10 shadow-3xl bg-white/40">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-brand-black rounded-[2rem] flex items-center justify-center text-brand-orange shadow-2xl group">
            <ShieldCheck className="h-10 w-10 group-hover:scale-110 transition-transform" />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-heading font-black text-brand-black uppercase italic tracking-tight">Event-Driven Accounting</h4>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic opacity-60">All registry items are logically coupled to CoA for automated journaling synchronization.</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="h-1.5 w-48 bg-surface rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-emerald-500 w-full animate-pulse" />
           </div>
           <span className="text-[10px] font-heading font-black text-emerald-600 bg-emerald-500/10 px-6 py-2.5 rounded-full border border-emerald-500/20 italic tracking-tight">
            CONSTITUTION_SYNC_LOCKED
           </span>
        </div>
      </div>
    </div>
  );
}

