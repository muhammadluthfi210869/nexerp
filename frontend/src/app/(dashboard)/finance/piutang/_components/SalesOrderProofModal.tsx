"use client";

import React from "react";
import {
  ShieldCheck,
  Eye,
  CreditCard,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  DnaButton,
  DnaDialog as Dialog,
  DnaDialogContent as DialogContent,
  DnaDialogDescription as DialogDescription,
  DnaDialogFooter as DialogFooter,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { SalesOrderRow } from "../_types/piutang.types";

interface SalesOrderProofModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: SalesOrderRow | null;
}

export function SalesOrderProofModal({
  isOpen,
  onOpenChange,
  selectedOrder,
}: SalesOrderProofModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                Payment <span className="text-amber-400">Verification</span>
              </h3>
              <DialogDescription className="text-blue-200 font-medium uppercase text-[9px] tracking-tight mt-1">
                Audit Protocol for SO #{selectedOrder?.orderNumber}
              </DialogDescription>
            </div>
            <ShieldCheck className="h-10 w-10 text-amber-400 opacity-50" />
          </div>
        </div>
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Transaction</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter italic tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0))}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Expected DP (30%)</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tighter italic tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0) * 0.3)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-tight text-slate-400 flex items-center gap-2">
              <Eye className="h-3 w-3" /> Transferred Proof Document
            </label>
            <div className="aspect-video w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group overflow-hidden relative">
              {selectedOrder?.paymentProofUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-tight mb-4">Proof of transfer uploaded by BussDev</p>
                  <a
                    href={selectedOrder.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-tight py-3 px-8 rounded-xl shadow-sm hover:bg-amber-500 transition-all flex items-center gap-2"
                  >
                    Open Full Document <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <div className="text-center p-10">
                  <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4 opacity-50" />
                  <p className="text-xs font-black text-rose-900/60 uppercase italic">No Proof Document Attached</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="p-10 pt-0 flex gap-4">
          <DnaButton variant="outline" className="flex-1 h-16 rounded-2xl" onClick={() => onOpenChange(false)}>
            Reject & Notify BD
          </DnaButton>
          <DnaButton
            variant="primary"
            className="flex-[2] h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
            disabled={!selectedOrder?.paymentProofUrl}
          >
            Verify & Approve Order
          </DnaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
