"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Package, 
  Search, 
  PlusCircle, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  FileText,
  History,
  Zap,
  ShieldCheck,
  ArrowRight,
  User,
  MapPin,
  ClipboardCheck,
  Boxes
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DeliveryOrdersPage() {
  const { data: deliveryOrders, isLoading } = useQuery({
    queryKey: ["delivery-orders"],
    queryFn: async () => {
      return [
        { id: "DO-24001", client: "PT KOSMETIK JAYA", origin: "MAIN WAREHOUSE", destination: "JAKARTA HUB", date: "2024-04-23", status: "AWAITING_FLEET", priority: "URGENT" },
        { id: "DO-24002", client: "BEAUTY STORE CENTRAL", origin: "MAIN WAREHOUSE", destination: "BANDUNG STORE", date: "2024-04-24", status: "DRAFT", priority: "NORMAL" },
        { id: "DO-24003", client: "RETAILINDO UTAMA", origin: "MAIN WAREHOUSE", destination: "SURABAYA DISTRIBUTION", date: "2024-04-22", status: "SHIPPED", priority: "NORMAL" },
      ];
    }
  });

  return (
    <div className="space-y-8">
      {/* 🚚 I. DISPATCH COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">LOGISTICS DISPATCH ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">DELIVERY <span className="text-slate-300">ORDERS</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SHIPMENT PLANNING & DISPATCH AUTHORIZATION HUB</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-brand-black uppercase">DISPATCH VELOCITY</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">OPTIMIZED LOGISTICS</p>
           </div>
           <Dialog>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 bg-brand-black text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none">
                   <PlusCircle className="mr-2 h-5 w-5 stroke-[3px]" /> CREATE DO
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
                 <div className="bg-brand-black p-10 text-white relative">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">MANIFEST <span className="text-slate-500">AUTHORIZATION</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">LOGISTICS DISPATCH PROTOCOL V4.0</p>
                    <Truck className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
                 </div>
                 <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SHIPPING DATE</label>
                          <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SOURCE SALES ORDER (SO)</label>
                          <Select>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="SELECT SO..." />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="SO-001">SO-001 (PT KOSMETIK JAYA)</SelectItem>
                                <SelectItem value="SO-002">SO-002 (BEAUTY STORE)</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">CUSTOMER / CONSIGNEE</label>
                       <Input placeholder="RECIPIENT NAME" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SHIPPING ADDRESS</label>
                       <Input placeholder="FULL DESTINATION ADDRESS..." className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">EXPEDITION / CARRIER</label>
                          <Select>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="SELECT CARRIER..." />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="JNE">JNE EXPRESS</SelectItem>
                                <SelectItem value="JNT">J&T CARGO</SelectItem>
                                <SelectItem value="SICEPAT">SICEPAT</SelectItem>
                                <SelectItem value="INTERNAL">INTERNAL FLEET</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">TRACKING NUMBER (NO. RESI)</label>
                          <Input placeholder="AWB / RECEIPT NUMBER" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-slate-100">
                       <Button variant="ghost" className="h-14 px-8 font-black uppercase tracking-widest text-[9px]">CANCEL</Button>
                       <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                          AUTHORIZE DISPATCH
                       </Button>
                    </div>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* 📊 II. DISPATCH OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <DispatchStatCard label="AWAITING FLEET" value="12" color="text-blue-600" icon={Truck} />
         <DispatchStatCard label="IN PREPARATION" value="08" color="text-amber-600" icon={Clock} />
         <DispatchStatCard label="READY FOR LOADING" value="05" color="text-emerald-600" icon={Boxes} />
         <DispatchStatCard label="TOTAL SHIPPED (MTD)" value="245" color="text-brand-black" icon={CheckCircle2} />
      </div>

      {/* 📑 III. DELIVERY ORDERS REGISTRY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-brand-black rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. DELIVERY ORDERS REGISTRY</h3>
        </div>
        <Card className="bento-card overflow-hidden bg-white">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">DO REFERENCE</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">CONSIGNEE</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">ROUTE PLAN</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">DATE</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">ACTIONS</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {deliveryOrders?.map((doOrder: any) => (
                       <tr key={doOrder.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-200">
                                   <FileText className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                   <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{doOrder.id}</p>
                                   <span className={cn(
                                      "text-[8px] font-black uppercase px-2 py-0.5 rounded border mt-1 block w-fit",
                                      doOrder.priority === 'URGENT' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                   )}>
                                      {doOrder.priority}
                                   </span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-6">
                             <p className="text-[11px] font-black text-brand-black uppercase italic">{doOrder.client}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">REGISTERED PARTNER</p>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex items-center justify-center gap-3">
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-brand-black uppercase italic leading-none">{doOrder.origin}</p>
                                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">SOURCE</p>
                                </div>
                                <ArrowRight className="h-3 w-3 text-slate-200" />
                                <div className="text-left">
                                   <p className="text-[10px] font-black text-brand-black uppercase italic leading-none">{doOrder.destination}</p>
                                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">TARGET</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <p className="text-[11px] font-black text-slate-900 tabular uppercase">{doOrder.date}</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className={cn(
                                "text-[9px] font-black uppercase px-4 py-1.5 rounded-xl tabular border shadow-sm",
                                doOrder.status === 'SHIPPED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                doOrder.status === 'AWAITING_FLEET' ? "bg-blue-600 text-white border-blue-500 animate-pulse" : "bg-slate-50 text-slate-400 border-slate-100"
                             )}>
                                {doOrder.status.replace('_', ' ')}
                             </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                             <Button 
                                className={cn(
                                   "h-9 px-6 font-black uppercase text-[9px] rounded-xl transition-all italic",
                                   doOrder.status === 'AWAITING_FLEET' ? "bg-brand-black text-white hover:bg-slate-800 shadow-lg shadow-slate-200" : "bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 shadow-sm"
                                )}
                             >
                                {doOrder.status === 'AWAITING_FLEET' ? "ASSIGN FLEET" : "VIEW MANIFEST"} <ChevronRight className="ml-2 h-3 w-3" />
                             </Button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>

      {/* 🛡️ IV. INTEGRITY PROTOCOL */}
      <Card className="bento-card bg-brand-black text-white p-12 relative overflow-hidden group rounded-[3rem]">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="h-32 w-32 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 flex items-center justify-center group-hover:rotate-6 transition-transform duration-700">
               <ShieldCheck className="h-16 w-16 text-blue-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter">SHIPPING <span className="text-slate-500">INTEGRITY PROTOCOL</span></h4>
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                  EVERY DELIVERY ORDER REQUIRES A SYNCHRONIZED DIGITAL HANDSHAKE BETWEEN WAREHOUSE OPERATIONS, CARRIER FLEET, AND QUALITY ASSURANCE.
               </p>
               <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest">DRIVER BIOMETRICS</span>
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest">LOAD VERIFICATION</span>
                  <span className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest">E-SIGNATURE READY</span>
               </div>
            </div>
            <Button className="h-16 px-10 bg-white text-brand-black hover:bg-blue-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl">
               MANAGE DISPATCH <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
         </div>
         <Truck className="h-64 w-64 text-white/[0.02] absolute -right-16 -bottom-16 group-hover:scale-110 transition-transform duration-1000" />
      </Card>
    </div>
  );
}

function DispatchStatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="bento-card p-8 bg-white flex items-center gap-6 group">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className={cn("text-3xl font-black italic tracking-tighter tabular", color)}>{value}</p>
        </div>
     </Card>
  );
}

