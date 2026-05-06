"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Zap, 
  Clock, 
  Gauge, 
  Thermometer, 
  ChevronRight, 
  QrCode, 
  FlaskConical,
  PackageCheck,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Scale,
  User,
  CheckCircle2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/hooks/useWakeLock";
import { IndustrialNumpad } from "@/components/production/IndustrialNumpad";
import { toast } from "sonner";

export default function FillingTerminalV4() {
  useWakeLock();
  const queryClient = useQueryClient();
  
  // States
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProductionActive, setIsProductionActive] = useState(false);

  // Numpad States
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [numpadValue, setNumpadValue] = useState("");
  const [numpadLabel, setNumpadLabel] = useState("");
  const [numpadUnit, setNumpadUnit] = useState("");
  const [activeInput, setActiveInput] = useState<"GOOD" | "REJECT" | "DOWNTIME" | null>(null);

  // Actual Values
  const [goodQty, setGoodQty] = useState("0");
  const [rejectQty, setRejectQty] = useState("0");

  // Tolerance PIN States
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [pendingActuals, setPendingActuals] = useState<any>(null);
  const [supervisorPin, setSupervisorPin] = useState("");

  // Manual QR Scan States
  const [manualQrInput, setManualQrInput] = useState("");
  const [pendingScan, setPendingScan] = useState<{ detailId: string; theoretical: number } | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownReason, setBreakdownReason] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isProductionActive) return;
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isProductionActive]);

  // Fetch active filling schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["filling-schedules"],
    queryFn: async () => {
      const res = await api.get("/production/schedules?stage=FILLING");
      return res.data;
    }
  });

  const activeSchedule = schedules?.find((s: any) => s.status === "IN_PROGRESS") || schedules?.[0];

  const submitActualsMutation = useMutation({
    mutationFn: async (data: any) => api.post(`/production/schedules/${activeSchedule.id}/actuals`, data),
    onSuccess: () => {
      toast.success("Packaging material record updated.");
      queryClient.invalidateQueries({ queryKey: ["filling-schedules"] });
      setIsScanning(false);
      setIsSupervisorModalOpen(false);
      setSupervisorPin("");
      setPendingActuals(null);
    },
    onError: (err: any) => {
      if (err.response?.data?.code === 'TOLERANCE_EXCEEDED') {
        toast.warning("Component Tolerance Exceeded", {
          description: err.response.data.message
        });
        setIsSupervisorModalOpen(true);
      } else {
        toast.error("Submission Failed", {
          description: err.response?.data?.message || "Check terminal connection."
        });
      }
      setIsScanning(false);
    }
  });

  const reportBreakdownMutation = useMutation({
    mutationFn: async (notes: string) => api.post("/production/breakdown", {
      workOrderId: activeSchedule.workOrderId,
      stage: "FILLING",
      machineId: activeSchedule.machineId,
      notes
    }),
    onSuccess: () => {
      toast.error("EMERGENCY STOP REGISTERED", {
        description: "Maintenance team notified. Filling line halted.",
        icon: <AlertTriangle className="text-rose-500" />
      });
      setIsProductionActive(false);
    }
  });

  const submitResultMutation = useMutation({
    mutationFn: async (data: { resultQty: number; notes?: string; elapsedSeconds?: number; downtimeMinutes?: number }) => 
      api.post(`/production/schedules/${activeSchedule.id}/result`, data),
    onSuccess: () => {
      toast.success("Filling result submitted. Moving to Packing stage.");
      queryClient.invalidateQueries({ queryKey: ["filling-schedules"] });
      setIsProductionActive(false);
    },
    onError: (err: any) => {
      const errorData = err.response?.data;
      if (errorData?.code === 'PHYSICAL_LIMIT_EXCEEDED') {
        toast.error("HUKUM FISIKA DILANGGAR", {
          description: errorData.message,
          duration: 10000
        });
      } else if (errorData?.code === 'QC_BULK_NOT_PASSED') {
          toast.error("AKSES DITOLAK: QC BULK FAILED", {
            description: errorData.message,
            className: "bg-rose-600 text-white font-black"
          });
          setBlockingError(errorData.message);
      } else {
        toast.error("Submission Failed", {
          description: errorData?.message || "Check terminal connection."
        });
      }
    }
  });

  const [blockingError, setBlockingError] = useState<string | null>(null);
  const [downtimeMinutes, setDowntimeMinutes] = useState("0");

  const openNumpad = (label: string, unit: string, currentVal: string, type: "GOOD" | "REJECT" | "DOWNTIME") => {
    setNumpadLabel(label);
    setNumpadUnit(unit);
    setNumpadValue(currentVal);
    setActiveInput(type);
    setIsNumpadOpen(true);
  };

  const handleNumpadConfirm = () => {
    if (activeInput === "GOOD") setGoodQty(numpadValue);
    if (activeInput === "REJECT") setRejectQty(numpadValue);
    if (activeInput === "DOWNTIME") setDowntimeMinutes(numpadValue);
    setIsNumpadOpen(false);
  };

  const handleScanComponent = (detailId: string, theoretical: number) => {
    setPendingScan({ detailId, theoretical });
    setManualQrInput("");
    setIsScanning(true);
  };

  const confirmQrScan = () => {
    if (!pendingScan) return;
    const data = {
      actuals: [{ 
        detailId: pendingScan.detailId, 
        qtyActual: pendingScan.theoretical,
        inventoryId: manualQrInput || undefined 
      }]
    };
    setPendingActuals(data);
    setIsScanning(false);
    submitActualsMutation.mutate(data);
  };


  const handleSupervisorOverride = (pin: string) => {
    if (!pendingActuals) return;
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
    submitActualsMutation.mutate({
      ...pendingActuals,
      supervisorPin: pin,
      supervisorId: user.id || "MANAGER_ID"
    });
  };

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic">INITIALIZING FILLING TERMINAL...</div>;
  if (!activeSchedule) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic">NO ACTIVE FILLING SCHEDULES.</div>;

  const components = activeSchedule.stepDetails || [];
  const activeComponent = components.find((c: any) => !c.qtyActual);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#0A0A0A]">
         <div className="flex items-center gap-6">
            <div>
               <h1 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                  Terminal <span className="text-indigo-400">Filling</span> V.4
                  <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[8px] text-indigo-400 font-black tracking-widest uppercase">Precision Stage</div>
               </h1>
               <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Batch: {activeSchedule.scheduleNumber}</p>
            </div>
         </div>

         <div className="flex items-center gap-8">
            <div className="text-right">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target PCS</p>
               <p className="text-sm font-black italic text-white uppercase tracking-tight">{activeSchedule.targetQty.toLocaleString()}</p>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="text-right">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Real-time Clock</p>
               <p className="text-sm font-black italic text-indigo-400 tracking-tight tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour12: false })}
               </p>
            </div>
         </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <section className="w-[450px] border-r border-white/5 bg-[#050505] overflow-y-auto p-10 space-y-12">
            <div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl"><Settings className="w-5 h-5 text-indigo-400" /></div>
                  <h2 className="text-lg font-black italic tracking-tight uppercase">Filling Specs</h2>
               </div>
               <div className="space-y-4">
                  <SpecItem label="Base Input (Bulk)" value={`${activeSchedule.targetQty} KG`} />
                  <SpecItem label="Machine ID" value={activeSchedule.machine?.name || "N/A"} />
               </div>
            </div>

            <div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl"><PackageCheck className="w-5 h-5 text-indigo-400" /></div>
                  <h3 className="text-lg font-black italic tracking-tight uppercase">Components</h3>
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
        </section>

        <section className="flex-1 bg-black p-12 flex flex-col relative">
           {isScanning && (
              <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
                 <button onClick={() => { setIsScanning(false); setPendingScan(null); }} className="absolute top-10 right-10 w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white"><X className="w-8 h-8" /></button>
                 <div className="w-full max-w-2xl aspect-square border-4 border-indigo-500/20 rounded-[4rem] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent animate-scan" />
                    <div className="absolute inset-20 border-2 border-dashed border-indigo-500/40 rounded-[2rem] flex items-center justify-center">
                       <QrCode className="w-40 h-40 text-indigo-500/20" />
                    </div>
                 </div>
                 <h3 className="mt-12 text-3xl font-black italic tracking-tighter uppercase text-indigo-400">Scan Component Package</h3>
                 <p className="mt-4 text-white/40 font-bold uppercase tracking-widest text-xs">Awaiting: {activeComponent?.material?.name}</p>
                 <div className="mt-8 w-full max-w-md space-y-4">
                    <Input
                      value={manualQrInput}
                      onChange={(e) => setManualQrInput(e.target.value)}
                      placeholder="Scan or enter Inventory ID manually..."
                      className="h-16 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg font-bold placeholder:text-white/20"
                      autoFocus
                    />
                    <button
                      onClick={confirmQrScan}
                      className="w-full h-14 bg-indigo-500 text-white font-black uppercase rounded-2xl text-sm tracking-wider hover:bg-indigo-500/90 transition-all"
                    >
                      Confirm & Submit
                    </button>
                 </div>
              </div>
            )}

           <div className="flex-1 flex flex-col items-center justify-center space-y-12">
              <div 
                onClick={() => {
                  if (!activeComponent) return setIsProductionActive(!isProductionActive);
                  handleScanComponent(activeComponent.id, activeComponent.qtyTheoretical);
                }}
                className={cn(
                  "w-full max-w-xl p-12 border-2 rounded-[4rem] bg-[#0A0A0A] relative overflow-hidden group cursor-pointer transition-all duration-500 active:scale-95",
                  activeComponent ? "border-indigo-500/30 shadow-indigo-500/5" : "border-emerald-500/30 shadow-emerald-500/5"
                )}
              >
                 <div className="relative z-10 flex flex-col items-center text-center space-y-10">
                    <div className={cn("w-32 h-32 rounded-[3rem] flex items-center justify-center shadow-2xl transition-all duration-700", activeComponent ? "bg-indigo-500" : "bg-emerald-500")}>
                       {activeComponent ? <QrCode className="w-16 h-16 text-black" /> : <Zap className="w-16 h-16 text-black fill-black" />}
                    </div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4 text-white">
                      {activeComponent ? "SCAN PACKAGING" : isProductionActive ? "FILLING IN PROGRESS" : "START FILLING CYCLE"}
                    </h3>
                 </div>

                 {blockingError && (
                    <div className="absolute inset-0 z-50 bg-rose-600 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300">
                       <AlertTriangle className="w-24 h-24 text-white mb-8 animate-bounce" />
                       <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-4">AKSES DITOLAK</h2>
                       <p className="text-white font-bold text-lg max-w-md">{blockingError}</p>
                       <button 
                         onClick={() => setBlockingError(null)}
                         className="mt-12 px-10 py-4 bg-black text-white font-black uppercase rounded-2xl hover:bg-white hover:text-black transition-all"
                       >
                          Tutup & Perbaiki
                       </button>
                    </div>
                 )}
              </div>

              <div className="w-full grid grid-cols-4 gap-8 max-w-5xl">
                 <MetricInput label="Good Output" value={goodQty} unit="PCS" status="ok" onClick={() => openNumpad("Good Output", "PCS", goodQty, "GOOD")} />
                 <MetricInput label="Reject Output" value={rejectQty} unit="PCS" status="warning" onClick={() => openNumpad("Reject Output", "PCS", rejectQty, "REJECT")} />
                 <MetricInput label="Downtime" value={downtimeMinutes} unit="MIN" status={Number(downtimeMinutes) > 0 ? 'warning' : 'ok'} onClick={() => openNumpad("Total Downtime", "MIN", downtimeMinutes, "DOWNTIME")} />
                 <MetricInput label="Elapsed Time" value={`${Math.floor(elapsedTime/60)}:${(elapsedTime%60).toString().padStart(2, '0')}`} unit="LIVE" status="active" />
              </div>
           </div>

           <footer className="h-40 border-t border-white/5 flex items-center justify-between px-12 bg-[#0A0A0A]/50 -mx-12 -mb-12">
              <div className="flex gap-12">
                 <div className="text-left">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Efficiency Rate</p>
                    <p className="text-2xl font-black italic tracking-tight text-emerald-500">{goodQty !== "0" ? "99.8%" : "0%"}</p>
                 </div>
              </div>

              <button 
                onClick={() => { setBreakdownReason(""); setIsBreakdownModalOpen(true); }}
                className="h-24 px-16 rounded-[2rem] bg-rose-600 text-white font-black italic uppercase text-lg flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                 EMERGENCY STOP <AlertTriangle className="w-6 h-6" />
              </button>

              <button 
                onClick={() => {
                   if (activeComponent) return toast.error("Complete component validation first.");
                   if (goodQty === "0") return toast.error("Enter output quantity first.");
                   submitResultMutation.mutate({ 
                      resultQty: Number(goodQty), 
                      notes: `Filing complete. Total reject: ${rejectQty}`, 
                      elapsedSeconds: elapsedTime,
                      downtimeMinutes: Number(downtimeMinutes)
                   });
                }}
                className="h-24 px-16 rounded-[2rem] bg-indigo-500 text-white font-black italic uppercase text-lg flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                 Finalize Filling <ChevronRight className="w-6 h-6" />
              </button>


           </footer>
        </section>
      </main>

      {isBreakdownModalOpen && (
        <Dialog open={isBreakdownModalOpen} onOpenChange={setIsBreakdownModalOpen}>
          <DialogContent className="bg-black border border-white/10 rounded-[2rem] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-rose-500">EMERGENCY STOP</DialogTitle>
              <DialogDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Enter breakdown reason to register the stop protocol.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <textarea
                value={breakdownReason}
                onChange={(e) => setBreakdownReason(e.target.value)}
                placeholder="Describe the issue causing the emergency stop..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold placeholder:text-white/20 resize-none"
                autoFocus
              />
            </div>
            <DialogFooter>
              <button onClick={() => setIsBreakdownModalOpen(false)} className="px-6 py-3 rounded-xl bg-white/5 text-white font-black uppercase text-[10px]">Cancel</button>
              <button
                onClick={() => {
                  if (breakdownReason) reportBreakdownMutation.mutate(breakdownReason);
                  setIsBreakdownModalOpen(false);
                }}
                className="px-6 py-3 rounded-xl bg-rose-600 text-white font-black uppercase text-[10px] hover:bg-rose-500"
              >
                Confirm Stop
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isNumpadOpen && (
        <IndustrialNumpad
          value={numpadValue}
          onChange={setNumpadValue}
          onConfirm={handleNumpadConfirm}
          onClose={() => setIsNumpadOpen(false)}
          label={numpadLabel}
          unit={numpadUnit}
        />
      )}

      {isSupervisorModalOpen && (
        <IndustrialNumpad
          value={supervisorPin}
          onChange={setSupervisorPin}
          onConfirm={() => handleSupervisorOverride(supervisorPin)}
          onClose={() => setIsSupervisorModalOpen(false)}
          label="Supervisor PIN Required"
          unit="AUTH"
          isPassword
        />
      )}

      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
}

function SpecItem({ label, value }: any) {
   return (
      <div className="flex justify-between items-center p-5 rounded-2xl bg-white/[0.02] border border-white/5">
         <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">{label}</span>
         <span className="text-sm font-black italic text-white uppercase">{value}</span>
      </div>
   );
}

function ComponentItem({ name, target, status }: any) {
   return (
      <div className={cn("p-5 rounded-[1.5rem] border transition-all", status === 'active' ? "bg-indigo-500/5 border-indigo-500/20" : status === 'completed' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.01] border-white/5")}>
         <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[8px] font-black uppercase tracking-widest", status === 'active' ? "text-indigo-400" : status === 'completed' ? "text-emerald-500" : "text-white/20")}>{status.toUpperCase()}</span>
            {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
         </div>
         <h4 className={cn("text-xs font-black italic mb-1", status === 'pending' ? "text-white/40" : "text-white")}>{name}</h4>
         <p className="text-[9px] font-bold text-white/20 uppercase tracking-tight">Target: {target}</p>
      </div>
   );
}

function MetricInput({ label, value, unit, status, onClick }: any) {
   return (
      <div onClick={onClick} className={cn("flex flex-col items-center space-y-4 group", onClick && "cursor-pointer")}>
         <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{label}</span>
         <div className={cn("w-full h-28 rounded-[2.5rem] bg-white/[0.03] border flex flex-col items-center justify-center relative overflow-hidden transition-all", status === 'active' ? "border-indigo-500/40" : status === 'warning' ? "border-rose-500/40" : "border-white/5")}>
            <span className="text-2xl font-black italic text-white tracking-tighter">{value}</span>
            <span className="text-[10px] font-black text-white/20 ml-2">{unit}</span>
         </div>
      </div>
   );
}

