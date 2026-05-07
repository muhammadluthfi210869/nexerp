"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FlaskConical, 
  Search, 
  Beaker, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  History,
  ClipboardCheck,
  Microscope,
  ArrowRight,
  Download,
  AlertTriangle,
  PlusCircle
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
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function QCInspectionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: inspections, isLoading } = useQuery({
    queryKey: ["qc-inspections"],
    queryFn: async () => {
      const res = await api.get("/qc/audits", { params: { status: "PENDING" } });
      return res.data.map((a: any) => ({
        id: a.reportNumber || a.id,
        source: a.sourceReference || "—",
        material: a.material?.name || "Unknown",
        batch: a.batchNumber || "—",
        date: new Date(a.createdAt).toISOString().split('T')[0],
        status: a.status === "PASSED" ? "PASSED" : a.status === "FAILED" ? "REJECTED" : "WAITING",
        analyst: a.analyst?.fullName || "—",
      }));
    }
  });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-indigo-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Quality Assurance Gate</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Lab <span className="text-indigo-500">Inspections</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Scientific verification & material integrity protocols
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <History className="mr-2 h-4 w-4" /> Lab Archives
           </Button>
           <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-tighter text-sm border-none">
              <PlusCircle className="mr-2 h-5 w-5 stroke-[3px]" /> Start Analysis
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatMiniCard label="Pending Analysis" value="12" color="text-indigo-600" />
         <StatMiniCard label="Passed (Today)" value="8" color="text-emerald-600" />
         <StatMiniCard label="Rejected (Today)" value="1" color="text-rose-600" />
         <StatMiniCard label="Stability Logs" value="45" color="text-blue-600" />
      </div>

      {/* Inspections Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Inspection ID</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Material / Product</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Origin Source</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Analyst</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Result Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Laboratory Action</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {inspections?.map((insp: any) => (
                  <TableRow key={insp.id} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                              <Microscope className="h-5 w-5 text-indigo-400" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{insp.id}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Batch: {insp.batch}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Beaker className="h-4 w-4 text-slate-400" />
                           </div>
                           <p className="font-black text-slate-900 text-sm uppercase italic">{insp.material}</p>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-tight">
                           {insp.source}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <p className="font-bold text-slate-500 text-xs uppercase">{insp.analyst}</p>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge className={cn(
                          "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                          insp.status === 'PASSED' ? "bg-emerald-100 text-emerald-700" : 
                          insp.status === 'WAITING' ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-rose-100 text-rose-700"
                        )}>
                           {insp.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="pr-10 text-right">
                        <Dialog>
                           <DialogTrigger asChild>
                              <Button 
                                className={cn(
                                  "h-11 px-6 font-black uppercase tracking-tight text-[10px] rounded-xl shadow-md border-2 transition-all italic",
                                  insp.status === 'WAITING' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-slate-900 border-slate-50 hover:bg-slate-900 hover:text-white"
                                )}
                              >
                                 {insp.status === 'WAITING' ? "Run Analysis" : "View Protocol"} <ChevronRight className="ml-2 h-3.5 w-3.5" />
                              </Button>
                           </DialogTrigger>
                           <DialogContent className="sm:max-w-[800px] bg-white rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden">
                              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                                 <div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Laboratory Protocol</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Material ID: {insp.material}</p>
                                 </div>
                                 <Activity className="h-12 w-12 text-indigo-500 opacity-50" />
                              </div>

                              <div className="p-10 space-y-8">
                                 <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                       <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-400">Chemical Parameters</h4>
                                       <div className="space-y-4">
                                          <div className="flex justify-between items-center">
                                             <label className="text-xs font-bold text-slate-700">pH Level</label>
                                             <Input type="number" step="0.1" placeholder="5.5" className="w-24 h-10 border-none bg-white rounded-xl text-right font-black" />
                                          </div>
                                          <div className="flex justify-between items-center">
                                             <label className="text-xs font-bold text-slate-700">Viscosity (cps)</label>
                                             <Input type="number" placeholder="2500" className="w-24 h-10 border-none bg-white rounded-xl text-right font-black" />
                                          </div>
                                          <div className="flex justify-between items-center">
                                             <label className="text-xs font-bold text-slate-700">Specific Gravity</label>
                                             <Input type="number" step="0.01" placeholder="1.02" className="w-24 h-10 border-none bg-white rounded-xl text-right font-black" />
                                          </div>
                                       </div>
                                    </div>

                                    <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                       <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-400">Organoleptic Tests</h4>
                                       <div className="space-y-4">
                                          <div className="flex justify-between items-center">
                                             <label className="text-xs font-bold text-slate-700">Appearance</label>
                                             <Select><SelectTrigger className="w-32 h-10 border-none bg-white"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="CLEAR">Clear Gel</SelectItem><SelectItem value="OPAQUE">Opaque</SelectItem></SelectContent></Select>
                                          </div>
                                          <div className="flex justify-between items-center">
                                             <label className="text-xs font-bold text-slate-700">Odor</label>
                                             <Select><SelectTrigger className="w-32 h-10 border-none bg-white"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="STD">Standard</SelectItem><SelectItem value="OFF">Off-odor</SelectItem></SelectContent></Select>
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                       <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-xl">
                                          <ShieldCheck className="h-8 w-8 text-indigo-600" />
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">Final QC Decision</p>
                                          <div className="flex gap-2 mt-2">
                                             <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] px-6 rounded-xl">Release Batch</Button>
                                             <Button className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] px-6 rounded-xl">Reject / Quarantine</Button>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </DialogContent>
                        </Dialog>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>
    </div>
  );
}

function StatMiniCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
     <Card className="rounded-3xl border-none shadow-xl shadow-slate-100 p-6 bg-white flex flex-col justify-center">
        <p className="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-1">{label}</p>
        <p className={cn("text-xl font-black italic tracking-tighter", color)}>{value}</p>
     </Card>
  );
}

