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
import { Input } from "@/components/ui/input";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DataCard } from "@/components/dna/DataCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DashboardShell } from "@/components/layout/DashboardShell";

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
    <DashboardShell
      title="CoA"
      titleAccent="Center"
      subtitle="Professional Certificate of Analysis generation & archive"
      actions={
        <div className="flex gap-4">
           <DnaButton variant="outline" className="rounded-[14px] text-[12px]">
              <HistoryIcon className="mr-2 h-4 w-4" /> Global Archive
           </DnaButton>
           <DnaButton variant="secondary" className="rounded-[14px] text-[12px]">
              <Zap className="mr-2 h-5 w-5 fill-current" /> Batch Auto-Generate
           </DnaButton>
        </div>
      }
    >

      {/* Search & Filter Bar */}
      <DataCard className="flex flex-row items-center gap-4 p-4" noShadow>
         <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
               placeholder="Search by Batch Number or Product Name..." 
               className="h-16 pl-16 pr-10 border border-[var(--border-color)] bg-[var(--gray-50)] rounded-[12px] font-medium text-slate-600 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-100 transition-all"
            />
         </div>
          <DnaButton variant="secondary" className="h-16 px-10 rounded-[14px] text-[13px]">
            Execute Filter
         </DnaButton>
      </DataCard>

      {/* CoA Records Table */}
      <TableWrapper>
         <table>
            <thead className="bg-[#F8FAFC]">
               <tr className="hover:bg-transparent border-[var(--border-color)]">
                  <th className="py-6 pl-10 text-table-header">Certificate ID</th>
                  <th className="text-table-header">Product & Batch</th>
                  <th className="text-table-header">Authorized By</th>
                  <th className="text-table-header">Release Date</th>
                  <th className="text-table-header text-center">Audit Status</th>
                  <th className="pr-10 text-right text-table-header">Documents</th>
               </tr>
            </thead>
            <tbody>
               {coaRecords?.map((record: any) => (
                  <tr key={record.id} className="group hover:bg-emerald-50/30 transition-all duration-300 border-b border-[var(--border-color)]">
                     <td className="py-6 pl-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                               <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            </div>
                           <span className="font-bold text-slate-900 tracking-tight text-sm uppercase">{record.id}</span>
                        </div>
                     </td>
                     <td>
                        <div>
                           <p className="font-semibold text-slate-900 text-sm">{record.product}</p>
                           <p className="text-[11px] font-medium text-slate-400">Batch Ref: {record.batch}</p>
                        </div>
                     </td>
                     <td>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                              {record.analyst.charAt(record.analyst.length - 1)}
                           </div>
                           <p className="font-medium text-slate-500 text-[11px]">{record.analyst}</p>
                        </div>
                     </td>
                     <td>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-slate-300" />
                           <p className="font-medium text-slate-500 text-[11px]">{record.releaseDate}</p>
                        </div>
                     </td>
                     <td className="text-center">
                        <DnaBadge status={record.status === 'VERIFIED' ? "success" : "warning"}>
                           {record.status}
                        </DnaBadge>
                     </td>
                     <td className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                           <DnaButton variant="ghost" className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                              <Eye className="h-4 w-4" />
                           </DnaButton>
                           <DnaButton variant="ghost" className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                              <Printer className="h-4 w-4" />
                           </DnaButton>
                            <DnaButton variant="outline" className="h-11 px-5 hover:bg-gray-900 hover:text-white text-slate-900 rounded-lg text-[10px]">
                              <Download className="mr-2 h-3.5 w-3.5" /> PDF CoA
                           </DnaButton>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </TableWrapper>

      {/* CoA Templates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DataCard title="Standard CoA Template">
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-[24px] border border-[var(--border-color)] flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-emerald-400" />
                      <span className="text-xs font-bold uppercase">Clinical Export V1</span>
                   </div>
                   <DnaBadge status="success">ACTIVE</DnaBadge>
                </div>
                <div className="p-4 bg-gray-50 rounded-[24px] border border-[var(--border-color)] flex items-center justify-between opacity-50">
                   <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-xs font-bold uppercase">Retail Minimalist V2</span>
                   </div>
                </div>
            </div>
            <DnaButton variant="primary" className="w-full mt-8 h-14 rounded-[14px] text-xs">
               Manage Templates
            </DnaButton>
         </DataCard>

         <DataCard title="CoA Security Vault" className="relative overflow-hidden group" titleColor="text-slate-900">
            <div className="relative z-10">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Digital signatures & integrity verification</p>
               
               <div className="mt-8 flex items-center gap-4">
                  <div className="h-16 w-16 bg-emerald-50 rounded-[24px] flex items-center justify-center shadow-inner">
                     <Lock className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-slate-900 uppercase">256-bit Encrypted</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">All exported CoAs are cryptographically signed.</p>
                  </div>
               </div>
            </div>
            <ShieldCheck className="h-32 w-32 text-emerald-50 absolute -right-8 -bottom-8 group-hover:scale-110 transition-transform duration-700" />
         </DataCard>
      </div>
    </DashboardShell>
  );
}

