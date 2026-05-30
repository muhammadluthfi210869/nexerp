"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  PlusCircle, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  FileText,
  ShieldCheck,
  ArrowRight,
  Boxes
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
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
import { StatCard, TableWrapper, DnaButton, DnaInput } from "@/components/dna";
import { TableShell } from "@/components/layout/TableShell";

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
    <TableShell
      title="DELIVERY"
      titleAccent="ORDERS"
      subtitle="SHIPMENT PLANNING & DISPATCH AUTHORIZATION HUB"
      actions={
        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-brand-black uppercase">DISPATCH VELOCITY</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">OPTIMIZED LOGISTICS</p>
           </div>
           <Dialog>
               <DialogTrigger asChild>
                 <DnaButton variant="secondary" size="lg" icon={<PlusCircle />} className="rounded-2xl shadow-xl shadow-slate-100">
                    CREATE DO
                 </DnaButton>
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
                           <DnaInput type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
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
                           <DnaInput placeholder="RECIPIENT NAME" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SHIPPING ADDRESS</label>
                        <DnaInput placeholder="FULL DESTINATION ADDRESS..." className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
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
                           <DnaInput placeholder="AWB / RECEIPT NUMBER" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                    </div>

                     <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <DnaButton variant="ghost" size="lg">CANCEL</DnaButton>
                        <DnaButton variant="primary" size="lg" className="flex-1">
                           AUTHORIZE DISPATCH
                        </DnaButton>
                     </div>
                 </div>
              </DialogContent>
            </Dialog>
         </div>
      }>

      {/* 📊 II. DISPATCH OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard label="AWAITING FLEET" value="12" icon={<Truck />} />
         <StatCard label="IN PREPARATION" value="08" icon={<Clock />} />
         <StatCard label="READY FOR LOADING" value="05" icon={<Boxes />} />
         <StatCard label="TOTAL SHIPPED (MTD)" value="245" icon={<CheckCircle2 />} />
      </div>

      {/* 📑 III. DELIVERY ORDERS REGISTRY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-brand-black rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. DELIVERY ORDERS REGISTRY</h3>
        </div>
         <TableWrapper>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-table-header text-slate-400">DO REFERENCE</th>
                        <th className="px-6 py-4 text-table-header text-slate-400">CONSIGNEE</th>
                        <th className="px-6 py-4 text-table-header text-slate-400 text-center">ROUTE PLAN</th>
                        <th className="px-6 py-4 text-table-header text-slate-400 text-center">DATE</th>
                        <th className="px-6 py-4 text-table-header text-slate-400 text-center">STATUS</th>
                        <th className="px-6 py-4 text-table-header text-slate-400 text-right">ACTIONS</th>
                     </tr>
                  </thead>
                 <tbody className="divide-y divide-slate-100">
                    {deliveryOrders?.map((doOrder: any) => (
                       <tr key={doOrder.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-200 border border-slate-200">
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
                              <DnaButton 
                                 variant={doOrder.status === 'AWAITING_FLEET' ? "secondary" : "outline"}
                                 size="sm"
                                 className={cn("italic shadow-lg shadow-slate-200", doOrder.status === 'AWAITING_FLEET' ? "shadow-lg shadow-slate-200" : "")}
                              >
                                 {doOrder.status === 'AWAITING_FLEET' ? "ASSIGN FLEET" : "VIEW MANIFEST"} <ChevronRight className="ml-2 h-3 w-3" />
                              </DnaButton>
                           </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </TableWrapper>
       </div>

      {/* 🛡️ IV. INTEGRITY PROTOCOL */}
      <Card className="bento-card bg-brand-black text-white p-12 relative overflow-hidden group rounded-[24px]">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="h-32 w-32 bg-white/10 backdrop-blur-xl rounded-[24px] border border-white/20 flex items-center justify-center group-hover:rotate-6 transition-transform duration-700">
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
            <DnaButton variant="outline" size="lg" className="h-16 px-10 rounded-2xl shadow-2xl">
                MANAGE DISPATCH <ArrowRight className="ml-3 h-4 w-4" />
            </DnaButton>
         </div>
         <Truck className="h-64 w-64 text-white/[0.02] absolute -right-16 -bottom-16 group-hover:scale-110 transition-transform duration-1000" />
      </Card>
    </TableShell>
  );
}

