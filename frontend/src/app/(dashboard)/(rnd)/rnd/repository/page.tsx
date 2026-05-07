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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
       <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
       <p className="text-xs font-semibold text-slate-400">Opening Archives...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#fdfdfd] min-h-screen">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-100">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
             Formula <span className="text-slate-400">Archive</span>
           </h1>
            <p className="text-slate-700 text-[11px] font-black uppercase tracking-tight mt-2">
              Immutable Database of Approved Product Formulations
            </p>
        </div>

        <div className="flex gap-3">
           <Button variant="outline" className="h-10 px-4 border-slate-200 text-xs font-bold rounded-lg">
             <Filter className="mr-2 h-4 w-4" /> Filter Library
           </Button>
           <Button className="h-10 px-6 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-xs border-none shadow-sm">
             Export Master List <ArrowUpRight className="ml-2 h-4 w-4" />
           </Button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by name, ID, or active ingredient..." 
          className="h-12 pl-10 bg-white border-slate-200 rounded-xl text-sm font-medium shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* REPOSITORY TABLE */}
      <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
         <Table>
            <TableHeader className="bg-slate-100/50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
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
                     <TableCell className="py-3.5 pl-6">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded bg-slate-800 text-white flex items-center justify-center shadow-sm">
                              <FlaskConical className="h-3.5 w-3.5" />
                           </div>
                           <span className="font-bold text-slate-900 text-sm tracking-tight">{formula.id}</span>
                        </div>
                     </TableCell>
                      <TableCell>
                         <div className="space-y-1">
                            <p className="font-bold text-slate-900 text-sm tracking-tight">{formula.name}</p>
                             <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-300 text-slate-600 px-1.5 py-0 rounded-sm">{formula.category}</Badge>
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
                            <Badge variant="secondary" className={cn(
                              "rounded-sm px-2.5 py-1 font-bold uppercase text-[9px] border",
                              formula.status === 'RELEASED' 
                                ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" 
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            )}>
                               {formula.status}
                            </Badge>
                            {formula.status === 'RELEASED' && (
                              <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100" title="Integrity Verified">
                                 <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              </div>
                            )}
                         </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                         <Button variant="outline" size="sm" className="h-8 px-4 text-slate-900 border-slate-200 font-bold text-[9px] uppercase tracking-[0.1em] rounded bg-white hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 ml-auto">
                            Audit Trace <ArrowUpRight className="h-3 w-3" />
                         </Button>
                      </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>

      {/* DATA INTEGRITY FOOTER */}
      <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
               <ShieldCheck className="h-5 w-5 text-slate-400" />
            </div>
             <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">Vault Access Integrity</h3>
                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-tight">Active encryption: AES-256. All access attempts are recorded in the system audit log.</p>
             </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Database Sync: Verified</span>
         </div>
      </div>
    </div>
  );
}

