"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
} from "@/components/dna";
import { AlertCircle, KeyRound } from "lucide-react";
import type { StockOpnameItem } from "../_types/workstation.types";

interface WorkstationOpnameApprovalDialogProps {
  selectedOpname: StockOpnameItem | null;
  onClose: () => void;
  managerPin: string;
  setManagerPin: (pin: string) => void;
  onAuthorize: () => void;
  isPending: boolean;
}

export function WorkstationOpnameApprovalDialog({
  selectedOpname,
  onClose,
  managerPin,
  setManagerPin,
  onAuthorize,
  isPending,
}: WorkstationOpnameApprovalDialogProps) {
  return (
    <Dialog open={!!selectedOpname} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-[24px] border border-slate-200 shadow-2xl p-0 overflow-hidden">
        <div className="bg-brand-black p-10 text-white relative">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-7 w-7 text-amber-500 animate-pulse" />
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
              AUDIT <span className="text-slate-500">APPROVAL GATE</span>
            </DialogTitle>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">
            DISCREPANCY RECONCILIATION REQUIRED
          </p>
          <KeyRound className="absolute right-10 top-1/2 -translate-y-1/2 h-20 w-20 text-white/5" />
        </div>

        <div className="p-10 space-y-10">
          <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[24px] space-y-6 border border-slate-100 shadow-inner">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  OPNAME NUMBER
                </p>
                <p className="text-xs font-black text-brand-black uppercase italic tracking-tighter">
                  {selectedOpname?.opnameNumber}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  ITEMS AUDITED
                </p>
                <p className="text-xs font-black text-brand-black uppercase italic tracking-tighter">
                  {selectedOpname?.items?.length} MATERIALS
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  VARIANCE VALUE
                </p>
                <p className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter">
                  Rp {selectedOpname?.totalLossValue?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <KeyRound className="h-4 w-4 text-blue-600" />
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  MANAGER AUTHORIZATION PIN
                </label>
              </div>
              <Input
                type="password"
                placeholder="â€¢â€¢â€¢â€¢"
                className="h-16 text-center text-4xl tracking-[1em] font-black border-2 border-slate-100 bg-slate-50 rounded-2xl focus:ring-blue-600/10"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                maxLength={4}
              />
              <p className="text-center text-[9px] font-black text-slate-300 uppercase italic tracking-widest">
                ONLY AUTHORIZED MANAGERS CAN APPROVE STOCK ADJUSTMENTS
              </p>
            </div>
          </div>

          <DialogFooter className="gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 italic"
            >
              DECLINE
            </Button>
            <Button
              onClick={onAuthorize}
              disabled={managerPin.length < 4 || isPending}
              className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-100 italic border-none transition-all"
            >
              {isPending ? "AUTHORIZING..." : "AUTHORIZE ADJUSTMENT"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
