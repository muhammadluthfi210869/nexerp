"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Search, 
  PlusCircle, 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Gavel,
  History,
  Lock,
  Download,
  Calendar,
  Zap,
  Globe,
  Verified
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
import { cn } from "@/lib/utils";

export default function LegalityHub() {
  const { data: permits, isLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: async () => {
      const resp = await api.get("/legality/permits");
      return resp.data;
    }
  });

  const activePermits = permits?.filter((p: any) => p.status === 'ACTIVE').length ?? 0;
  const expiringSoon = permits?.filter((p: any) => p.status === 'EXPIRING_SOON').length ?? 0;
  const inProgress = permits?.filter((p: any) => p.status === 'EXPIRED' || p.status === 'EXPIRING_SOON').length ?? 0;
  const healthScore = permits?.length > 0 ? Math.round((activePermits / permits.length) * 100) + '%' : '100%';

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Compliance & Legal Vault</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Legality <span className="text-amber-500">Registry</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Tracking critical permits, licenses, and regulatory compliance
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <History className="mr-2 h-4 w-4" /> Audit Logs
           </Button>
           <Button className="h-14 px-8 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-xl shadow-amber-100 font-black uppercase tracking-tighter text-sm border-none">
              <PlusCircle className="mr-2 h-5 w-5 stroke-[3px]" /> Add New Permit
           </Button>
        </div>
      </div>

      {/* Compliance Overview */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComplianceCard label="Active Permits" value={String(activePermits)} color="text-emerald-600" icon={Verified} />
          <ComplianceCard label="Expiring Soon" value={String(expiringSoon)} color="text-amber-600" icon={Clock} />
          <ComplianceCard label="In Progress" value={String(inProgress)} color="text-blue-600" icon={Zap} />
          <ComplianceCard label="Regulatory Health" value={healthScore} color="text-slate-900" icon={ShieldCheck} />
       </div>

      {/* Permits Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white relative">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Lock className="h-32 w-32 text-slate-900" />
         </div>

         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Permit ID / Reference</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Licensing Name / Issuer</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Category</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Valid Until</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Legal Action</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
                {permits?.map((permit: any) => (
                  <TableRow key={permit.id} className="group hover:bg-amber-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                              <FileText className="h-5 w-5 text-amber-400" />
                           </div>
                           <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{permit.id}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col">
                           <p className="font-black text-slate-900 text-sm uppercase italic">{permit.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{permit.issuer}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-tight px-2 py-0.5">
                           {permit.type}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                           <Calendar className="h-3.5 w-3.5 text-slate-300" />
                           {permit.expiry}
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          permit.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : 
                          permit.status === 'EXPIRING_SOON' ? "bg-amber-600 text-white animate-pulse" : "bg-rose-100 text-rose-700"
                        )}>
                           {permit.status.replace('_', ' ')}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                           <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                              <Download className="h-4 w-4" />
                           </Button>
                           <Button className="h-11 px-6 font-black uppercase tracking-tight text-[10px] rounded-xl bg-white text-slate-900 border-2 border-slate-50 shadow-md hover:bg-slate-900 hover:text-white transition-all italic">
                              View Details <ChevronRight className="ml-2 h-3.5 w-3.5" />
                           </Button>
                        </div>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>

      {/* Regulatory Calendar Preview */}
      <Card className="rounded-[4rem] border-none shadow-3xl bg-slate-900 text-white p-12 overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="h-32 w-32 bg-amber-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-amber-500/40 group-hover:scale-110 transition-transform duration-700">
               <Gavel className="h-16 w-16 text-black" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter">Regulatory Intelligence</h4>
               <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2 leading-relaxed">
                  Automatically tracking renewal cycles for 12+ international regulatory bodies. Our proactive engine notifies legal counsel 90 days before expiration.
               </p>
               <div className="mt-8 flex gap-8 justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                     <Globe className="h-4 w-4 text-amber-500" />
                     <span className="text-[10px] font-black uppercase tracking-tight">Global Compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-emerald-500" />
                     <span className="text-[10px] font-black uppercase tracking-tight">Digital Vault</span>
                  </div>
               </div>
            </div>
            <Button className="h-16 px-10 bg-white text-slate-900 hover:bg-amber-500 hover:text-black rounded-2xl font-black uppercase tracking-tight text-xs transition-all shadow-2xl">
               Regulatory Map <ChevronRight className="ml-3 h-4 w-4" />
            </Button>
         </div>
         <Lock className="h-64 w-64 text-white/5 absolute -right-16 -bottom-16 group-hover:rotate-12 transition-transform duration-1000" />
      </Card>
    </div>
  );
}

function ComplianceCard({ label, value, color, icon: Icon }: any) {
  return (
     <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-8 bg-white flex items-center gap-6 group">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-black transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">{label}</p>
           <p className={cn("text-2xl font-black italic tracking-tighter", color)}>{value}</p>
        </div>
     </Card>
  );
}

