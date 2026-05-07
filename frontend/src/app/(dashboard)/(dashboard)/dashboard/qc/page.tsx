"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  ClipboardCheck, 
  ShieldAlert,
  Dna
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// --- Types ---
interface QCPendingLog {
  id: string;
  stage: string;
  input_qty: number;
  qty_result: number;
  qty_reject: number;
  qty_quarantine: number;
  shrinkage_qty: number;
  created_at: string;
  wo: {
    id: string;
    batch_no: string;
  };
  qcAudits: { status: string }[];
}

export default function QCPortal() {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<QCPendingLog | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // --- Fetchers ---
  const { data: plans } = useQuery({
    queryKey: ["production-plans-qc"],
    queryFn: async () => {
      const res = await api.get("/production-plans");
      return res.data;
    }
  });

  // Extract logs that are waiting for audit (no audits OR last audit isn't PASS)
  const pendingAudits: QCPendingLog[] = plans?.flatMap((plan: { id: string; batch_no: string; stepLogs: { id: string; qcAudits: { status: string }[] }[] }) => 
     plan.stepLogs.filter((log: { qcAudits: { status: string }[] }) => 
       log.qcAudits.length === 0 || !log.qcAudits.some((a: { status: string }) => a.status === "PASS")
     ).map((log) => ({ ...log, wo: { id: plan.id, batch_no: plan.batch_no } } as QCPendingLog))
  ) || [];

  // --- Mutations ---
  const submitAuditMutation = useMutation({
    mutationFn: async (payload: { step_log_id: string; status: "PASS" | "FAIL"; notes?: string }) => {
      return api.post("/qc", payload);
    },
    onSuccess: (_, variables) => {
      const statusText = variables.status === "PASS" ? "LAB CERTIFIED" : "BATCH REJECTED";
      toast.success(`${statusText}: Data transmitted back to Production Floor.`);
      queryClient.invalidateQueries({ queryKey: ["production-plans-qc"] });
      queryClient.invalidateQueries({ queryKey: ["production-plans-floor"] });
      setIsAuditModalOpen(false);
    },
    onError: () => toast.error("Audit submission failed. Check lab server database.")
  });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-1000 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Lab Audit Terminal</h1>
           <p className="text-zinc-500 font-sans text-sm uppercase tracking-tight mt-2">
             <span className="text-emerald-500 animate-pulse">●</span> QC Pass-Fail Certification Center
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
           <CardHeader className="flex flex-row items-center justify-between">
              <div>
                 <CardTitle className="text-lg font-bold text-white uppercase tracking-tighter flex items-center">
                    <ClipboardCheck className="mr-2 h-5 w-5 text-emerald-500" /> STAGE INSPECTION INBOX
                 </CardTitle>
                 <CardDescription className="text-zinc-500">Live feed from the production floor - Waiting for verification.</CardDescription>
              </div>
              <Badge className="bg-amber-500 text-black font-black uppercase text-[10px] rounded-none">{pendingAudits.length} PENDING AUDITS</Badge>
           </CardHeader>
           <CardContent>
              <div className="rounded-xl border border-zinc-900 overflow-hidden">
                 <Table>
                    <TableHeader className="bg-zinc-900/50">
                       <TableRow className="border-zinc-900">
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Batch Registry</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Completed Stage</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Yield (Good)</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Operational Status</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {pendingAudits.map(log => (
                          <TableRow key={log.id} className="border-zinc-900 hover:bg-white/[0.01]">
                             <TableCell className="font-black text-white uppercase italic">{log.wo.batch_no}</TableCell>
                             <TableCell>
                                <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-black uppercase text-[9px] rounded-none px-3 py-1">
                                   {log.stage}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right font-sans text-zinc-300 font-bold">
                                {Number(log.qty_result).toLocaleString()} Units
                             </TableCell>
                             <TableCell className="text-right">
                                {log.qcAudits.some(a => a.status === "FAIL") ? (
                                   <Badge className="bg-red-500/10 text-red-500 border border-red-500/30 font-black text-[9px] rounded-none">FAIL RETRY</Badge>
                                ) : (
                                   <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/30 font-black text-[9px] rounded-none px-2 py-0.5">WAITING AUDIT</Badge>
                                )}
                             </TableCell>
                             <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  className="bg-white text-black hover:bg-emerald-500 hover:text-white"
                                  onClick={() => { setSelectedLog(log); setIsAuditModalOpen(true); }}
                                >
                                   INSPECT
                                </Button>
                             </TableCell>
                          </TableRow>
                       ))}
                       {pendingAudits.length === 0 && (
                          <TableRow>
                             <TableCell colSpan={5} className="text-center py-24">
                                <p className="text-zinc-800 font-black text-3xl uppercase tracking-tight italic opacity-20">No Lab Pending Jobs</p>
                             </TableCell>
                          </TableRow>
                       )}
                    </TableBody>
                 </Table>
              </div>
           </CardContent>
        </Card>
      </div>

      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
         <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-4xl p-0 overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)]">
            <div className="grid grid-cols-1 md:grid-cols-12">
               {/* Left Specs Panel */}
               <div className="md:col-span-4 bg-zinc-900/50 p-10 flex flex-col justify-between border-r border-zinc-800">
                  <div>
                     <p className="text-xs font-black text-zinc-500 uppercase tracking-tight mb-4">Inspection Subject</p>
                     <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2">{selectedLog?.wo.batch_no}</h2>
                     <p className="text-emerald-500 font-black text-2xl uppercase italic tracking-tighter">{selectedLog?.stage}</p>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="p-4 bg-zinc-950 rounded border border-zinc-800">
                        <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Floor Telemetry</p>
                        <div className="flex justify-between items-center text-sm font-sans mt-2">
                           <span className="text-zinc-500 uppercase">Input:</span>
                           <span className="text-white">{selectedLog?.input_qty}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-sans mt-1">
                           <span className="text-emerald-500 uppercase">Yield:</span>
                           <span className="text-emerald-400">{selectedLog?.qty_result}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-sans mt-1">
                           <span className="text-red-500 uppercase">Reject:</span>
                           <span className="text-red-400">{selectedLog?.qty_reject}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-sans mt-3 pt-2 border-t border-zinc-900 font-black">
                           <span className="text-zinc-500 uppercase">Loss %:</span>
                           <span className="text-white">{( ( (selectedLog?.shrinkage_qty || 0) / (selectedLog?.input_qty || 1) ) * 100).toFixed(2)}%</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right Audit Panel */}
               <div className="md:col-span-8 p-12 flex flex-col justify-center gap-10">
                  <div className="text-center">
                     <Dna className="h-16 w-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                     <h3 className="text-2xl font-black uppercase tracking-tight italic">Verification Decision</h3>
                     <p className="text-zinc-500 text-sm mt-1 uppercase font-bold">This status will be reflected immediately at the Production Floor</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <Button 
                       className="h-48 rounded-2xl flex flex-col gap-4 bg-emerald-500 hover:bg-emerald-400 text-black border-none transition-all group scale-100 hover:scale-[1.02]"
                       onClick={() => selectedLog && submitAuditMutation.mutate({ step_log_id: selectedLog.id, status: "PASS" })}
                       disabled={submitAuditMutation.isPending}
                     >
                        <CheckCircle2 className="h-16 w-16 group-hover:scale-110 transition-transform" />
                        <span className="text-3xl font-black uppercase tracking-tighter italic">CERTIFY PASS</span>
                     </Button>

                     <Button 
                       className="h-48 rounded-2xl flex flex-col gap-4 bg-red-600 hover:bg-red-500 text-white border-none transition-all group scale-100 hover:scale-[1.02]"
                       onClick={() => selectedLog && submitAuditMutation.mutate({ step_log_id: selectedLog.id, status: "FAIL", notes: "Audit Failure: Recheck parameters." })}
                       disabled={submitAuditMutation.isPending}
                     >
                        <ShieldAlert className="h-16 w-16 group-hover:shake transition-transform" />
                        <span className="text-3xl font-black uppercase tracking-tighter italic">REJECT STAGE</span>
                     </Button>
                  </div>

                  <p className="text-[10px] text-zinc-600 font-sans text-center uppercase tracking-tight">
                     Certified Audit Logs are Non-Erasable and meet BPOM/FDA Traceability Standards.
                  </p>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

