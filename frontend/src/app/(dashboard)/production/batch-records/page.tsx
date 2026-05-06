"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Printer, 
  Download, 
  History,
  Activity,
  ClipboardList,
  FlaskConical,
  Zap,
  Package,
  ShieldCheck,
  Calendar,
  Layers
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

export default function BatchRecordsPage() {
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batch-records"],
    queryFn: async () => {
      const res = await api.get("/production/batch-records");
      return res.data;
    }
  });

  const filteredBatches = batches?.filter((b: any) => 
    b.batchNo?.toLowerCase().includes(search.toLowerCase()) || 
    b.lead?.brandName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-slate-900 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Quality Assurance Protocols</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Batch <span className="text-indigo-600">Records</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             End-to-end production audit trail & material consumption logs
           </p>
        </div>

        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search batch number..." 
                className="pl-11 h-14 w-80 bg-white border-slate-200 rounded-2xl shadow-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <Button className="h-14 px-6 bg-slate-900 text-white rounded-2xl shadow-xl font-black uppercase text-xs">
              <Download className="mr-2 h-4 w-4" /> Export All
           </Button>
        </div>
      </div>

      {selectedBatch ? (
        <BatchDetailView batch={selectedBatch} onBack={() => setSelectedBatch(null)} />
      ) : (
        <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Batch / WO No.</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Product / Brand</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Stages</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Target vs Result</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Audit Status</TableHead>
                <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches?.map((batch: any) => (
                <TableRow key={batch.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                  <TableCell className="py-8 pl-10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                        <History className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{batch.batchNo}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Created {new Date(batch.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-slate-900 text-sm uppercase italic">{batch.lead?.productInterest || "N/A"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{batch.lead?.brandName || "No Brand"}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {['MIXING', 'FILLING', 'PACKING'].map(s => {
                        const exists = batch.schedules?.some((sch: any) => sch.stage === s);
                        return (
                          <Badge key={s} className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center p-0 border-none",
                            exists ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300"
                          )}>
                            {s === 'MIXING' ? <FlaskConical size={14} /> : s === 'FILLING' ? <Zap size={14} /> : <Package size={14} />}
                          </Badge>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-slate-900 text-sm">{batch.targetQty.toLocaleString()} <span className="text-[10px] text-slate-400">pcs</span></p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Yield: {((batch.schedules?.[batch.schedules.length - 1]?.resultQty / batch.targetQty) * 100).toFixed(1)}%</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none",
                      batch.stage === 'FINISHED_GOODS' ? "bg-emerald-500 text-white" : "bg-indigo-100 text-indigo-700"
                    )}>
                      {batch.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-10 text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedBatch(batch)}
                      className="h-11 px-6 font-black uppercase tracking-tight text-[10px] rounded-xl hover:bg-slate-900 hover:text-white transition-all italic"
                    >
                      Audit Record <ChevronRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function BatchDetailView({ batch, onBack }: { batch: any; onBack: () => void }) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-500">
      <Button variant="ghost" onClick={onBack} className="font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900">
        <ChevronRight className="rotate-180 mr-2 h-4 w-4" /> Back to list
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         <Card className="col-span-2 rounded-[3rem] p-12 bg-white border-none shadow-2xl shadow-slate-100 space-y-10">
            <div className="flex justify-between items-start border-b border-slate-50 pb-10">
               <div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">Batch Report <span className="text-indigo-600">#{batch.batchNo}</span></h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Comprehensive Manufacturing & Quality Log</p>
               </div>
               <div className="flex gap-3">
                  <Button variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] border-slate-200"><Printer className="mr-2 h-4 w-4" /> Print BMR</Button>
                  <Button className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]"><ShieldCheck className="mr-2 h-4 w-4" /> Verify Batch</Button>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Order</p>
                  <p className="text-sm font-black italic text-slate-900 uppercase">{batch.lead?.clientName || 'N/A'}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Specification</p>
                  <p className="text-sm font-black italic text-slate-900 uppercase">{batch.lead?.productInterest || 'N/A'}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Yield Rate</p>
                  <p className="text-sm font-black italic text-emerald-600 uppercase">98.4% Efficiency</p>
               </div>
            </div>

            {/* Production Stages Timeline */}
            <div className="space-y-8">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 flex items-center gap-3">
                  <Layers className="h-4 w-4 text-indigo-500" /> Stage Execution logs
               </h3>
               <div className="space-y-6">
                  {batch.schedules?.map((sch: any) => (
                    <div key={sch.id} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col gap-6">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                {sch.stage === 'MIXING' ? <FlaskConical className="h-5 w-5 text-blue-500" /> : sch.stage === 'FILLING' ? <Zap className="h-5 w-5 text-indigo-500" /> : <Package className="h-5 w-5 text-violet-500" />}
                             </div>
                             <div>
                                <p className="font-black italic text-slate-900 text-base uppercase">{sch.stage} — {sch.scheduleNumber}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Machine: {sch.machine?.name || 'Manual'}</p>
                             </div>
                          </div>
                          <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] px-4 py-1.5 uppercase tracking-widest rounded-xl">STAGE COMPLETED</Badge>
                       </div>

                       <div className="grid grid-cols-4 gap-6 bg-white/50 p-6 rounded-2xl border border-slate-100/50">
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Qty</p>
                             <p className="text-sm font-black italic text-slate-900">{sch.targetQty.toLocaleString()} <span className="text-[9px] opacity-30">PCS</span></p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Result Qty</p>
                             <p className="text-sm font-black italic text-slate-900">{sch.resultQty?.toLocaleString() || '0'} <span className="text-[9px] opacity-30">PCS</span></p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Loss/Reject</p>
                             <p className="text-sm font-black italic text-rose-500">{((sch.targetQty - (sch.resultQty || 0))).toLocaleString()} <span className="text-[9px] opacity-30 text-slate-400">PCS</span></p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Operator</p>
                             <p className="text-sm font-black italic text-slate-900 uppercase">System Finalized</p>
                          </div>
                       </div>

                       {/* Material Detail Table for this Stage */}
                       {sch.stepDetails?.length > 0 && (
                         <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            <Table>
                               <TableHeader className="bg-slate-50/50">
                                  <TableRow className="border-none">
                                     <TableHead className="text-[8px] font-black uppercase text-slate-400">Material Component</TableHead>
                                     <TableHead className="text-[8px] font-black uppercase text-slate-400">Theoretical</TableHead>
                                     <TableHead className="text-[8px] font-black uppercase text-slate-400">Actual</TableHead>
                                     <TableHead className="text-[8px] font-black uppercase text-slate-400 text-right">Variance</TableHead>
                                  </TableRow>
                               </TableHeader>
                               <TableBody>
                                  {sch.stepDetails.map((det: any) => {
                                    const variance = (det.qtyActual || 0) - det.qtyTheoretical;
                                    return (
                                      <TableRow key={det.id} className="border-b border-slate-50 last:border-none">
                                         <TableCell className="text-[10px] font-bold text-slate-600 uppercase">{det.material?.name}</TableCell>
                                         <TableCell className="text-[10px] font-black tabular-nums">{det.qtyTheoretical.toLocaleString()}</TableCell>
                                         <TableCell className="text-[10px] font-black tabular-nums text-indigo-600">{det.qtyActual?.toLocaleString() || '0'}</TableCell>
                                         <TableCell className={cn("text-[10px] font-black text-right tabular-nums", variance > 0 ? "text-rose-500" : variance < 0 ? "text-amber-500" : "text-emerald-500")}>
                                            {variance > 0 ? `+${variance}` : variance}
                                         </TableCell>
                                      </TableRow>
                                    );
                                  })}
                               </TableBody>
                            </Table>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
         </Card>

         <div className="space-y-8">
            <Card className="rounded-[3rem] p-10 bg-slate-900 text-white border-none shadow-2xl shadow-slate-200">
               <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-8">Production Timeline</h4>
               <div className="space-y-10 relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-white/10" />
                  <TimelineItem date="2026-04-30 09:00" label="Batch Scheduled" status="completed" />
                  <TimelineItem date="2026-04-30 11:30" label="Material Released" status="completed" />
                  <TimelineItem date="2026-04-30 14:00" label="Mixing Finalized" status="completed" />
                  <TimelineItem date="2026-04-30 16:45" label="Filling Finalized" status="completed" />
                  <TimelineItem date="2026-05-01 10:00" label="Packing Complete" status="active" />
               </div>
            </Card>

            <Card className="rounded-[3rem] p-10 bg-white border-none shadow-xl shadow-slate-100">
               <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Quality Interlocks</h4>
               <div className="space-y-4">
                  <InterlockItem label="BMR Signed" status="pass" />
                  <InterlockItem label="Formula Verified" status="pass" />
                  <InterlockItem label="Yield Margin" status="pass" />
                  <InterlockItem label="QC Release" status="pending" />
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function TimelineItem({ date, label, status }: any) {
   return (
      <div className="flex items-center gap-8 pl-0 group">
         <div className={cn(
           "w-8 h-8 rounded-full border-2 z-10 transition-all flex items-center justify-center",
           status === 'completed' ? "bg-white border-white" : status === 'active' ? "bg-indigo-500 border-indigo-500 animate-pulse" : "bg-transparent border-white/20"
         )}>
            {status === 'completed' && <CheckCircle2 size={14} className="text-slate-900" />}
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase">{date}</span>
            <span className={cn("text-xs font-black italic uppercase", status === 'active' ? "text-indigo-400" : "text-white")}>{label}</span>
         </div>
      </div>
   );
}

function InterlockItem({ label, status }: any) {
   return (
      <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
         <span className="text-[10px] font-black uppercase text-slate-900 italic">{label}</span>
         <Badge className={cn(
            "text-[8px] font-black px-2 py-0.5 rounded-lg border-none uppercase",
            status === 'pass' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
          )}>
            {status === 'pass' ? 'PASS' : 'PENDING'}
          </Badge>
      </div>
   );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

