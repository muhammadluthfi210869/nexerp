"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Printer, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  ArrowRight,
  History as HistoryIcon,
  ClipboardCheck,
  Package,
  Calendar,
  Lock,
  Share2
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

export default function CoACenterPage() {
  const { data: coaRecords, isLoading } = useQuery({
    queryKey: ["coa-records"],
    queryFn: async () => {
      const res = await api.get("/qc/audits", { params: { type: "inbound" } });
      return res.data.map((a: any) => ({
        id: a.reportNumber || a.id,
        product: a.material?.name || "Unknown",
        batch: a.batchNumber || "\u2014",
        releaseDate: new Date(a.createdAt).toISOString().split('T')[0],
        status: a.status === "PASSED" ? "VERIFIED" : a.status || "PENDING",
        analyst: a.analyst?.fullName || "\u2014",
      }));
    }
  });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Compliance & Regulatory Exports</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             CoA <span className="text-emerald-500">Center</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Professional Certificate of Analysis generation & archive
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <HistoryIcon className="mr-2 h-4 w-4" /> Global Archive
           </Button>
           <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-100 font-black uppercase tracking-tighter text-sm border-none">
              <Zap className="mr-2 h-5 w-5 fill-current" /> Batch Auto-Generate
           </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-4 bg-white flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
               placeholder="Search by Batch Number or Product Name..." 
               className="h-16 pl-16 pr-10 border-none bg-slate-50 rounded-[2rem] font-bold text-slate-600 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-100 transition-all"
            />
         </div>
         <Button className="h-16 px-10 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-tight text-[11px] hover:bg-emerald-600 transition-all">
            Execute Filter
         </Button>
      </Card>

      {/* CoA Records Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Certificate ID</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Product & Batch</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Authorized By</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Release Date</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Audit Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Documents</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {coaRecords?.map((record: any) => (
                  <TableRow key={record.id} className="group hover:bg-emerald-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <ShieldCheck className="h-5 w-5 text-emerald-400" />
                           </div>
                           <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{record.id}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div>
                           <p className="font-black text-slate-900 text-sm uppercase italic">{record.product}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Batch Ref: {record.batch}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">
                              {record.analyst.charAt(record.analyst.length - 1)}
                           </div>
                           <p className="font-bold text-slate-500 text-xs uppercase">{record.analyst}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-slate-300" />
                           <p className="font-bold text-slate-500 text-xs uppercase tracking-tight">{record.releaseDate}</p>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          record.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
                        )}>
                           {record.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                              <Eye className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                              <Printer className="h-4 w-4" />
                           </Button>
                           <Button className="h-11 px-5 bg-white border-2 border-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 font-black uppercase tracking-tight text-[10px] rounded-xl shadow-md transition-all italic">
                              <Download className="mr-2 h-3.5 w-3.5" /> PDF CoA
                           </Button>
                        </div>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>

      {/* CoA Templates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-slate-900 text-white">
            <h4 className="text-xl font-black italic uppercase tracking-tighter mb-6">Standard CoA Template</h4>
            <div className="space-y-4">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <FileText className="h-5 w-5 text-emerald-400" />
                     <span className="text-xs font-bold uppercase">Clinical Export V1</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black uppercase">ACTIVE</Badge>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                     <FileText className="h-5 w-5 text-slate-400" />
                     <span className="text-xs font-bold uppercase">Retail Minimalist V2</span>
                  </div>
               </div>
            </div>
            <Button className="w-full mt-8 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-tight text-xs rounded-2xl">
               Manage Templates
            </Button>
         </Card>

         <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-white relative overflow-hidden group">
            <div className="relative z-10">
               <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">CoA Security Vault</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Digital signatures & integrity verification</p>
               
               <div className="mt-8 flex items-center gap-4">
                  <div className="h-16 w-16 bg-emerald-50 rounded-3xl flex items-center justify-center shadow-inner">
                     <Lock className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-slate-900 uppercase">256-bit Encrypted</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">All exported CoAs are cryptographically signed.</p>
                  </div>
               </div>
            </div>
            <ShieldCheck className="h-32 w-32 text-emerald-50 absolute -right-8 -bottom-8 group-hover:scale-110 transition-transform duration-700" />
         </Card>
      </div>
    </div>
  );
}

