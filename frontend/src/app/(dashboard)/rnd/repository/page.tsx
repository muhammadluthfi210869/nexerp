"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  FlaskConical, 
  ChevronRight, 
  FileText, 
  Filter, 
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  History as HistoryIcon
} from "lucide-react";
import { DnaInput, DnaButton } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function RndRepositoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: formulas, isLoading } = useQuery({
    queryKey: ["master-formulas"],
    queryFn: async () => {
      const res = await api.get("/rnd/formulas", { params: { status: "ARCHIVED" } });
      return res.data.map((f: any) => ({
        id: f.formulaCode || f.id,
        name: f.sampleRequest?.productName || "—",
        category: "Skincare",
        version: `v${f.version || 1}`,
        status: f.status || "ARCHIVED",
        stability: f.labTestResults?.length > 0 ? (f.labTestResults.some((r: any) => r.stability40C === "UNSTABLE") ? "UNSTABLE" : "STABLE") : "N/A",
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split('T')[0] : "—",
        pic: f.lockedBy?.fullName || "—",
        sampleCode: f.sampleRequest?.sampleCode || "—",
        createdBy: f.lockedBy?.fullName || "—",
        releasedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split('T')[0] : "—",
        activeVersion: `v${f.version || 1}`,
      }));
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
       <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
       <p className="text-xs font-black text-slate-400">Opening Archives...</p>
    </div>
  );

  return (
    <DashboardShell
      title="FORMULA"
      titleAccent="ARCHIVE"
      subtitle="Immutable Database of Approved Product Formulations"
      actions={
        <div className="flex gap-2">
<DnaButton variant="outline" className="h-10 px-4 border border-slate-200 text-xs font-black rounded-xl bg-white text-slate-900 shadow-sm">
              <Filter className="mr-1.5 h-3.5 w-3.5" /> Filter Library
            </DnaButton>
<DnaButton variant="primary" className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-none shadow-sm flex items-center italic">
              Export Master List <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </DnaButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* SEARCH BAR */}
        <div className="relative max-w-2xl">
          <DnaInput 
            placeholder="Search by name, ID, or active ingredient..." 
            className="bg-white border border-slate-200 rounded-xl text-sm font-black shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
          />
        </div>

        {/* EMPTY STATE */}
        {(!formulas || formulas.length === 0) && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FlaskConical className="h-12 w-12 text-slate-200" />
            <p className="text-sm font-black text-slate-400">No Archived Formulas</p>
            <p className="text-[11px] text-slate-300 font-medium">Approved formulas will appear here</p>
          </div>
        ) : null}

        {/* REPOSITORY TABLE */}
        <div className="rounded-[2rem] border border-slate-200 shadow-sm bg-white overflow-hidden">
           <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent border-b border-slate-200">
                     <TableHead className="py-4 pl-6 text-[10px] font-black uppercase tracking-tight text-slate-700">Formula ID</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700">Product Name</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700">Chemist</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700">Release Date</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">Status</TableHead>
                     <TableHead className="pr-6 text-right text-[10px] font-black uppercase tracking-tight text-slate-700">Action</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                 {formulas?.map((formula: any) => (
                    <TableRow key={formula.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                       <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-slate-100 text-slate-900 flex items-center justify-center shadow-sm">
                                <FlaskConical className="h-3.5 w-3.5" />
                             </div>
                             <span className="font-black text-slate-900 text-sm tracking-tight">{formula.id}</span>
                          </div>
                       </TableCell>
                        <TableCell>
                           <div className="space-y-1">
                              <p className="font-black text-slate-900 text-xs tracking-tight">{formula.name}</p>
                               <div className="flex items-center gap-2">
                                  <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-slate-50 text-slate-600 border border-slate-100">{formula.category}</span>
                                  <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-700 uppercase tracking-tight border border-slate-200">
                                    <HistoryIcon className="h-2.5 w-2.5" /> {formula.activeVersion}
                                  </span>
                               </div>
                           </div>
                        </TableCell>
                       <TableCell>
                          <p className="text-xs font-medium text-slate-700">{formula.createdBy}</p>
                       </TableCell>
                       <TableCell>
                          <p className="text-xs font-medium text-slate-500">{formula.releasedAt}</p>
                       </TableCell>
                        <TableCell className="text-center">
                           <div className="flex items-center justify-center gap-2">
                              <span className={cn(
                                "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm",
                                formula.status === 'RELEASED' 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                  : "bg-slate-50 text-slate-600 border border-slate-100"
                              )}>
                                 {formula.status}
                              </span>
                              {formula.status === 'RELEASED' && (
                                <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100" title="Integrity Verified">
                                   <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                </div>
                              )}
                           </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
<DnaButton variant="outline" className="h-8 px-4 text-slate-900 border-slate-200 font-black text-[9px] uppercase tracking-[0.1em] rounded bg-white hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 ml-auto">
                              Audit Trace <ArrowUpRight className="h-3 w-3" />
                            </DnaButton>
                        </TableCell>
                    </TableRow>
                 ))}
              </TableBody>
            </Table>
         </div>

        {/* DATA INTEGRITY FOOTER */}
        <div className="border border-slate-200 bg-slate-50/50 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                 <ShieldCheck className="h-5 w-5 text-slate-400" />
              </div>
               <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">Vault Access Integrity</h3>
                  <p className="text-slate-700 text-[10px] font-black uppercase tracking-tight">Active encryption: AES-256. All access attempts are recorded in the system audit log.</p>
               </div>
           </div>
           <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Database Sync: Verified</span>
           </div>
         </div>
      </div>
    </DashboardShell>
  );
}
