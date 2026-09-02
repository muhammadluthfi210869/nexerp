"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Info, 
  Check,
  AlertCircle,
  ClipboardList,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DnaBadge } from "@/components/dna/DnaBadge";

export interface QcParameter {
  label: string;
  value: string;
  range: string;
  status: "PASS" | "FAIL";
}

interface QcSignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSign: (data: { pin: string; notes: string }) => void;
  batchId: string;
  stage: "INBOUND" | "MIXING" | "FILLING" | "PACKING" | "FINAL";
  parameters: QcParameter[];
}

export default function QcSignatureModal({
  open,
  onClose,
  onSign,
  batchId,
  stage,
  parameters
}: QcSignatureModalProps) {
  const [pin, setPin] = useState("");
  const [notes, setNotes] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  const hasFail = parameters.some(p => p.status === "FAIL");

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(value);
  };

  const handleConfirm = () => {
    if (pin.length === 6) {
      onSign({ pin, notes });
      onClose();
      setPin("");
      setNotes("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-lg overflow-hidden border border-[var(--border-color)]"
          >
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-50 bg-slate-900 text-white overflow-hidden relative">
               <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Security Authorization Hub</span>
                     </div>
                     <h2 className="text-3xl font-black italic tracking-tighter uppercase">QC <span className="text-emerald-500">Sign-Off</span></h2>
                     <div className="flex items-center gap-3 mt-2">
                         <DnaBadge status="default" className="bg-white/10 text-white border-white/20">{batchId}</DnaBadge>
                         <span className="text-slate-500 font-bold">•</span>
                         <DnaBadge status="success">{stage}</DnaBadge>
                     </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="h-12 w-12 rounded-full hover:bg-white/10 text-white transition-all"
                  >
                     <X className="h-6 w-6" />
                  </Button>
               </div>
               <ShieldCheck className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12 pointer-events-none" />
            </div>

            {/* Modal Content */}
            <div className="p-10 space-y-10 overflow-y-auto max-h-[70vh]">
               {/* Parameter Check Section */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5" /> Parameter Verification
                   </h4>
                      {hasFail && (
                        <DnaBadge status="critical" className="animate-pulse">
                           Attention: Fail Status Detected
                        </DnaBadge>
                      )}
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[24px] border border-[var(--border-color)] space-y-4">
                     {parameters.map((param, i) => (
                       <div key={i} className="flex justify-between items-center border-b border-slate-200/50 pb-2 group hover:translate-x-1 transition-transform">
                          <div className="flex items-center gap-3">
                             {param.status === "PASS" ? (
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                             ) : (
                               <AlertCircle className="h-4 w-4 text-rose-500" />
                             )}
                             <span className="text-xs font-black text-slate-900 uppercase italic">{param.label}</span>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                             <div className="flex flex-col items-end">
                                <span className={cn(
                                  "text-xs font-black tabular-nums",
                                  param.status === "PASS" ? "text-emerald-600" : "text-rose-600"
                                )}>
                                   {param.value}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Target: {param.range}</span>
                             </div>
                              <DnaBadge status={param.status === "PASS" ? "success" : "critical"}>
                                 {param.status}
                              </DnaBadge>
                          </div>
                       </div>
                     ))}
                  </div>
                  {hasFail && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3 text-amber-700"
                    >
                       <AlertTriangle className="h-5 w-5 shrink-0" />
                       <p className="text-[10px] font-bold uppercase leading-tight italic">
                          "One or more parameters have FAILED the quality threshold. Authorization should only proceed after Supervisor clearance."
                       </p>
                    </motion.div>
                  )}
               </div>

               {/* Notes Section */}
               <div className="space-y-4">
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" /> Authorization Notes
                   </label>
                  <textarea 
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide additional observations or justification for this sign-off..."
                    className="w-full p-6 bg-slate-50 border border-[var(--border-color)] rounded-[24px] font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                  />
               </div>

               {/* PIN Section */}
               <div className="space-y-6 pt-4">
                  <div className="flex flex-col items-center gap-4">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Lock className="h-4 w-4" />
                        <label className="text-[10px] font-black uppercase tracking-[0.2em]">6-Digit Secure PIN Confirmation</label>
                     </div>
                     <div className="relative w-64 h-20">
                        <Input 
                          type="password" 
                          maxLength={6}
                          value={pin}
                          onChange={handlePinChange}
                          className="w-full h-full bg-slate-900 text-white border-none rounded-[1.5rem] text-center text-4xl font-black tracking-[0.8em] focus:ring-4 focus:ring-emerald-500/20 transition-all"
                        />
                        <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
                           {[...Array(6)].map((_, i) => (
                             <div 
                               key={i} 
                               className={cn(
                                 "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                 i < pin.length ? "bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-200"
                               )} 
                             />
                           ))}
                        </div>
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Authorized Personnel Only</p>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 border-t border-slate-50 bg-white flex flex-col gap-6">
               <div className="flex gap-4">
                  <Button 
                    onClick={onClose}
                    variant="ghost" 
                    className="flex-1 h-16 rounded-[2rem] font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50"
                  >
                     Abort Protocol
                  </Button>
                  <Button 
                    disabled={pin.length !== 6}
                    onClick={handleConfirm}
                    className={cn(
                      "flex-[2] h-16 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl relative overflow-hidden group",
                      pin.length === 6 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 hover:scale-105" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                     <span className="relative z-10 flex items-center justify-center gap-3">
                        <Check className={cn("h-5 w-5 transition-transform", pin.length === 6 && "group-hover:scale-125")} />
                        Tanda Tangani & Setujui
                     </span>
                  </Button>
               </div>
               
               <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
                  <Info className="h-5 w-5 text-slate-400 shrink-0" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed italic">
                     "Dengan menandatangani, saya menyatakan bahwa <span className="text-slate-900 font-black">pengecekkan telah sesuai dengan standar kualitas</span> institusi dan bertanggung jawab penuh atas validitas data."
                  </p>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
