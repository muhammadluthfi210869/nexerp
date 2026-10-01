"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  Button,
  DnaBadge,
} from "@/components/dna";
import { ShieldCheck, CalendarDays, MapPin, Zap, AlertCircle } from "lucide-react";
import type { LogisticsItem, FefoData } from "../_types/workstation.types";

interface WorkstationFefoDialogProps {
  selectedIssueItem: LogisticsItem | null;
  onClose: () => void;
  fefoSuggestion: FefoData;
  onConfirmIssue: () => void;
}

export function WorkstationFefoDialog({
  selectedIssueItem,
  onClose,
  fefoSuggestion,
  onConfirmIssue,
}: WorkstationFefoDialogProps) {
  return (
    <Dialog open={!!selectedIssueItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-white rounded-[24px] border border-slate-200 shadow-2xl p-0 overflow-hidden">
        <div className="bg-emerald-600 p-10 text-white relative">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7" />
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
              FEFO <span className="text-emerald-900/50">SECURITY GATE</span>
            </DialogTitle>
          </div>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">
            MANDATORY BATCH RELEASE PROTOCOL
          </p>
          <CalendarDays className="absolute right-10 top-1/2 -translate-y-1/2 h-20 w-20 text-emerald-500 opacity-20" />
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-slate-100 pb-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  TARGET MATERIAL
                </p>
                <p className="text-2xl font-black text-brand-black uppercase italic tracking-tighter mt-1">
                  {selectedIssueItem?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  RELEASE QTY
                </p>
                <p className="text-2xl font-black text-emerald-600 uppercase italic tracking-tighter mt-1 tabular-nums">
                  {selectedIssueItem?.totalRequested} {selectedIssueItem?.unit}
                </p>
              </div>
            </div>

            <div className="p-8 bg-brand-black rounded-[24px] text-white space-y-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-6">
                <DnaBadge
                  status="success"
                  className="bg-emerald-500 text-brand-black border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  BEST MATCH
                </DnaBadge>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                  MANDATORY BATCH NUMBER
                </p>
                <p className="text-4xl font-black italic tracking-tighter text-blue-500 group-hover:scale-105 transition-transform duration-500">
                  #{fefoSuggestion?.suggestedBatch?.batchNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <CalendarDays className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      EXPIRY DATE
                    </p>
                    <p className="text-sm font-black uppercase text-white italic tracking-tighter">
                      {fefoSuggestion?.suggestedBatch?.expDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <MapPin className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      LOCATION
                    </p>
                    <p className="text-sm font-black uppercase text-white italic tracking-tighter">
                      {fefoSuggestion?.suggestedBatch?.location?.name}
                    </p>
                  </div>
                </div>
              </div>
              <Zap className="absolute -right-8 -bottom-8 h-40 w-40 text-white/[0.03] group-hover:rotate-12 transition-transform duration-1000" />
            </div>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-5">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-black text-amber-800 leading-relaxed uppercase italic">
              WARNING: SYSTEM HAS IDENTIFIED THIS BATCH AS THE OLDEST STOCK. RELEASING ANY OTHER BATCH WILL RESULT IN A FEFO VIOLATION AUDIT LOG.
            </p>
          </div>

          <DialogFooter className="gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 italic"
            >
              CANCEL
            </Button>
            <Button
              onClick={onConfirmIssue}
              className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-100 italic border-none transition-all"
            >
              CONFIRM & ISSUE BATCH
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
