"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Play, 
  CheckCircle2, 
  ChevronRight,
  AlertOctagon,
  Settings,
  User,
  Boxes,
  Printer,
  ShieldCheck,
  ScanBarcode,
  X
} from "lucide-react";
import { DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import { cn } from "@/lib/utils";
import { IndustrialNumpad } from "@/components/production/IndustrialNumpad";
import { TerminalTabNav } from "@/components/production/TerminalTabNav";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function PackingTerminalV4() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [resultQty, setResultQty] = useState("");
  const [notes, setNotes] = useState("");

  // Numpad States
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [numpadValue, setNumpadValue] = useState("");

  // Tolerance PIN States
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState("");

  // QR Scan States
  const [manualQrInput, setManualQrInput] = useState("");
  const [pendingScan, setPendingScan] = useState<any>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownReason, setBreakdownReason] = useState("");
  const [isComponentNumpad, setIsComponentNumpad] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Fetch active packing schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["packing-schedules"],
    queryFn: async () => {
      const res = await api.get("/production/schedules?stage=PACKING");
      return res.data;
    }
  });

  const activeSchedule = schedules?.find((s: any) => s.status === "IN_PROGRESS") || schedules?.[0];

  const submitActualsMutation = useMutation({
    mutationFn: async (data: any) => api.post(`/production/schedules/${activeSchedule.id}/actuals`, data),
    onSuccess: () => {
      toast.success("Secondary PM component verified.");
      queryClient.invalidateQueries({ queryKey: ["packing-schedules"] });
      setIsScanning(false);
      setPendingScan(null);
      setManualQrInput("");
    },
    onError: (err: any) => {
      toast.error("Component Verification Failed", {
        description: err.response?.data?.message || "Check batch and inventory status."
      });
      setIsScanning(false);
    }
  });

  const submitResultMutation = useMutation({
    mutationFn: async (data: { id: string; resultQty: number; notes?: string; supervisorPin?: string; supervisorId?: string; elapsedSeconds?: number }) => 
      api.post(`/production/schedules/${data.id}/result`, data),
    onSuccess: () => {
      toast.success("Final Finished Goods submitted. Cycle Closed.");
      queryClient.invalidateQueries({ queryKey: ["packing-schedules"] });
      setIsRunning(false);
      setResultQty("");
    },
    onError: (err: any) => {
      toast.error("Submission Failed", {
        description: err.response?.data?.message || "Check interlocks."
      });
    }
  });

  const reportBreakdownMutation = useMutation({
    mutationFn: async (notes: string) => api.post("/production/breakdown", {
      workOrderId: activeSchedule.workOrderId,
      stage: "PACKING",
      machineId: activeSchedule.machineId,
      notes
    }),
    onSuccess: () => {
      toast.error("EMERGENCY STOP REGISTERED", {
        description: "Maintenance team notified. Line locked.",
        icon: <AlertOctagon className="text-rose-500" />
      });
      setIsRunning(false);
    }
  });

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleScanMaterial = (detailId: string, theoretical: number) => {
    setPendingScan({ detailId, theoretical, materialName: activeComponent?.material?.name });
    setManualQrInput("");
    setIsScanning(true);
  };

  const confirmQrScan = () => {
    if (!manualQrInput.trim()) {
      toast.error("Scan or enter QR code");
      return;
    }
    setIsScanning(false);
    setNumpadValue(pendingScan.theoretical.toString());
    setIsComponentNumpad(true);
    setIsNumpadOpen(true);
  };

  if (isLoading) return <div className="h-screen bg-white flex items-center justify-center text-gray-900 font-black italic">INITIALIZING PACKING TERMINAL...</div>;
  if (!activeSchedule) return <div className="h-screen bg-white flex items-center justify-center text-gray-900 font-black italic">NO ACTIVE PACKING SCHEDULES.</div>;

  const components = activeSchedule.stepDetails || [];
  const activeComponent = components.find((c: any) => !c.qtyActual);
  const isComponentsReady = components.every((c: any) => c.qtyActual > 0);

  // Artwork status logic (simplified for FE display)
  const isArtworkApproved = activeSchedule.workOrder?.lead?.regulatoryPipelines?.some((p: any) => 
     p.artworkReviews?.some((a: any) => a.isApproved)
  );

  return (
    <DashboardShell title="Terminal" titleAccent="Packing V.4" subtitle={`Batch: ${activeSchedule.scheduleNumber}`}>
      <TerminalTabNav />
      {/* Top Status Bar */}
      <header className="h-20 border-b border-gray-200 flex items-center justify-between px-10 bg-gray-50 z-50">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
              PACKING <span className="text-violet-600">STATION 01</span>
            </h1>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Final Consolidation Terminal V4.0</span>
          </div>
          <div className="h-10 w-[1px] bg-gray-100" />
          <div className="flex items-center gap-4">
<DnaBadge className="bg-gray-100 text-violet-600 border border-violet-400/30 px-4 py-1.5 font-black text-[10px] tracking-tight rounded-lg">
                 BATCH: {activeSchedule.scheduleNumber}
              </DnaBadge>
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase">System Online</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Clock</span>
              <span className="text-sm font-black italic uppercase tracking-tighter tabular-nums">
                 {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
           </div>
           <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
              <Settings className="w-5 h-5 text-gray-400" />
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Requirements & Interlocks */}
        <section className="w-[35%] border-r border-gray-200 bg-gray-50 p-10 overflow-y-auto custom-scrollbar space-y-10">
          <div>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-violet-600" />
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Critical Interlocks</h2>
               </div>
            </div>
            
            <div className="space-y-3">
               <InterlockItem 
                 label="Legal Artwork Approval" 
                 status={isArtworkApproved ? 'APPROVED' : 'LOCKED'} 
                 icon={<Printer className="w-4 h-4" />}
               />
               <InterlockItem 
                 label="QC Bulk Release" 
                 status="RELEASED" 
                 icon={<ShieldCheck className="w-4 h-4" />}
               />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <Boxes className="w-4 h-4 text-violet-600" />
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Secondary PM Components</h2>
               </div>
            </div>
            <div className="space-y-3">
               {components.map((c: any) => (
                 <ComponentItem 
                   key={c.id} 
                   name={c.material?.name} 
                   target={`${c.qtyTheoretical.toLocaleString()} PCS`} 
                   status={c.qtyActual ? 'completed' : activeComponent?.id === c.id ? 'active' : 'pending'} 
                 />
               ))}
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 text-center">Inkjet Coder Guide</h3>
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Production Batch</span>
                <p className="text-4xl font-black italic tracking-tighter text-gray-900">{activeSchedule.scheduleNumber}</p>
             </div>
             <div className="h-px bg-violet-500/10" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expired Date</span>
                <p className="text-3xl font-black italic tracking-tighter text-gray-500">05 / 2028</p>
             </div>
          </div>
        </section>

        {/* RIGHT PANEL: Execution Area */}
        <section className="flex-1 p-12 bg-white flex flex-col relative">
           {isScanning && (
             <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
                <button onClick={() => { setIsScanning(false); setPendingScan(null); }} className="absolute top-10 right-10 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-900"><X className="w-8 h-8" /></button>
                <div className="w-full max-w-xl space-y-10">
                   <div className="flex flex-col items-center">
                      <ScanBarcode className="w-24 h-24 text-violet-500/30 mb-6" />
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase text-violet-600">Scan Secondary Component</h3>
                      <p className="mt-2 text-gray-500 font-bold uppercase tracking-widest text-xs">Awaiting: {pendingScan?.materialName}</p>
                   </div>
                   <div className="space-y-4">
<DnaInput
                          value={manualQrInput}
                          onChange={(e) => setManualQrInput(e.target.value)}
                          placeholder="Scan or type PM QR code..."
                          className="h-16 text-xl font-mono text-center bg-gray-100 border-gray-200 text-gray-900 rounded-2xl"
                          autoFocus
                       />
                      <div className="flex gap-4">
<DnaButton
                             variant="primary"
                             onClick={confirmQrScan}
                             className="flex-1 h-16 text-lg font-black uppercase rounded-2xl bg-violet-600 hover:bg-violet-500 text-white"
                          >
                             Confirm QR
                          </DnaButton>
<DnaButton
                             variant="ghost"
                             onClick={() => { setIsScanning(false); setPendingScan(null); }}
                             className="h-16 px-8 text-lg font-black uppercase rounded-2xl text-gray-500 hover:text-gray-900"
                          >
                             Cancel
                          </DnaButton>
                      </div>
                   </div>
                </div>
             </div>
           )}

           <div className="flex justify-between items-start mb-16">
              <div className="space-y-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-600">Final Stage</span>
                 <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">PACK <span className="text-gray-400">&</span> LABEL</h2>
              </div>
              <div className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-2xl border border-gray-200">
                <User className="w-4 h-4 text-violet-600" />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Packing Lead</span>
                    <span className="text-xs font-black uppercase italic tracking-tight">Industrial Terminal</span>
                </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center space-y-12">
              <div 
                onClick={() => {
                  if (isComponentsReady) return setIsRunning(!isRunning);
                  handleScanMaterial(activeComponent.id, activeComponent.qtyTheoretical);
                }}
                className={cn(
                  "w-full max-w-xl p-12 border-2 rounded-[24px] bg-gray-50 relative overflow-hidden group cursor-pointer transition-all duration-500 active:scale-95",
                  !isComponentsReady ? "border-violet-500/30" : isRunning ? "border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.08)]" : "border-gray-200"
                )}
              >
                 <div className="relative z-10 flex flex-col items-center text-center space-y-10">
                    <div className={cn("w-32 h-32 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-700", !isComponentsReady ? "bg-violet-500" : isRunning ? "bg-emerald-500 shadow-emerald-500/40" : "bg-gray-100")}>
                       {!isComponentsReady ? <ScanBarcode className="w-16 h-16 text-black" /> : <Play className="w-16 h-16 text-black fill-black" />}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4 text-gray-900">
                         {!isComponentsReady ? "SCAN PACKAGING" : isRunning ? "PACKING IN PROGRESS" : "START PACKING CYCLE"}
                       </h3>
                       <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                          {!isComponentsReady ? `Requirement: ${activeComponent.material?.name}` : "Validation complete. Start assembly line."}
                       </p>
                    </div>
                 </div>
                 {!isArtworkApproved && (
                    <div className="absolute inset-0 z-50 bg-rose-100/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                       <AlertOctagon className="w-20 h-20 text-gray-900 mb-6" />
                       <h4 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Artwork Not Approved</h4>
                       <p className="text-gray-500 text-sm mt-4 font-bold max-w-xs">Akses terminal terkunci. Hubungi divisi Legal untuk Approval Desain Label.</p>
                    </div>
                 )}
              </div>

              <div className="w-full grid grid-cols-3 gap-8 max-w-4xl">
                 <MetricInput label="Good Output" value={resultQty || "0"} unit="PCS" status="ok" onClick={() => setIsNumpadOpen(true)} />
                 <MetricInput label="Yield Rate" value={resultQty ? `${((Number(resultQty) / activeSchedule.targetQty) * 100).toFixed(1)}%` : "0%"} unit="RATIO" status="ok" />
                 <MetricInput label="Elapsed Time" value={formatElapsedTime(elapsedTime)} unit="LIVE" status="active" />
              </div>
           </div>

           <footer className="h-40 border-t border-gray-200 flex items-center gap-10">
              <div className="h-24 px-10 bg-gray-50 rounded-[24px] border border-gray-200 flex items-center gap-6 group hover:border-rose-500/30 transition-all flex-1">
                 <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <AlertOctagon className="w-6 h-6 text-rose-500" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Protocol</span>
                    <span className="text-xs font-black uppercase text-rose-500 italic">Emergency Stop</span>
                 </div>
                  <button 
                    onClick={() => {
                       setBreakdownReason("");
                       setIsBreakdownModalOpen(true);
                    }}
                    className="ml-auto bg-rose-600 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:bg-rose-500 transition-all"
                  >
                     TRIGGER STOP
                  </button>
              </div>

              <button 
                onClick={() => {
                   if (!isComponentsReady) return toast.error("Complete component scanning first.");
                   if (!resultQty || resultQty === "0") return toast.error("Input Good Output quantity.");
                   submitResultMutation.mutate({ id: activeSchedule.id, resultQty: Number(resultQty), notes, elapsedSeconds: elapsedTime });
                }}
                className={cn(
                  "h-24 px-16 rounded-[24px] font-black italic uppercase text-lg flex items-center gap-4 transition-all group overflow-hidden",
                  isComponentsReady && resultQty !== "0" ? "bg-emerald-500 text-black shadow-xl" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
              >
                 Finalize Finished Goods <ChevronRight className="w-6 h-6" />
              </button>
           </footer>
        </section>
      </main>

      {isNumpadOpen && (
        <IndustrialNumpad
          value={isComponentNumpad ? numpadValue : resultQty}
          onChange={isComponentNumpad ? setNumpadValue : setResultQty}
          onConfirm={() => {
            if (isComponentNumpad) {
              submitActualsMutation.mutate({
                actuals: [{
                  detailId: pendingScan?.detailId,
                  qtyActual: Number(numpadValue),
                  inventoryId: manualQrInput
                }]
              });
              setIsComponentNumpad(false);
              setNumpadValue("");
            } else {
              setIsNumpadOpen(false);
            }
          }}
          onClose={() => {
            setIsNumpadOpen(false);
            if (isComponentNumpad) {
              setIsComponentNumpad(false);
              setNumpadValue("");
            }
          }}
          label={isComponentNumpad ? `Actual Qty: ${pendingScan?.materialName ?? ""}` : "Good Output"}
          unit="PCS"
        />
      )}

      {/* Breakdown Dialog */}
      <Dialog open={isBreakdownModalOpen} onOpenChange={setIsBreakdownModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-rose-500">
              Emergency Stop
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Enter the reason for stopping the packing line.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={breakdownReason}
            onChange={(e) => setBreakdownReason(e.target.value)}
            placeholder="Describe the issue..."
            className="min-h-[120px] mt-2"
          />
          <DialogFooter>
            <DnaButton
              variant="ghost"
              onClick={() => setIsBreakdownModalOpen(false)}
              className="text-gray-500 border-none"
            >
              Cancel
            </DnaButton>
            <DnaButton
              variant="danger"
              onClick={() => {
                if (breakdownReason.trim()) {
                  reportBreakdownMutation.mutate(breakdownReason);
                  setIsBreakdownModalOpen(false);
                  setBreakdownReason("");
                } else {
                  toast.error("Enter a breakdown reason");
                }
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black"
            >
              Confirm Stop
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .animate-scan { animation: scan 3s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </DashboardShell>
  );
}

function InterlockItem({ label, status, icon }: any) {
   const isApproved = status === 'APPROVED' || status === 'RELEASED';
   return (
      <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-200">
         <div className="flex items-center gap-4">
            <div className={cn("p-2 rounded-lg", isApproved ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
               {icon}
            </div>
            <span className="text-[10px] font-black uppercase text-gray-500">{label}</span>
         </div>
<DnaBadge className={cn("border-none text-[8px] font-black px-3 py-1", isApproved ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500")}>
             {status}
          </DnaBadge>
      </div>
   );
}

function ComponentItem({ name, target, status }: any) {
   const isCompleted = status === 'completed';
   const isActive = status === 'active';
   return (
      <div className={cn(
        "flex items-center justify-between p-6 rounded-2xl border transition-all",
        isCompleted ? "bg-emerald-500/[0.02] border-emerald-500/10 opacity-40" : 
        isActive ? "bg-violet-400/[0.05] border-violet-400/30 shadow-[0_0_30px_rgba(167,139,250,0.05)]" : "bg-gray-50 border-gray-200"
      )}>
         <div className="flex items-center gap-5">
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all", isCompleted ? "bg-emerald-500 text-black" : isActive ? "bg-violet-400 text-black" : "bg-gray-100")}>
               {isCompleted ? <CheckCircle2 size={14} className="stroke-[3px]" /> : <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-gray-900" : "bg-gray-300")} />}
            </div>
            <div className="flex flex-col">
               <span className={cn("text-xs font-bold uppercase tracking-tight", isCompleted ? "text-emerald-500/50 line-through" : "text-gray-900")}>{name}</span>
               {isActive && <span className="text-[8px] font-black uppercase text-violet-600 tracking-[0.2em] mt-1">Scan Required</span>}
            </div>
         </div>
         <span className="text-sm font-black italic tabular-nums">{target}</span>
      </div>
   );
}

function MetricInput({ label, value, unit, status, onClick }: any) {
  return (
    <div className={cn("flex flex-col items-center space-y-4", onClick && "cursor-pointer")} onClick={onClick}>
       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">{label}</span>
       <div className={cn("w-full h-28 rounded-2xl bg-gray-50 border flex flex-col items-center justify-center relative overflow-hidden transition-all", status === 'active' ? "border-violet-400/40" : "border-gray-200")}>
          <span className="text-3xl font-black italic tracking-tighter tabular-nums text-gray-900">{value}</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{unit}</span>
       </div>
    </div>
  );
}



function MetricCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center space-y-4">
       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">{label}</span>
       <div className="w-full h-28 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-black italic tracking-tighter tabular-nums", color)}>{value}</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{unit}</span>
       </div>
    </div>
  );
}

